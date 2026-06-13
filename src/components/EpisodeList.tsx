"use client";

import Link from "next/link";
import { toggleWatched, useWatched } from "@/lib/library";
import type { FlvEpisode } from "@/types/animeflv";

export function EpisodeList({
  slug,
  episodes,
  variant = "grid",
  currentEpisode,
}: {
  slug: string;
  episodes: FlvEpisode[];
  /** "grid" (ficha) o "list" (barra del reproductor). */
  variant?: "grid" | "list";
  /** Episodio que se está viendo ahora (para resaltarlo). */
  currentEpisode?: number;
}) {
  const watched = useWatched(slug);
  const watchedSet = new Set(watched);
  const nextUp = episodes.find((e) => !watchedSet.has(e.number))?.number;

  if (episodes.length === 0) {
    return <p className="text-sm text-white/50">No hay episodios disponibles.</p>;
  }

  if (variant === "list") {
    return (
      <ul className="flex flex-col gap-1">
        {episodes.map((ep) => {
          const isWatched = watchedSet.has(ep.number);
          const isCurrent = ep.number === currentEpisode;
          const isNext = !isCurrent && ep.number === nextUp;
          return (
            <li
              key={ep.number}
              className={`group flex items-center rounded-xl transition ${
                isCurrent
                  ? "bg-gradient-to-r from-violet-500/25 to-fuchsia-500/15 ring-1 ring-violet-400/40"
                  : "hover:bg-white/[0.06]"
              }`}
            >
              <Link
                href={`/anime/${slug}/${ep.number}`}
                className="flex flex-1 items-center gap-2 px-3 py-2.5 text-sm"
              >
                <span
                  className={`tabular-nums ${
                    isCurrent
                      ? "font-semibold text-white"
                      : isWatched
                        ? "text-white/40"
                        : "text-white/85"
                  }`}
                >
                  Episodio {ep.number}
                </span>
                {isCurrent && (
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-violet-300">
                    viendo
                  </span>
                )}
                {isNext && (
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-white/40">
                    siguiente
                  </span>
                )}
              </Link>
              <WatchedToggle
                slug={slug}
                number={ep.number}
                isWatched={isWatched}
              />
            </li>
          );
        })}
      </ul>
    );
  }

  // variant === "grid"
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8">
      {episodes.map((ep) => {
        const isWatched = watchedSet.has(ep.number);
        const isCurrent = ep.number === currentEpisode;
        const isNext = !isCurrent && ep.number === nextUp;
        return (
          <li key={ep.number} className="group relative">
            <Link
              href={`/anime/${slug}/${ep.number}`}
              className={`flex items-center justify-center rounded-xl px-2 py-2.5 text-xs font-medium transition active:scale-95 ${
                isWatched
                  ? "bg-white/[0.04] text-white/40 hover:bg-white/10 hover:text-white/70"
                  : "bg-white/[0.07] text-white/80 hover:bg-white/15 hover:text-white"
              } ${
                isCurrent
                  ? "bg-gradient-to-r from-violet-500/30 to-fuchsia-500/20 text-white ring-1 ring-violet-400/50"
                  : isNext
                    ? "ring-1 ring-violet-400/40"
                    : ""
              }`}
            >
              Ep {ep.number}
            </Link>
            <WatchedToggle
              slug={slug}
              number={ep.number}
              isWatched={isWatched}
              floating
            />
          </li>
        );
      })}
    </ul>
  );
}

/** Botón para marcar/desmarcar visto. Limpio: el check solo se ve si está
 *  visto o al pasar el cursor. */
function WatchedToggle({
  slug,
  number,
  isWatched,
  floating = false,
}: {
  slug: string;
  number: number;
  isWatched: boolean;
  floating?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => toggleWatched(slug, number)}
      aria-label={
        isWatched
          ? `Marcar episodio ${number} como no visto`
          : `Marcar episodio ${number} como visto`
      }
      title={isWatched ? "Visto — clic para desmarcar" : "Marcar como visto"}
      className={
        floating
          ? `absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] leading-none transition ${
              isWatched
                ? "bg-emerald-500 text-white"
                : "bg-black/40 text-white/60 opacity-0 hover:text-white group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            }`
          : `mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition ${
              isWatched
                ? "bg-emerald-500/90 text-white"
                : "text-white/30 hover:bg-white/10 hover:text-white"
            }`
      }
    >
      ✓
    </button>
  );
}
