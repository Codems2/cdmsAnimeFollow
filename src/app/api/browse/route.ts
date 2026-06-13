import { type NextRequest, NextResponse } from "next/server";
import { browseAnime } from "@/lib/animeflv";

/** Endpoint interno para el scroll infinito de la página Explorar. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await browseAnime({
      genres: sp.getAll("genre"),
      types: sp.getAll("type"),
      statuses: sp.getAll("status"),
      order: sp.get("order") ?? undefined,
      page: Number(sp.get("page")) || 1,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "browse_failed" }, { status: 502 });
  }
}
