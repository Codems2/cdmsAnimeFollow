"use client";

import { toggleFavorite, useIsFavorite, type AnimeRef } from "@/lib/library";

export function FavoriteButton({ anime }: { anime: AnimeRef }) {
  const isFav = useIsFavorite(anime.slug);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(anime)}
      aria-pressed={isFav}
      className={`inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-95 ${
        isFav
          ? "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15"
          : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
      }`}
    >
      <span aria-hidden className={isFav ? "text-violet-300" : ""}>
        {isFav ? "✓" : "+"}
      </span>
      {isFav ? "En Mi Lista" : "Añadir a Mi Lista"}
    </button>
  );
}
