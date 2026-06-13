import { Block, PosterGridSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Block className="mb-6 h-8 w-64" />
      <div className="mb-8 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-10 w-36" />
        ))}
      </div>
      <PosterGridSkeleton count={18} />
    </main>
  );
}
