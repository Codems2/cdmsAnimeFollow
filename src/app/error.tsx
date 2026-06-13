"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="animate-fade-up mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <span className="text-5xl">😵</span>
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="text-sm text-white/60">
        No se pudo cargar el contenido. La fuente de datos puede estar caída o
        no haber respondido.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white/90"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium transition hover:bg-white/20"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
