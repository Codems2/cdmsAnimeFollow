"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimeCard } from "@/components/AnimeCard";
import type { FlvSearchItem } from "@/types/animeflv";

export function BrowseResults({
  initialItems,
  initialHasNext,
  query,
}: {
  initialItems: FlvSearchItem[];
  initialHasNext: boolean;
  /** Query string de los filtros (genre/type/status/order), sin `page`. */
  query: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(initialHasNext);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Reinicia cuando cambian los filtros (nueva carga inicial desde el server).
  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasNext(initialHasNext);
  }, [initialItems, initialHasNext]);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    try {
      const next = page + 1;
      const sep = query ? "&" : "";
      const res = await fetch(`/api/browse?${query}${sep}page=${next}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.slug));
        return [...prev, ...data.media.filter((m: FlvSearchItem) => !seen.has(m.slug))];
      });
      setPage(next);
      setHasNext(Boolean(data.hasNextPage));
    } catch {
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, page, query]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return <p className="text-sm text-white/50">Sin resultados para estos filtros.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item, i) => (
          <AnimeCard
            key={item.slug}
            slug={item.slug}
            title={item.title}
            cover={item.cover}
            rating={item.rating}
            subtitle={item.type}
            index={i % 12}
          />
        ))}
      </div>
      <div ref={sentinel} className="h-px" />
      <div className="py-6 text-center">
        {loading ? (
          <span className="inline-flex items-center gap-2 text-sm text-white/50">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
            Cargando…
          </span>
        ) : hasNext ? (
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium ring-1 ring-white/10 transition hover:bg-white/20 active:scale-95"
          >
            Cargar más
          </button>
        ) : (
          <span className="text-sm text-white/30">No hay más resultados.</span>
        )}
      </div>
    </>
  );
}
