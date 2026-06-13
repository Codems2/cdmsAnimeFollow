import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeList } from "@/components/EpisodeList";
import { Player } from "@/components/Player";
import { getAnime, getEpisodeServers } from "@/lib/animeflv";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;
  const epNumber = Number(number);
  if (!Number.isInteger(epNumber) || epNumber < 1) {
    notFound();
  }

  const [anime, servers] = await Promise.all([
    getAnime(slug),
    getEpisodeServers(slug, epNumber),
  ]);

  if (!anime || servers === null) {
    notFound();
  }

  // Episodios disponibles para navegar (prev/next) según la ficha.
  const numbers = anime.episodes.map((e) => e.number);
  const hasPrev = numbers.includes(epNumber - 1);
  const hasNext = numbers.includes(epNumber + 1);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/anime/${slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-white/60 transition hover:text-white"
      >
        ← {anime.title}
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-baseline gap-3">
            <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1 text-sm font-bold">
              Ep {epNumber}
            </span>
            <h1 className="truncate text-lg font-semibold sm:text-xl">
              {anime.title}
            </h1>
          </div>

          <Player
            servers={servers}
            anime={{ slug, title: anime.title, cover: anime.cover }}
            episode={epNumber}
          />

          <nav className="mt-6 flex items-center justify-between gap-3 text-sm">
            {hasPrev ? (
              <Link
                href={`/anime/${slug}/${epNumber - 1}`}
                className="rounded-full bg-white/10 px-5 py-2.5 font-medium ring-1 ring-white/10 transition hover:bg-white/20"
              >
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            {hasNext ? (
              <Link
                href={`/anime/${slug}/${epNumber + 1}`}
                className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 font-medium shadow-lg shadow-violet-500/30 transition hover:shadow-violet-500/50"
              >
                Siguiente episodio →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>

        <aside className="lg:w-80 lg:shrink-0">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/50">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-500" />
            Episodios
          </h2>
          <div className="rounded-2xl bg-white/[0.02] p-2 ring-1 ring-white/10 lg:max-h-[70vh] lg:overflow-y-auto">
            <EpisodeList
              slug={slug}
              episodes={anime.episodes}
              variant="list"
              currentEpisode={epNumber}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
