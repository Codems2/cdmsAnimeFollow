"use client";

import { useRouter } from "next/navigation";
import { GENRES, ORDERS, STATUSES, TYPES, type Option } from "@/lib/genres";

export interface Filters {
  genre: string;
  type: string;
  status: string;
  order: string;
}

export function FilterBar({ filters }: { filters: Filters }) {
  const router = useRouter();

  function update(partial: Partial<Filters>) {
    const next = { ...filters, ...partial };
    const qs = new URLSearchParams();
    if (next.genre) qs.set("genre", next.genre);
    if (next.type) qs.set("type", next.type);
    if (next.status) qs.set("status", next.status);
    if (next.order && next.order !== "default") qs.set("order", next.order);
    const s = qs.toString();
    router.push(s ? `/explorar?${s}` : "/explorar");
  }

  const hasFilters =
    filters.genre || filters.type || filters.status || filters.order;

  return (
    <div className="mb-8 flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Explorar el{" "}
        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          catálogo
        </span>
      </h1>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Género"
          value={filters.genre}
          placeholder="Todos"
          options={GENRES}
          onChange={(genre) => update({ genre })}
        />
        <Select
          label="Tipo"
          value={filters.type}
          placeholder="Todos"
          options={TYPES}
          onChange={(type) => update({ type })}
        />
        <Select
          label="Estado"
          value={filters.status}
          placeholder="Todos"
          options={STATUSES}
          onChange={(status) => update({ status })}
        />
        <Select
          label="Ordenar"
          value={filters.order}
          placeholder="Por defecto"
          options={ORDERS.filter((o) => o.value !== "default")}
          onChange={(order) => update({ order })}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/explorar")}
            className="h-9 rounded-lg px-3 text-sm text-white/50 transition hover:text-white"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-white/40">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-36 cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition hover:border-white/30 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
