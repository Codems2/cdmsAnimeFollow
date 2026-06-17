import { unflatten } from "devalue";
import type {
  FlvAnime,
  FlvLatestEpisode,
  FlvOnAir,
  FlvSearchItem,
  FlvSearchResult,
  FlvServer,
} from "@/types/animeflv";

// Fuente de datos: AnimeAV1 (https://animeav1.com).
//
// Antes este módulo consumía la API no oficial de AnimeFLV
// (animeflv.ahmedrangel.com). Esa fuente dejó de devolver servidores de
// reproducción porque AnimeFLV bloquea el scraping desde IPs de datacenter
// (la lista `servers` llegaba siempre vacía). AnimeAV1 sí sirve sus datos —
// incluidos los servidores SUB/DUB y streams HLS directos — desde el servidor.
//
// AnimeAV1 es una app SvelteKit: cada ruta expone su `load` serializado en
// `<ruta>/__data.json` (formato `devalue`). No hay API REST oficial, así que
// pedimos ese endpoint y lo deserializamos. Es más estable que parsear el HTML.
//
// Se puede apuntar a otra instancia/mirror con la variable ANIMEAV1_BASE.
const BASE = process.env.ANIMEAV1_BASE ?? "https://animeav1.com";
const CDN = "https://cdn.animeav1.com";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export class AnimeFlvError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AnimeFlvError";
  }
}

// --- helpers de imagen (AnimeAV1 deja `poster` a null y compone la URL por id) ---
const coverUrl = (id: number | string) => `${CDN}/covers/${id}.jpg`;
const screenshotUrl = (mediaId: number, episode: number) =>
  `${CDN}/screenshots/${mediaId}/${episode}.jpg`;

// AnimeAV1 codifica el estado como número en la ficha del anime.
const STATUS_LABEL: Record<number, string> = {
  0: "Finalizado",
  1: "Próximamente",
  2: "En emisión",
};

// --- modelos crudos de AnimeAV1 (solo los campos que usamos) ----------------
interface Av1Media {
  id: number;
  title: string;
  aka?: Record<string, string> | null;
  genres?: { name: string; slug: string }[];
  synopsis?: string | null;
  status?: number | null;
  score?: number | null;
  slug: string;
  category?: { name: string; slug: string } | null;
  episodes?: { id: number; number: number }[];
}

interface Av1Embed {
  server: string;
  url: string;
}

interface Av1LatestEpisode {
  id: number;
  number: number;
  media: { id: number; slug: string; title: string };
}

interface Av1CatalogItem {
  id: number | string;
  title: string;
  synopsis?: string | null;
  slug: string;
  score?: number | null;
  category?: { name: string; slug: string } | null;
}

interface Av1Pagination {
  currentPage: number;
  totalPages: number;
}

/**
 * Pide `<route>/__data.json` a AnimeAV1 y devuelve la data del `load` ya
 * deserializada (devalue). Fusiona todos los nodos `data` (layout + página),
 * de modo que el objeto resultante contiene tanto `user` (layout) como los
 * campos propios de la página (`media`, `embeds`, `results`, …).
 *
 * Devuelve `null` si la respuesta no es utilizable.
 */
async function loadRoute(
  route: string,
  params: URLSearchParams | null,
  revalidate: number,
): Promise<Record<string, unknown> | null> {
  const qs = params && [...params].length ? `?${params}` : "";
  const url = `${BASE}${route}/__data.json${qs}`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate },
  });
  if (!res.ok) {
    throw new AnimeFlvError(`AnimeAV1 respondió ${res.status}`, res.status);
  }

  let json: { nodes?: Array<{ type?: string; data?: unknown[] } | null> };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return null;
  }

  const out: Record<string, unknown> = {};
  for (const node of json.nodes ?? []) {
    if (node?.type === "data" && Array.isArray(node.data)) {
      try {
        Object.assign(out, unflatten(node.data) as Record<string, unknown>);
      } catch {
        // Nodo no deserializable: lo ignoramos y seguimos con el resto.
      }
    }
  }
  return out;
}

/** Resultado de búsqueda vacío (sin coincidencias). */
const EMPTY_SEARCH: FlvSearchResult = {
  currentPage: 1,
  hasNextPage: false,
  previousPage: null,
  nextPage: null,
  foundPages: 0,
  media: [],
};

function toSearchItem(m: Av1CatalogItem): FlvSearchItem {
  return {
    title: m.title,
    slug: m.slug,
    cover: coverUrl(m.id),
    synopsis: m.synopsis ?? null,
    rating: m.score != null ? String(m.score) : null,
    type: m.category?.name ?? null,
  };
}

/** Consulta el catálogo (búsqueda + filtros) y lo adapta a `FlvSearchResult`. */
async function queryCatalog(
  params: URLSearchParams,
  revalidate: number,
): Promise<FlvSearchResult> {
  const data = await loadRoute("/catalogo", params, revalidate);
  const results = (data?.results as Av1CatalogItem[] | undefined) ?? [];
  const pg = (data?.pagination as Av1Pagination | undefined) ?? {
    currentPage: 1,
    totalPages: results.length ? 1 : 0,
  };
  const current = pg.currentPage ?? 1;
  const totalPages = pg.totalPages ?? 1;
  const hasNext = current < totalPages;

  return {
    currentPage: current,
    hasNextPage: hasNext,
    previousPage: current > 1 ? current - 1 : null,
    nextPage: hasNext ? current + 1 : null,
    foundPages: totalPages,
    media: results.map(toSearchItem),
  };
}

/**
 * Busca anime por texto. `page` empieza en 1.
 * Sin coincidencias → lista vacía (no error) para no tumbar la página.
 */
