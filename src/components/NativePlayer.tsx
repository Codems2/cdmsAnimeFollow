"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResolvedStream } from "@/lib/extractors";

// Reproductor <video> nativo para streams ya resueltos a URL directa.
// Aporta lo que el iframe no puede: lanzar a Chromecast y AirPlay (misma red
// WiFi) además de pantalla completa real (también en iOS).

type DocumentWithWebkitFullscreen = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};
type ElementWithWebkitFullscreen = HTMLElement & {
  webkitRequestFullscreen?: () => void;
};

const CAST_SRC =
  "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

/** Inserta el SDK de Cast una sola vez y avisa cuando está disponible. */
function loadCastSdk(onReady: () => void) {
  if (typeof window === "undefined") return;
  if (window.cast?.framework) {
    onReady();
    return;
  }
  window.__onGCastApiAvailable = (isAvailable: boolean) => {
    if (isAvailable) onReady();
  };
  if (!document.querySelector(`script[src="${CAST_SRC}"]`)) {
    const s = document.createElement("script");
    s.src = CAST_SRC;
    s.async = true;
    document.head.appendChild(s);
  }
}

export function NativePlayer({
  stream,
  title,
  onFatalError,
}: {
  stream: ResolvedStream;
  title: string;
  /** Se llama si el stream no se puede reproducir: el padre vuelve al iframe. */
  onFatalError: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [castReady, setCastReady] = useState(false);
  const [casting, setCasting] = useState(false);
  const [airplayAvailable, setAirplayAvailable] = useState(false);

  const contentType = stream.type === "hls" ? "application/x-mpegURL" : "video/mp4";

  // URL reproducible: pasa por el proxy cuando el host exige Referer o es HLS
  // (para reescribir el manifiesto y abrir CORS). Si no, se reproduce directa.
  const playSrc = useMemo(() => {
    if (typeof window === "undefined") return stream.url;
    const needsProxy = Boolean(stream.referer) || stream.type === "hls";
    if (!needsProxy) return stream.url;
    const qs = new URLSearchParams({ url: stream.url });
    if (stream.referer) qs.set("ref", stream.referer);
    return `${window.location.origin}/api/stream/proxy?${qs}`;
  }, [stream.url, stream.referer, stream.type]);

  // ── Carga del stream en el <video> (HLS nativo en Safari, hls.js en el resto)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;
    // hls.js expone un tipo `Hls`; lo importamos dinámicamente solo si hace falta.
    let hls: { destroy: () => void } | null = null;

    const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

    if (stream.type === "hls" && !nativeHls) {
      import("hls.js")
        .then(({ default: Hls }) => {
          if (destroyed) return;
          if (!Hls.isSupported()) {
            video.src = playSrc; // último intento
            return;
          }
          const instance = new Hls({ enableWorker: true });
          hls = instance;
          instance.loadSource(playSrc);
          instance.attachMedia(video);
          instance.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) onFatalError();
          });
        })
        .catch(() => onFatalError());
    } else {
      video.src = playSrc;
    }

    return () => {
      destroyed = true;
      hls?.destroy();
    };
  }, [playSrc, stream.type, onFatalError]);

  // ── Pantalla completa ───────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => {
      const doc = document as DocumentWithWebkitFullscreen;
      setIsFullscreen(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current as ElementWithWebkitFullscreen | null;
    const doc = document as DocumentWithWebkitFullscreen;
    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    if (!el) return;
    const active = Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement);
    try {
      if (!active) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        // iOS Safari: la pantalla completa solo aplica al propio <video>.
        else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen();
      } else if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    } catch {
      /* gesto inválido: ignorar */
    }
  }, []);

  // ── Google Cast (Chromecast) ──────────────────────────────────────────────
  useEffect(() => {
    loadCastSdk(() => {
      const cc = window.chrome?.cast;
      const fw = window.cast?.framework;
      if (!cc || !fw) return;
      const context = fw.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: cc.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: cc.AutoJoinPolicy.ORIGIN_SCOPED,
      });
      const player = new fw.RemotePlayer();
      const controller = new fw.RemotePlayerController(player);
      controller.addEventListener(
        fw.RemotePlayerEventType.IS_CONNECTED_CHANGED,
        () => setCasting(player.isConnected),
      );
      setCastReady(true);
    });
  }, []);

  const startCast = useCallback(async () => {
    const cc = window.chrome?.cast;
    const fw = window.cast?.framework;
    if (!cc || !fw) return;
    const context = fw.CastContext.getInstance();
    try {
      if (!context.getCurrentSession()) await context.requestSession();
      const session = context.getCurrentSession();
      if (!session) return;
      const mediaInfo = new cc.media.MediaInfo(playSrc, contentType);
      const request = new cc.media.LoadRequest(mediaInfo);
      await session.loadMedia(request);
    } catch {
      /* el usuario canceló o no hay dispositivos */
    }
  }, [playSrc, contentType]);

  // ── AirPlay (Safari) ──────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onAvail = (e: Event) => {
      const ev = e as Event & { availability?: string };
      setAirplayAvailable(ev.availability === "available");
    };
    video.addEventListener("webkitplaybacktargetavailabilitychanged", onAvail);
    return () =>
      video.removeEventListener(
        "webkitplaybacktargetavailabilitychanged",
        onAvail,
      );
  }, []);

  const startAirplay = useCallback(() => {
    videoRef.current?.webkitShowPlaybackTargetPicker?.();
  }, []);

  const btn =
    "grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/80 active:scale-95";

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/10 data-[fs=true]:aspect-auto data-[fs=true]:h-full data-[fs=true]:w-full data-[fs=true]:rounded-none"
        data-fs={isFullscreen}
      >
        <video
          ref={videoRef}
          controls
          playsInline
          // x-webkit-airplay habilita el destino AirPlay en Safari.
          {...{ "x-webkit-airplay": "allow" }}
          title={title}
          className="absolute inset-0 h-full w-full bg-black"
          onError={onFatalError}
        />

        <div className="absolute right-3 top-3 z-10 flex gap-2">
          {castReady && (
            <button
              type="button"
              onClick={startCast}
              aria-label="Lanzar a Chromecast"
              title={casting ? "Conectado al televisor" : "Lanzar a Chromecast"}
              className={btn}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-5 w-5 ${casting ? "text-violet-400" : ""}`}
                aria-hidden="true"
              >
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                <line x1="2" y1="20" x2="2.01" y2="20" />
              </svg>
            </button>
          )}
          {airplayAvailable && (
            <button
              type="button"
              onClick={startAirplay}
              aria-label="Lanzar con AirPlay"
              title="Lanzar con AirPlay"
              className={btn}
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
                <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
                <polygon points="12 15 17 21 7 21 12 15" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className={`absolute bottom-3 right-3 z-10 ${btn}`}
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

      {casting && (
        <p className="text-center text-xs text-violet-300">
          Reproduciendo en el televisor — usa los controles para pausar o cambiar.
        </p>
      )}
    </div>
  );
}
