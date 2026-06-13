import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeList } from "@/components/EpisodeList";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SectionHeading } from "@/components/SectionHeading";
import { getAnime } from "@/lib/animeflv";
import { genreToSlug } from "@/lib/genres";

export default async function AnimePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const anime = await getAnime(slug);
  if (!anime) {
    notFound();
  }

  const meta = [anime.type, anime.status].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      {/* Cabecera con fondo difuminado de la portada */}
      <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
        {anime.cover && (
          <div className="absolute inset-0 -z-10">
            <Image
              src={anime.cover}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover opacity-25 blur-2xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080b] via-[#08080b]/80 to-[#08080b]/40" />
          </div>
        )}

        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:p-8">
          {anime.cover && (
            <div className="animate-scale-in relative aspect-[2/3] w-full max-w-[200px] shrink-0 self-center overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 sm:self-start">
              <Image
                src={anime.cover}
                alt={anime.title}
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {anime.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
              {meta && <span>{meta}</span>}
              {anime.rating && anime.rating !== "0.0" && (
                <span className="text-amber-300">★ {anime.rating}</span>
              )}
              <span>{anime.episodes.length} episodios</span>
            </div>

            {anime.genres.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {anime.genres.map((g) => (
                  <li key={g}>
                    <Link
                      href={`/explorar?genre=${genreToSlug(g)}`}
                      className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10 transition hover:bg-violet-500/20 hover:text-violet-100 hover:ring-violet-400/30"
                    >
                      {g}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {anime.synopsis && (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/70">
                {anime.synopsis}
              </p>
            )}

            <div className="mt-2">
              <FavoriteButton
                anime={{ slug, title: anime.title, cover: anime.cover }}
              />
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <SectionHeading title="Episodios" />
        <EpisodeList slug={slug} episodes={anime.episodes} />
      </section>
    </main>
  );
}
