import type {
  FlvAnime,
  FlvLatestEpisode,
  FlvOnAir,
  FlvSearchResult,
  FlvServer,
} from "@/types/animeflv";

// Base de la API de AnimeFLV. Se puede sobreescribir con una instancia propia
// (self-host) mediante la variable de entorno ANIMEFLV_API_BASE.
const API_BASE =
  process.env.ANIMEFLV_API_BASE ?? "https://animeflv.ahmedrangel.com/api";

interface FlvResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class AnimeFlvError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AnimeFlvError";
  }
}

/**
 * Llama a la API de AnimeFLV y devuelve el campo `data`.
 * Lanza `AnimeFlvError` (con el status) si la respuesta no es correcta.
 */
async function flvFetch<T>(
  path: string,
  revalidate = 600,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    next: { revalidate },
  });

  let json: FlvResponse<T> | null = null;
  try {
    json = (await res.json()) as FlvResponse<T>;
  } catch {
    // Cuerpo no-JSON: nos quedamos con el status.
  }

  if (!res.ok || !json?.success) {
    throw new AnimeFlvError(
      json?.message ?? `AnimeFLV respondió ${res.status}`,
      res.status,
    );
  }
  return json.data;
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

/**
 * Busca anime por texto. `page` empieza en 1.
 * Cuando no hay coincidencias la API responde 404: lo tratamos como lista
 * vacía en lugar de propagar un error (que tumbaría la página).
 */
export async function searchAnime(
  query: string,
  page = 1,
): Promise<FlvSearchResult> {
  const qs = new URLSearchParams({ query, page: String(page) });
  try {
    // La búsqueda no se cachea mucho: el catálogo cambia y los términos varían.
    return await flvFetch<FlvSearchResult>(`/search?${qs}`, 60);
  } catch (err) {
    if (err instanceof AnimeFlvError && (err.status === 404 || err.status === 500)) {
      return EMPTY_SEARCH;
    }
    throw err;
  }
}

/**
 * Obtiene la ficha de un anime (info + episodios).
 * Devuelve `null` si el slug no existe.
 */
export async function getAnime(slug: string): Promise<FlvAnime | null> {
  try {
    return await flvFetch<FlvAnime>(`/anime/${encodeURIComponent(slug)}`, 3600);
  } catch (err) {
    if (err instanceof AnimeFlvError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Obtiene los servidores de reproducción de un episodio.
 * Devuelve `null` si el episodio no existe.
 */
export async function getEpisodeServers(
  slug: string,
  number: number,
): Promise<FlvServer[] | null> {
  try {
    const data = await flvFetch<{ servers: FlvServer[] }>(
      `/anime/${encodeURIComponent(slug)}/episode/${number}`,
      300,
    );
    return data.servers ?? [];
  } catch (err) {
    if (err instanceof AnimeFlvError && err.status === 404) return null;
    throw err;
  }
}

/** Últimos episodios publicados. */
export function getLatestEpisodes(): Promise<FlvLatestEpisode[]> {
  return flvFetch<FlvLatestEpisode[]>("/list/latest-episodes", 300);
}

/** Animes en emisión. */
export function getAnimesOnAir(): Promise<FlvOnAir[]> {
  return flvFetch<FlvOnAir[]>("/list/animes-on-air", 600);
}

export interface BrowseFilters {
  genres?: string[];
  types?: string[];
  statuses?: string[];
  order?: string;
  page?: number;
}

/** Explora el catálogo con filtros (género, tipo, estado, orden). */
export async function browseAnime(
  filters: BrowseFilters,
): Promise<FlvSearchResult> {
  const body: Record<string, unknown> = {};
  if (filters.genres?.length) body.genres = filters.genres;
  if (filters.types?.length) body.types = filters.types;
  // La API exige los estados como números (1=emisión, 2=finalizado, 3=próximo).
  if (filters.statuses?.length) {
    const nums = filters.statuses.map(Number).filter((n) => !Number.isNaN(n));
    if (nums.length) body.statuses = nums;
  }
  if (filters.order && filters.order !== "default") body.order = filters.order;

  // Importante: `page` debe ir como query param; en el body la API lo ignora.
  const res = await fetch(`${API_BASE}/search/by-filter?page=${filters.page ?? 1}`, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });

  const json = (await res.json().catch(() => null)) as FlvResponse<FlvSearchResult> | null;
  if (!res.ok || !json?.success) {
    // Sin resultados para estos filtros → lista vacía, no un error.
    if (res.status === 404 || res.status === 500) return EMPTY_SEARCH;
    throw new AnimeFlvError(
      json?.message ?? `AnimeFLV respondió ${res.status}`,
      res.status,
    );
  }
  return json.data;
}
