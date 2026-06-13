"use client";

import { useEffect, useState } from "react";
import {
  recordWatch,
  setPreferredServer,
  usePreferredServer,
  type AnimeRef,
} from "@/lib/library";
import type { FlvServer } from "@/types/animeflv";

export function Player({
  servers,
  anime,
  episode,
}: {
  servers: FlvServer[];
  anime: AnimeRef;
  episode: number;
}) {
  // Solo los servidores con `embed` se pueden incrustar en un iframe.
  const embeddable = servers.filter((s) => s.embed);
  const downloads = servers.filter((s) => s.download && !s.embed);
  const preferred = usePreferredServer();
  const [active, setActive] = useState<number | null>(null);

  // Al abrir el episodio: registrar en historial y marcar como visto.
  useEffect(() => {
    recordWatch(anime, episode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime.slug, episode]);

  if (embeddable.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-white/[0.03] text-sm text-white/50 ring-1 ring-white/10">
        No hay servidores reproducibles para este episodio.
      </div>
    );
  }

  // Si el usuario no ha elegido, usamos su servidor preferido (o el primero).
  const preferredIndex = embeddable.findIndex((s) => s.name === preferred);
  const activeIndex = active ?? (preferredIndex >= 0 ? preferredIndex : 0);
  const current = embeddable[Math.min(activeIndex, embeddable.length - 1)];

  function selectServer(i: number) {
    setActive(i);
    setPreferredServer(embeddable[i].name);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10">
        <iframe
          // El cambio de `key` fuerza recargar el iframe al cambiar de servidor.
          key={current.embed}
          src={current.embed}
          title={`Reproductor — ${current.name}`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-white/40">
          Servidor
        </span>
        {embeddable.map((s, i) => (
          <button
            key={`${s.name}-${i}`}
            type="button"
            onClick={() => selectServer(i)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition active:scale-95 ${
              i === activeIndex
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
                : "bg-white/10 text-white/70 ring-1 ring-white/10 hover:bg-white/20 hover:text-white"
            }`}
          >
            {s.name}
            {s.name === preferred && i !== activeIndex ? " ★" : ""}
          </button>
        ))}
      </div>

      {downloads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-white/40">
            Descargar
          </span>
          {downloads.map((s, i) => (
            <a
              key={`${s.name}-${i}`}
              href={s.download}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70 ring-1 ring-white/10 transition hover:bg-white/20 hover:text-white"
            >
              ↓ {s.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
