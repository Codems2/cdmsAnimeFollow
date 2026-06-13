"use client";

// Biblioteca personal persistida en localStorage: favoritos, historial de
// "continuar viendo", episodios vistos y servidor de reproducción preferido.
// Expone hooks reactivos basados en useSyncExternalStore para que cualquier
// componente cliente se actualice al cambiar los datos (incluso entre pestañas).

import { useSyncExternalStore } from "react";

export interface AnimeRef {
  slug: string;
  title: string;
  cover: string | null;
}

export interface HistoryEntry extends AnimeRef {
  episode: number;
  updatedAt: number;
}

const KEYS = {
  favorites: "cdms:favorites",
  history: "cdms:history",
  watched: "cdms:watched",
  server: "cdms:server",
} as const;

// Referencias vacías estables (necesarias para useSyncExternalStore).
const EMPTY_REFS: AnimeRef[] = [];
const EMPTY_HISTORY: HistoryEntry[] = [];
const EMPTY_NUMS: number[] = [];

// --- pub/sub --------------------------------------------------------------

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

// --- caché en memoria (snapshots estables) --------------------------------

let favCache: AnimeRef[] | null = null;
let histCache: HistoryEntry[] | null = null;
let watchedCache: Record<string, number[]> | null = null;
let serverCache: string | null | undefined = undefined;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getFavorites(): AnimeRef[] {
  if (favCache === null) favCache = load<AnimeRef[]>(KEYS.favorites, EMPTY_REFS);
  return favCache;
}

function getHistory(): HistoryEntry[] {
  if (histCache === null) histCache = load<HistoryEntry[]>(KEYS.history, EMPTY_HISTORY);
  return histCache;
}

function getWatchedMap(): Record<string, number[]> {
  if (watchedCache === null) watchedCache = load<Record<string, number[]>>(KEYS.watched, {});
  return watchedCache;
}

function getServer(): string | null {
  if (serverCache === undefined) serverCache = load<string | null>(KEYS.server, null);
  return serverCache;
}

// --- mutadores ------------------------------------------------------------

export function toggleFavorite(ref: AnimeRef): void {
  const current = getFavorites();
  const exists = current.some((f) => f.slug === ref.slug);
  favCache = exists
    ? current.filter((f) => f.slug !== ref.slug)
    : [{ slug: ref.slug, title: ref.title, cover: ref.cover }, ...current];
  window.localStorage.setItem(KEYS.favorites, JSON.stringify(favCache));
  emit();
}

/** Registra que se está viendo un episodio: actualiza historial y marca visto. */
export function recordWatch(ref: AnimeRef, episode: number): void {
  const rest = getHistory().filter((h) => h.slug !== ref.slug);
  histCache = [
    {
      slug: ref.slug,
      title: ref.title,
      cover: ref.cover,
      episode,
      updatedAt: Date.now(),
    },
    ...rest,
  ].slice(0, 50);
  window.localStorage.setItem(KEYS.history, JSON.stringify(histCache));

  markWatched(ref.slug, episode, true);
  emit();
}

/** Marca/desmarca un episodio como visto (sin tocar el historial). */
export function toggleWatched(slug: string, episode: number): void {
  const set = new Set(getWatchedMap()[slug] ?? EMPTY_NUMS);
  if (set.has(episode)) set.delete(episode);
  else set.add(episode);
  markWatchedSet(slug, set);
  emit();
}

function markWatched(slug: string, episode: number, value: boolean): void {
  const set = new Set(getWatchedMap()[slug] ?? EMPTY_NUMS);
  if (value) set.add(episode);
  else set.delete(episode);
  markWatchedSet(slug, set);
}

function markWatchedSet(slug: string, set: Set<number>): void {
  const map = { ...getWatchedMap() };
  if (set.size === 0) delete map[slug];
  else map[slug] = [...set].sort((a, b) => a - b);
  watchedCache = map;
  window.localStorage.setItem(KEYS.watched, JSON.stringify(map));
}

export function setPreferredServer(name: string): void {
  serverCache = name;
  window.localStorage.setItem(KEYS.server, JSON.stringify(name));
  emit();
}

export function removeFromHistory(slug: string): void {
  histCache = getHistory().filter((h) => h.slug !== slug);
  window.localStorage.setItem(KEYS.history, JSON.stringify(histCache));
  emit();
}

// --- hooks ----------------------------------------------------------------

export function useFavorites(): AnimeRef[] {
  return useSyncExternalStore(subscribe, getFavorites, () => EMPTY_REFS);
}

export function useIsFavorite(slug: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getFavorites().some((f) => f.slug === slug),
    () => false,
  );
}

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(subscribe, getHistory, () => EMPTY_HISTORY);
}

export function useWatched(slug: string): number[] {
  return useSyncExternalStore(
    subscribe,
    () => getWatchedMap()[slug] ?? EMPTY_NUMS,
    () => EMPTY_NUMS,
  );
}

export function usePreferredServer(): string | null {
  return useSyncExternalStore(subscribe, getServer, () => null);
}
