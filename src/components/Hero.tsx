import Image from "next/image";
import Link from "next/link";
import { animeSlugFromEpisode, type FlvLatestEpisode } from "@/types/animeflv";

/** Banner destacado a partir del último episodio publicado. */
export function Hero({ episode }: { episode: FlvLatestEpisode }) {
  const animeSlug = animeSlugFromEpisode(episode.slug, episode.number);

  return (
    <Link
      href={`/anime/${animeSlug}/${episode.number}`}
      // min-h + items-end: el hero crece con el contenido en vez de recortarlo.
      className="group animate-scale-in relative mb-12 flex min-h-[19rem] items-end overflow-hidden rounded-3xl ring-1 ring-white/10 sm:min-h-[22rem]"
    >
      {episode.cover && (
        <Image
          src={episode.cover}
          alt={episode.title}
          fill
          priority
          sizes="100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080b] via-[#08080b]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08080b]/80 via-transparent to-transparent" />

      <div className="relative w-full max-w-2xl p-6 sm:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200 ring-1 ring-violet-400/30 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
          Último episodio
        </span>
        <h2 className="mt-3 line-clamp-2 text-2xl font-bold leading-tight drop-shadow-lg sm:text-4xl">
          {episode.title}
        </h2>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition group-hover:scale-105 group-hover:shadow-violet-500/50">
          ▶ Ver episodio {episode.number}
        </span>
      </div>
    </Link>
  );
}
