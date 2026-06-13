import { Block } from "@/components/Skeletons";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 rounded-3xl p-6 ring-1 ring-white/10 sm:flex-row sm:p-8">
        <Block className="aspect-[2/3] w-full max-w-[200px] shrink-0 self-center sm:self-start" />
        <div className="flex flex-1 flex-col gap-3">
          <Block className="h-9 w-2/3" />
          <Block className="h-4 w-40" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Block key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
          <Block className="h-24 w-full" />
          <Block className="h-10 w-44 rounded-full" />
        </div>
      </div>
      <Block className="mt-10 mb-4 h-6 w-32" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <Block key={i} className="h-9 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
