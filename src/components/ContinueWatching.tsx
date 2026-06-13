"use client";

import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { useHistory } from "@/lib/library";

export function ContinueWatching() {
  const history = useHistory();
  if (history.length === 0) return null;

  return (
    <section className="mb-12">
      <SectionHeading
        title="Continuar viendo"
        action={
          <Link href="/mi-lista" className="text-sm text-white/50 transition hover:text-white">
            Ver todo →
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {history.slice(0, 10).map((h, i) => (
          <Link
            key={h.slug}
            href={`/anime/${h.slug}/${h.episode}`}
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            className="group animate-fade-up flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:ring-violet-400/40 hover:shadow-[0_12px_40px_-12px] hover:shadow-violet-500/40"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-white/5">
              {h.cover && (
                <Image
                  src={h.cover}
                  alt={h.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg">
                  ▶
                </span>
              </span>
              <span className="absolute bottom-2 left-2 rounded-full bg-violet-600/90 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                Ep {h.episode}
              </span>
            </div>
            <h3 className="line-clamp-2 p-3 text-sm font-medium leading-snug transition-colors group-hover:text-violet-200">
              {h.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
