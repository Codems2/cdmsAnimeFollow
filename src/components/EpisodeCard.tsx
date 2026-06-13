import Image from "next/image";
import Link from "next/link";
import { animeSlugFromEpisode, type FlvLatestEpisode } from "@/types/animeflv";

export function EpisodeCard({
  episode,
  index = 0,
}: {
  episode: FlvLatestEpisode;
  index?: number;
}) {
  const animeSlug = animeSlugFromEpisode(episode.slug, episode.number);

  return (
    <Link
      href={`/anime/${animeSlug}/${episode.number}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className="group animate-fade-up flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:ring-violet-400/40 hover:shadow-[0_12px_40px_-12px] hover:shadow-violet-500/40"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-white/5">
        {episode.cover && (
          <Image
            src={episode.cover}
            alt={episode.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* Botón play que aparece al pasar el cursor */}
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur">
            ▶
          </span>
        </span>
        <span className="absolute bottom-2 left-2 rounded-full bg-violet-600/90 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
          Ep {episode.number}
        </span>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-violet-200">
          {episode.title}
        </h3>
      </div>
    </Link>
  );
}
