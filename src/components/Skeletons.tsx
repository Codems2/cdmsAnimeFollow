/** Rejilla de tarjetas-póster en estado de carga (shimmer). */
export function PosterGridSkeleton({
  count = 12,
  aspect = "aspect-[2/3]",
}: {
  count?: number;
  aspect?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl ring-1 ring-white/10"
        >
          <div className={`skeleton w-full ${aspect}`} />
          <div className="space-y-2 p-3">
            <div className="skeleton h-3 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Bloque rectangular con shimmer. */
export function Block({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}
