"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimeCard } from "@/components/AnimeCard";
import { SectionHeading } from "@/components/SectionHeading";
import { removeFromHistory, useFavorites, useHistory } from "@/lib/library";

export default function MiListaPage() {
  const favorites = useFavorites();
  const history = useHistory();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
        Mi{" "}
        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Lista
        </span>
      </h1>

      <section className="mb-12">
        <SectionHeading title="Continuar viendo" />
        {history.length === 0 ? (
          <EmptyState text="Aún no has empezado ningún anime." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {history.map((h, i) => (
              <div
                key={h.slug}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                className="group animate-fade-up relative overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:ring-violet-400/40 hover:shadow-[0_12px_40px_-12px] hover:shadow-violet-500/40"
              >
                <Link href={`/anime/${h.slug}/${h.episode}`} className="flex gap-3">
                  <div className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden bg-white/5">
                    {h.cover && (
                      <Image
                        src={h.cover}
                        alt={h.title}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col justify-center py-2 pr-2">
                    <h3 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-violet-200">
                      {h.title}
                    </h3>
                    <p className="mt-1 text-xs text-violet-300/80">
                      Episodio {h.episode}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => removeFromHistory(h.slug)}
                  aria-label={`Quitar ${h.title} de continuar viendo`}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-white/60 opacity-0 backdrop-blur transition hover:text-white group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading title="Favoritos" />
        {favorites.length === 0 ? (
          <EmptyState text="No tienes animes guardados. Pulsa “Añadir a Mi Lista” en cualquier ficha." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {favorites.map((f, i) => (
              <AnimeCard
                key={f.slug}
                slug={f.slug}
                title={f.title}
                cover={f.cover}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center text-sm text-white/50">
      {text}
    </div>
  );
}