export async function searchAnime(
  query: string,
  page = 1,
): Promise<FlvSearchResult> {
  const params = new URLSearchParams({ search: query, page: String(page) });
  try {
    return await queryCatalog(params, 60);
  } catch {
    return EMPTY_SEARCH;
  }
}

/**
 * Obtiene la ficha de un anime (info + episodios).
 * Devuelve `null` si el slug no existe.
 */
export async function getAnime(slug: string): Promise<FlvAnime | null> {
  const data = await loadRoute(
    `/media/${encodeURIComponent(slug)}`,
    null,
    3600,
  );
  const media = data?.media as Av1Media | undefined;
  // Sin `media` → el título no existe (AnimeAV1 responde con un nodo de error).
  if (!media) return null;

  return {
    title: media.title,
    alternative_titles: media.aka ? Object.values(media.aka) : [],
    status:
      media.status != null ? (STATUS_LABEL[media.status] ?? null) : null,
    rating: media.score != null ? String(media.score) : null,
    type: media.category?.name ?? null,
    cover: coverUrl(media.id),
    synopsis: media.synopsis ?? null,
    genres: (media.genres ?? []).map((g) => g.name),
    episodes: (media.episodes ?? []).map((e) => ({
      number: e.number,
      slug: `${media.slug}-${e.number}`,
      url: `${BASE}/media/${media.slug}/${e.number}`,
    })),
  };
}

/**
 * Obtiene los servidores de reproducción de un episodio (SUB y DUB).
 * Devuelve `null` si el episodio no existe.
 *
 * Los embeds se exponen como servidores reproducibles (iframe) y, cuando hay
 * extractor, también como stream directo para Chromecast/AirPlay. Las opciones
 * de descarga se exponen aparte. Las pistas DUB se etiquetan con " (DUB)".
 */
export async function getEpisodeServers(
  slug: string,
  number: number,
): Promise<FlvServer[] | null> {
  const data = await loadRoute(
    `/media/${encodeURIComponent(slug)}/${number}`,
    null,
    300,
  );
  const embeds = data?.embeds as
    | { SUB?: Av1Embed[]; DUB?: Av1Embed[] }
    | undefined;
  const downloads = data?.downloads as
    | { SUB?: Av1Embed[]; DUB?: Av1Embed[] }
    | undefined;

  // Ni embeds ni descargas → el episodio no existe (o aún no se ha publicado).
  if (!embeds && !downloads) return null;

  const servers: FlvServer[] = [];
  const label = (e: Av1Embed, dub: boolean) =>
    dub ? `${e.server} (DUB)` : e.server;

  for (const e of embeds?.SUB ?? [])
    servers.push({ name: label(e, false), embed: e.url });
  for (const e of embeds?.DUB ?? [])
    servers.push({ name: label(e, true), embed: e.url });
  for (const e of downloads?.SUB ?? [])
    servers.push({ name: label(e, false), download: e.url });
  for (const e of downloads?.DUB ?? [])
    servers.push({ name: label(e, true), download: e.url });

  return servers;
}

/** Últimos episodios publicados (portada = captura del episodio). */
export async function getLatestEpisodes(): Promise<FlvLatestEpisode[]> {
  const data = await loadRoute("", null, 300);
  const list = (data?.latestEpisodes as Av1LatestEpisode[] | undefined) ?? [];
  return list.map((e) => ({
    title: e.media.title,
    number: e.number,
    cover: screenshotUrl(e.media.id, e.number),
    slug: e.media.slug,
    url: `${BASE}/media/${e.media.slug}/${e.number}`,
  }));
}

/** Animes en emisión. */
export async function getAnimesOnAir(): Promise<FlvOnAir[]> {
  const result = await browseAnime({ statuses: ["emision"], order: "updated" });
  return result.media.map((m) => ({
    title: m.title,
    type: m.type ?? null,
    slug: m.slug,
    url: `${BASE}/media/${m.slug}`,
  }));
}

export interface BrowseFilters {
  genres?: string[];
  types?: string[];
  statuses?: string[];
  order?: string;
  page?: number;
}

// El estado puede llegar como el valor heredado de AnimeFLV ("1"/"2"/"3") o ya
// como slug de AnimeAV1: ambos se normalizan al slug que espera el catálogo.
const STATUS_SLUG: Record<string, string> = {
  "1": "emision",
  "2": "finalizado",
  "3": "proximamente",
  emision: "emision",
  finalizado: "finalizado",
  proximamente: "proximamente",
};

// AnimeAV1 ordena por "score" donde AnimeFLV usaba "rating".
const ORDER_SLUG: Record<string, string> = {
  updated: "updated",
  added: "added",
  title: "title",
  rating: "score",
  score: "score",
};

/** Explora el catálogo con filtros (género, tipo, estado, orden). */
export async function browseAnime(
  filters: BrowseFilters,
): Promise<FlvSearchResult> {
  const params = new URLSearchParams();
  for (const g of filters.genres ?? []) if (g) params.append("genre", g);
  for (const t of filters.types ?? []) if (t) params.append("category", t);

  // El catálogo de AnimeAV1 admite un único estado.
  const status = (filters.statuses ?? []).find(Boolean);
  if (status) params.set("status", STATUS_SLUG[status] ?? status);

  if (filters.order && filters.order !== "default") {
    params.set("order", ORDER_SLUG[filters.order] ?? filters.order);
  }
  params.set("page", String(filters.page ?? 1));

  try {
    return await queryCatalog(params, 300);
  } catch {
    return EMPTY_SEARCH;
  }
}
