import Link from "next/link";
import { AnimeCard } from "@/components/AnimeCard";
import { SearchBar } from "@/components/SearchBar";
import { searchAnime } from "@/lib/animeflv";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const query = q.trim();
  const pageNum = Math.max(1, Number(page) || 1);

  const result = query ? await searchAnime(query, pageNum) : null;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-xl">
        <SearchBar initialQuery={query} />
      </header>

      {!query && (
        <EmptyState
          emoji="🔎"
          title="Busca tu anime"
          subtitle="Escribe un título en la barra de arriba para empezar."
        />
      )}

      {result && result.media.length === 0 && (
        <EmptyState
          emoji="🫥"
          title={`Sin resultados para “${query}”`}
          subtitle="Prueba con otro título o revisa la ortografía."
        />
      )}

      {result && result.media.length > 0 && (
        <>
          <h1 className="mb-5 text-lg font-semibold">
            Resultados para{" "}
            <span className="text-violet-300">“{query}”</span>
          </h1>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {result.media.map((item, i) => (
              <AnimeCard
                key={item.slug}
                slug={item.slug}
                title={item.title}
                cover={item.cover}
                rating={item.rating}
                subtitle={item.type}
                index={i}
              />
            ))}
          </div>

          <nav className="mt-10 flex items-center justify-center gap-4 text-sm">
            {result.previousPage && (
              <Link
                href={`/search?q=${encodeURIComponent(query)}&page=${result.previousPage}`}
                className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10 transition hover:bg-white/20"
              >
                ← Anterior
              </Link>
            )}
            <span className="text-white/50">
              Página {result.currentPage} de {result.foundPages}
            </span>
            {result.nextPage && (
              <Link
                href={`/search?q=${encodeURIComponent(query)}&page=${result.nextPage}`}
                className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10 transition hover:bg-white/20"
              >
                Siguiente →
              </Link>
            )}
          </nav>
        </>
      )}
    </main>
  );
}

function EmptyState({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center gap-2 py-24 text-center">
      <span className="text-4xl">{emoji}</span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-white/50">{subtitle}</p>
    </div>
  );
}
