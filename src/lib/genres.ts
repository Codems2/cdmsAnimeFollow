// Catálogos de filtros de AnimeAV1 para la página Explorar.

/** Convierte un nombre de género a su slug (sin acentos, en kebab). */
export function genreToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface Option {
  value: string;
  label: string;
}

// Géneros de AnimeAV1 (slug → etiqueta). Ordenados alfabéticamente.
export const GENRES: Option[] = [
  ["accion", "Acción"],
  ["antropomorfico", "Antropomórfico"],
  ["artes-marciales", "Artes Marciales"],
  ["aventura", "Aventura"],
  ["carreras", "Carreras"],
  ["ciencia-ficcion", "Ciencia Ficción"],
  ["comedia", "Comedia"],
  ["deportes", "Deportes"],
  ["detectives", "Detectives"],
  ["drama", "Drama"],
  ["ecchi", "Ecchi"],
  ["elenco-adulto", "Elenco Adulto"],
  ["escolares", "Escolares"],
  ["espacial", "Espacial"],
  ["fantasia", "Fantasía"],
  ["gore", "Gore"],
  ["gourmet", "Gourmet"],
  ["harem", "Harem"],
  ["historico", "Histórico"],
  ["idols-hombre", "Idols (Hombre)"],
  ["idols-mujer", "Idols (Mujer)"],
  ["infantil", "Infantil"],
  ["isekai", "Isekai"],
  ["josei", "Josei"],
  ["juegos-estrategia", "Juegos Estrategia"],
  ["mahou-shoujo", "Mahou Shoujo"],
  ["mecha", "Mecha"],
  ["militar", "Militar"],
  ["misterio", "Misterio"],
  ["mitologia", "Mitología"],
  ["musica", "Música"],
  ["parodia", "Parodia"],
  ["psicologico", "Psicológico"],
  ["recuentos-de-la-vida", "Recuentos de la Vida"],
  ["romance", "Romance"],
  ["samurai", "Samurai"],
  ["seinen", "Seinen"],
  ["shoujo", "Shoujo"],
  ["shoujo-ai", "Shoujo Ai"],
  ["shounen", "Shounen"],
  ["shounen-ai", "Shounen Ai"],
  ["sobrenatural", "Sobrenatural"],
  ["superpoderes", "Superpoderes"],
  ["suspenso", "Suspenso"],
  ["terror", "Terror"],
  ["vampiros", "Vampiros"],
].map(([value, label]) => ({ value, label }));

// Categorías de AnimeAV1 (el filtro `category` del catálogo usa estos slugs).
export const TYPES: Option[] = [
  { value: "tv-anime", label: "TV" },
  { value: "pelicula", label: "Película" },
  { value: "ova", label: "OVA" },
  { value: "especial", label: "Especial" },
];

export const STATUSES: Option[] = [
  { value: "1", label: "En emisión" },
  { value: "2", label: "Finalizado" },
  { value: "3", label: "Próximamente" },
];

export const ORDERS: Option[] = [
  { value: "default", label: "Por defecto" },
  { value: "updated", label: "Recién actualizados" },
  { value: "added", label: "Recién agregados" },
  { value: "title", label: "Título" },
  { value: "rating", label: "Valoración" },
];
