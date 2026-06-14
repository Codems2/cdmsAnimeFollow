// Extractores de stream directo a partir de la URL de `embed` de cada host.
//
// El reproductor de AnimeFLV solo nos da un iframe (`embed`) de un host externo.
// Para poder usar un <video> nativo (y así lanzar a Chromecast / AirPlay) hace
// falta la URL directa del .mp4 / .m3u8, que vive dentro de ese iframe ajeno.
//
// Cada extractor descarga la página del embed (esto ocurre SIEMPRE en servidor,
// vía la API route /api/stream) y rasca de ella la URL real del vídeo.
//
// IMPORTANTE — fragilidad conocida:
//  - El HTML de estos hosts cambia con frecuencia; un extractor puede dejar de
//    funcionar sin previo aviso.
//  - Algunos hosts (Streamtape, Streamwish, …) bloquean las peticiones que vienen
//    de IPs de datacenter (403 / Cloudflare 1005), así que la extracción puede
//    fallar también en producción. Por eso TODO extractor puede devolver `null`
//    y el reproductor cae de vuelta al iframe original.

export type StreamType = "mp4" | "hls";

export interface ResolvedStream {
  /** URL directa del vídeo (mp4 progresivo o manifiesto HLS). */
  url: string;
  type: StreamType;
  /**
   * Referer que el host exige para servir el stream. Cuando está presente, el
   * vídeo debe reproducirse a través de nuestro proxy (que añade esta cabecera),
   * porque el navegador y el Chromecast no la enviarían por su cuenta.
   */
  referer?: string;
}

interface Extractor {
  /** Nombre legible (coincide con `FlvServer.name` cuando es posible). */
  id: string;
  /** ¿Esta URL de embed le corresponde a este extractor? */
  match: (embed: string) => boolean;
  resolve: (embed: string) => Promise<ResolvedStream | null>;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchText(url: string, referer?: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,*/*",
      ...(referer ? { Referer: referer } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.text();
}

function absolutize(url: string, base: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return "https:" + url;
  return new URL(url, base).toString();
}

// ── YourUpload ────────────────────────────────────────────────────────────
// El embed incrusta jwplayer con `file: 'https://vidcache.net:PORT/.../video.mp4'`.
// El CDN exige Referer de yourupload, así que se reproduce vía proxy.
const yourupload: Extractor = {
  id: "YourUpload",
  match: (e) => /yourupload\.com/i.test(e),
  async resolve(embed) {
    const html = await fetchText(embed);
    // Vídeo retirado/bloqueado (DMCA o geo): no hay stream que extraer.
    if (/content restricted|dmca complaint|video not found/i.test(html)) {
      return null;
    }
    const m =
      html.match(/file:\s*'([^']+\.mp4[^']*)'/i) ??
      html.match(/file:\s*"([^"]+\.mp4[^"]*)"/i);
    if (!m) return null;
    return {
      url: absolutize(m[1], embed),
      type: "mp4",
      referer: "https://www.yourupload.com/",
    };
  },
};

// ── Streamtape ──────────────────────────────────────────────────────────────
// La URL del vídeo se construye en cliente: un <div id="robotlink"> trae el
// enlace parcial y un `('…').substring(n)` completa el token.
// Best-effort: Streamtape suele bloquear IPs de servidor (→ null → iframe).
const streamtape: Extractor = {
  id: "Stape",
  match: (e) => /streamtape\.com|stape\.|streamta/i.test(e),
  async resolve(embed) {
    const html = await fetchText(embed);
    const base = html.match(/id=["'](?:robotlink|ideoooolink)["']>([^<]+)</i)?.[1];
    if (!base) return null;
    const sub =
      html.match(/\(['"]([^'"]+)['"]\)\.substring\((\d+)\)/i) ?? null;
    let path = base.trim();
    if (sub) path += sub[1].substring(Number(sub[2]));
    // Streamtape devuelve `//streamtape.com/get_video?...`; falta el esquema.
    const url = absolutize(path, "https://streamtape.com/");
    if (!/get_video/i.test(url)) return null;
    return { url, type: "mp4", referer: "https://streamtape.com/" };
  },
};

// ── Okru (ok.ru / OK Video) ──────────────────────────────────────────────────
// El embed es un shell JS; los metadatos se piden a su endpoint, que devuelve
// JSON con las calidades mp4 (`videos`) y/o un manifiesto HLS. Devuelve null si
// el vídeo está restringido por copyright (frecuente en títulos populares).
const okru: Extractor = {
  id: "Okru",
  match: (e) => /ok\.ru|odnoklassniki/i.test(e),
  async resolve(embed) {
    const mid = embed.match(/(?:videoembed|video)\/(\d+)/)?.[1];
    if (!mid) return null;
    const res = await fetch(`https://ok.ru/dk?cmd=videoPlayerMetadata&mid=${mid}`, {
      method: "POST",
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      error?: string;
      videos?: { name: string; url: string }[];
      hlsManifestUrl?: string;
    };
    if (data.error) return null;

    // Preferimos el mp4 de mayor calidad; si no hay, usamos el HLS.
    const order = ["mobile", "lowest", "low", "sd", "hd", "full", "quad", "ultra"];
    const best = (data.videos ?? [])
      .filter((v) => v.url)
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
      .pop();
    if (best) {
      return { url: absolutize(best.url.replace(/\\u0026/g, "&"), embed), type: "mp4" };
    }
    if (data.hlsManifestUrl) {
      return { url: data.hlsManifestUrl.replace(/\\u0026/g, "&"), type: "hls" };
    }
    return null;
  },
};

const EXTRACTORS: Extractor[] = [yourupload, okru, streamtape];

/**
 * Intenta resolver la URL de embed a un stream directo reproducible.
 * Devuelve `null` cuando no hay extractor o cuando este falla (el llamador
 * debe entonces caer de vuelta al iframe).
 */
export async function resolveStream(embed: string): Promise<ResolvedStream | null> {
  const extractor = EXTRACTORS.find((x) => x.match(embed));
  if (!extractor) return null;
  try {
    return await extractor.resolve(embed);
  } catch {
    return null;
  }
}

/** ¿Tenemos *en teoría* un extractor para esta URL? (No garantiza que funcione.) */
export function isExtractable(embed: string | undefined): boolean {
  return Boolean(embed) && EXTRACTORS.some((x) => x.match(embed!));
}
