// Catálogos de filtros de AnimeFLV para la página Explorar.

/** Convierte un nombre de género de AnimeFLV a su slug (sin acentos, en kebab). */
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

export const GENRES: Option[] = [
  ["accion", "Acción"],
  ["artes-marciales", "Artes Marciales"],
  ["aventura", "Aventura"],
  ["carreras", "Carreras"],
  ["ciencia-ficcion", "Ciencia Ficción"],
  ["comedia", "Comedia"],
  ["demencia", "Demencia"],
  ["demonios", "Demonios"],
  ["deportes", "Deportes"],
  ["drama", "Drama"],
  ["ecchi", "Ecchi"],
  ["escolares", "Escolares"],
  ["espacial", "Espacial"],
  ["fantasia", "Fantasía"],
  ["harem", "Harem"],
  ["historico", "Histórico"],
  ["infantil", "Infantil"],
  ["josei", "Josei"],
  ["juegos", "Juegos"],
  ["magia", "Magia"],
  ["mecha", "Mecha"],
  ["militar", "Militar"],
  ["misterio", "Misterio"],
  ["musica", "Música"],
  ["parodia", "Parodia"],
  ["policia", "Policía"],
  ["psicologico", "Psicológico"],
  ["recuentos-de-la-vida", "Recuentos de la vida"],
  ["romance", "Romance"],
  ["samurai", "Samurai"],
  ["seinen", "Seinen"],
  ["shoujo", "Shoujo"],
  ["shounen", "Shounen"],
  ["sobrenatural", "Sobrenatural"],
  ["superpoderes", "Superpoderes"],
  ["suspenso", "Suspenso"],
  ["terror", "Terror"],
  ["vampiros", "Vampiros"],
  ["yaoi", "Yaoi"],
  ["yuri", "Yuri"],
].map(([value, label]) => ({ value, label }));

export const TYPES: Option[] = [
  { value: "tv", label: "TV" },
  { value: "movie", label: "Película" },
  { value: "special", label: "Especial" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
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
