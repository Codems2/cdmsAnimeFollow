import { Block, PosterGridSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Block className="mb-12 h-[19rem] w-full sm:h-[22rem]" />
      <Block className="mb-4 h-6 w-48" />
      <PosterGridSkeleton count={12} />
    </main>
  );
}
