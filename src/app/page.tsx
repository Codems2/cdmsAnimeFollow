import Link from "next/link";
import { AnimeCard } from "@/components/AnimeCard";
import { ContinueWatching } from "@/components/ContinueWatching";
import { EpisodeCard } from "@/components/EpisodeCard";
import { Hero } from "@/components/Hero";
import { SectionHeading } from "@/components/SectionHeading";
import { browseAnime, getLatestEpisodes } from "@/lib/animeflv";

export default async function Home() {
  const [latest, onAir] = await Promise.all([
    getLatestEpisodes(),
    // En emisión con portadas (el endpoint by-filter sí devuelve cover).
    browseAnime({ statuses: ["1"], order: "updated", page: 1 }),
  ]);

  const [featured, ...restLatest] = latest;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {featured && <Hero episode={featured} />}

      <ContinueWatching />

      <section className="mb-12">
        <SectionHeading title="Últimos episodios" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {restLatest.map((ep, i) => (
            <EpisodeCard key={ep.slug} episode={ep} index={i} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          title="En emisión"
          action={
            <Link
              href="/explorar?status=1&order=updated"
              className="text-sm text-white/50 transition hover:text-white"
            >
              Ver todo →
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {onAir.media.slice(0, 18).map((anime, i) => (
            <AnimeCard
              key={anime.slug}
              slug={anime.slug}
              title={anime.title}
              cover={anime.cover}
              rating={anime.rating}
              subtitle={anime.type}
              index={i}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
