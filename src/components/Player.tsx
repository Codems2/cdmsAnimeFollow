"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  recordWatch,
  setPreferredServer,
  usePreferredServer,
  type AnimeRef,
} from "@/lib/library";
import type { FlvServer } from "@/types/animeflv";
import type { ResolvedStream } from "@/lib/extractors";
import { NativePlayer } from "@/components/NativePlayer";

// La Fullscreen API aún no está totalmente sin prefijos en Safari/iOS y algunos
// Android, así que declaramos las variantes `webkit` que usamos como fallback.
type DocumentWithWebkitFullscreen = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};

type ElementWithWebkitFullscreen = HTMLElement & {
  webkitRequestFullscreen?: () => void;
};

// Estado de resolución del servidor activo:
//  - loading: consultando si se puede extraer un stream directo
//  - native:  se obtuvo URL directa → <video> nativo con Chromecast/AirPlay
//  - iframe:  sin extractor (o falló) → reproductor embebido de siempre
type Resolution =
  | { status: "loading" }
  | { status: "native"; stream: ResolvedStream }
  | { status: "iframe" };

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

  const [resolution, setResolution] = useState<Resolution>({ status: "loading" });
  // Embeds cuyo reproductor nativo falló: se fuerzan a iframe.
  const failedRef = useRef<Set<string>>(new Set());

  // Contenedor del iframe: sobre él pedimos la pantalla completa.
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Al abrir el episodio: registrar en historial y marcar como visto.
  useEffect(() => {
    recordWatch(anime, episode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime.slug, episode]);

  // Mantener el estado de pantalla completa sincronizado (Esc, gestos, etc.).
  useEffect(() => {
    function onChange() {
      const doc = document as DocumentWithWebkitFullscreen;
      setIsFullscreen(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current as ElementWithWebkitFullscreen | null;
    if (!el) return;
    const doc = document as DocumentWithWebkitFullscreen;
    const active = Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
    try {
      if (!active) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else
          alert(
            "Tu navegador no permite la pantalla completa aquí. Usa el botón del propio reproductor del vídeo.",
          );
      } else if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    } catch {
      /* gesto inválido: ignorar */
    }
  }, []);

  // Si el usuario no ha elegido, usamos su servidor preferido (o el primero).
  const preferredIndex = embeddable.findIndex((s) => s.name === preferred);
  const activeIndex = active ?? (preferredIndex >= 0 ? preferredIndex : 0);
  const current =
    embeddable.length > 0
      ? embeddable[Math.min(activeIndex, embeddable.length - 1)]
      : null;
  const currentEmbed = current?.embed ?? "";

  // Intentar resolver un stream directo para el servidor activo. Si se logra,
  // usamos <video> nativo (con casting); si no, caemos al iframe.
  useEffect(() => {
    if (!currentEmbed) return;
    if (failedRef.current.has(currentEmbed)) {
      setResolution({ status: "iframe" });
      return;
    }
    let cancelled = false;
    setResolution({ status: "loading" });
    fetch(`/api/stream?embed=${encodeURIComponent(currentEmbed)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not_resolvable");
        return (await res.json()) as ResolvedStream;
      })
      .then((stream) => {
        if (!cancelled) setResolution({ status: "native", stream });
      })
      .catch(() => {
        if (!cancelled) setResolution({ status: "iframe" });
      });
    return () => {
      cancelled = true;
    };
  }, [currentEmbed]);

  const onNativeFailed = useCallback(() => {
    if (currentEmbed) failedRef.current.add(currentEmbed);
    setResolution({ status: "iframe" });
  }, [currentEmbed]);

  function selectServer(i: number) {
    setActive(i);
    setPreferredServer(embeddable[i].name);
  }

  if (embeddable.length === 0 || !current) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-white/[0.03] text-sm text-white/50 ring-1 ring-white/10">
        No hay servidores reproducibles para este episodio.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {resolution.status === "native" ? (
        <NativePlayer
          key={currentEmbed}
          stream={resolution.stream}
          title={`${anime.title} — Episodio ${episode}`}
          onFatalError={onNativeFailed}
        />
      ) : (
        <div
          ref={containerRef}
          className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10 data-[fs=true]:aspect-auto data-[fs=true]:h-full data-[fs=true]:w-full data-[fs=true]:rounded-none"
          data-fs={isFullscreen}
        >
          <iframe
            // El cambio de `key` fuerza recargar el iframe al cambiar de servidor.
            key={currentEmbed}
            src={currentEmbed}
            title={`Reproductor — ${current.name}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />

          {resolution.status === "loading" && (
            <div className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70 ring-1 ring-white/15 backdrop-blur">
              Buscando opción para TV…
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            className="absolute bottom-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/80 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" />
              )}
            </svg>
          </button>
        </div>
      )}

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
