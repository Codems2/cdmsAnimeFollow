import { type NextRequest, NextResponse } from "next/server";

// Proxy de streaming. Reenvía el vídeo del host externo añadiendo el `Referer`
// (y User-Agent) que exige, y devolviéndolo con CORS abierto. Esto permite que:
//   1. el <video> del navegador reproduzca hosts que filtran por Referer, y
//   2. el Chromecast (que descarga la URL por su cuenta) pueda acceder al stream
//      sirviéndolo desde nuestro propio origen público.
//
// Soporta peticiones Range (necesarias para hacer seek) y reescribe los
// manifiestos HLS para que sus segmentos también pasen por el proxy.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};

/** Bloquea destinos no http(s) o claramente internos (anti-SSRF básico). */
function isAllowed(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "[::1]"
  ) {
    return null;
  }
  return u;
}

function proxify(targetUrl: string, referer: string, origin: string): string {
  const qs = new URLSearchParams({ url: targetUrl });
  if (referer) qs.set("ref", referer);
  return `${origin}/api/stream/proxy?${qs}`;
}

/** Reescribe las URIs de un manifiesto HLS para que pasen por este proxy. */
function rewriteManifest(
  text: string,
  manifestUrl: string,
  referer: string,
  origin: string,
): string {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      // Atributos URI="..." (EXT-X-KEY, EXT-X-MEDIA, EXT-X-MAP…).
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          const abs = new URL(uri, manifestUrl).toString();
          return `URI="${proxify(abs, referer, origin)}"`;
        });
      }
      // Línea de recurso (segmento o sub-playlist).
      const abs = new URL(trimmed, manifestUrl).toString();
      return proxify(abs, referer, origin);
    })
    .join("\n");
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  return handle(req, "GET");
}

export async function HEAD(req: NextRequest) {
  return handle(req, "HEAD");
}

async function handle(req: NextRequest, method: "GET" | "HEAD") {
  const sp = req.nextUrl.searchParams;
  const target = isAllowed(sp.get("url") ?? "");
  if (!target) {
    return NextResponse.json({ error: "bad_url" }, { status: 400 });
  }
  const referer = sp.get("ref") ?? "";

  const range = req.headers.get("range");
  const upstream = await fetch(target, {
    method,
    headers: {
      "User-Agent": UA,
      Accept: "*/*",
      ...(referer ? { Referer: referer } : {}),
      ...(range ? { Range: range } : {}),
    },
    cache: "no-store",
    redirect: "follow",
  });

  const contentType = upstream.headers.get("content-type") ?? "";
  const isHls =
    /mpegurl|vnd\.apple\.mpegurl/i.test(contentType) ||
    /\.m3u8(\?|$)/i.test(target.pathname + target.search);

  // Manifiestos HLS: reescribir para que los segmentos pasen por el proxy.
  if (method === "GET" && isHls) {
    const text = await upstream.text();
    const origin = req.nextUrl.origin;
    const body = rewriteManifest(text, upstream.url || target.href, referer, origin);
    return new NextResponse(body, {
      status: upstream.status === 206 ? 200 : upstream.status,
      headers: {
        ...CORS,
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
      },
    });
  }

  // Resto (mp4 progresivo, segmentos .ts): reenviar el cuerpo tal cual.
  const headers = new Headers(CORS);
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("accept-ranges")) headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "no-store");

  return new NextResponse(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}
