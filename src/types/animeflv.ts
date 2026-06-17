// Modelos de dominio del reproductor. Los datos provienen de AnimeAV1
// (animeav1.com); `src/lib/animeflv.ts` los adapta a estas formas.

/** Un episodio dentro de la ficha de un anime. */
export interface FlvEpisode {
  number: number;
  slug: string;
  url: string;
}

/** Ficha completa de un anime. */
export interface FlvAnime {
  title: string;
  alternative_titles: string[];
  status: string | null;
  rating: string | null;
  type: string | null;
  cover: string | null;
  synopsis: string | null;
  genres: string[];
  episodes: FlvEpisode[];
}

/** Un servidor de reproducción (embed de un host externo). */
export interface FlvServer {
  name: string;
  /** URL de iframe para incrustar el reproductor del host. */
  embed?: string;
  /** URL de descarga directa, cuando el host la ofrece. */
  download?: string;
}

/** Resultado de búsqueda (catálogo). */
export interface FlvSearchItem {
  title: string;
  slug: string;
  cover: string | null;
  synopsis: string | null;
  rating: string | null;
  type?: string | null;
}

export interface FlvSearchResult {
  currentPage: number;
  hasNextPage: boolean;
  previousPage: number | null;
  nextPage: number | null;
  foundPages: number;
  media: FlvSearchItem[];
}

/** Último episodio publicado (listado de la home). */
export interface FlvLatestEpisode {
  title: string;
  number: number;
  cover: string | null;
  slug: string;
  url: string;
}

/** Anime en emisión. */
export interface FlvOnAir {
  title: string;
  type: string | null;
  slug: string;
  url: string;
}
