import Image from "next/image";
import Link from "next/link";

export function AnimeCard({
  slug,
  title,
  cover,
  subtitle,
  rating,
  index = 0,
}: {
  slug: string;
  title: string;
  cover: string | null;
  subtitle?: string | null;
  rating?: string | null;
  /** Posición en la lista, para escalonar la animación de entrada. */
  index?: number;
}) {
  return (
    <Link
      href={`/anime/${slug}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className="group animate-fade-up flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:ring-violet-400/40 hover:shadow-[0_12px_40px_-12px] hover:shadow-violet-500/40"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-white/5">
        {cover && (
          <Image
            src={cover}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-90" />
        {rating && rating !== "0.0" && (
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
            ★ {rating}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-violet-200">
          {title}
        </h3>
        {subtitle && <p className="mt-auto pt-1 text-xs text-white/40">{subtitle}</p>}
      </div>
    </Link>
  );
}
