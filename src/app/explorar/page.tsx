import { BrowseResults } from "@/components/BrowseResults";
import { FilterBar } from "@/components/FilterBar";
import { browseAnime } from "@/lib/animeflv";

function first(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = {
    genre: first(sp.genre),
    type: first(sp.type),
    status: first(sp.status),
    order: first(sp.order),
  };

  const result = await browseAnime({
    genres: filters.genre ? [filters.genre] : [],
    types: filters.type ? [filters.type] : [],
    statuses: filters.status ? [filters.status] : [],
    order: filters.order || undefined,
    page: 1,
  });

  // Query string de los filtros (sin page) para el scroll infinito del cliente.
  const qs = new URLSearchParams();
  if (filters.genre) qs.set("genre", filters.genre);
  if (filters.type) qs.set("type", filters.type);
  if (filters.status) qs.set("status", filters.status);
  if (filters.order) qs.set("order", filters.order);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <FilterBar filters={filters} />
      <BrowseResults
        key={qs.toString()}
        initialItems={result.media}
        initialHasNext={result.hasNextPage}
        query={qs.toString()}
      />
    </main>
  );
}
