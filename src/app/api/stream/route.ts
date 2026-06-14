import { type NextRequest, NextResponse } from "next/server";
import { resolveStream } from "@/lib/extractors";

// Resuelve la URL de un `embed` a un stream directo (.mp4 / .m3u8).
// Se ejecuta en servidor (no en el navegador) para esquivar CORS al rascar la
// página del host y para poder enviar el User-Agent/Referer que estos exigen.
//
// Respuesta: { type, url, referer? }  ó  404 si no se pudo resolver.
export async function GET(req: NextRequest) {
  const embed = req.nextUrl.searchParams.get("embed");
  if (!embed || !/^https?:\/\//i.test(embed)) {
    return NextResponse.json({ error: "bad_embed" }, { status: 400 });
  }

  const resolved = await resolveStream(embed);
  if (!resolved) {
    // No hay extractor o falló: el cliente debe usar el iframe.
    return NextResponse.json({ error: "not_resolvable" }, { status: 404 });
  }

  return NextResponse.json(resolved, {
    // Cachea brevemente en CDN: los tokens de estos hosts caducan rápido.
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
