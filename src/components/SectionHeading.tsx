import type { ReactNode } from "react";

/** Cabecera de sección: barra de acento + título + acción opcional. */
export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-500" />
        {title}
      </h2>
      {action}
    </div>
  );
}
