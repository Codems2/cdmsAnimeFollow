import { Block } from "@/components/Skeletons";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Block className="mb-4 h-5 w-40" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <Block className="mb-4 h-7 w-72" />
          <Block className="aspect-video w-full" />
          <div className="mt-6 flex justify-between">
            <Block className="h-10 w-28" />
            <Block className="h-10 w-44" />
          </div>
        </div>
        <aside className="lg:w-80 lg:shrink-0">
          <Block className="h-[60vh] w-full" />
        </aside>
      </div>
    </main>
  );
}
