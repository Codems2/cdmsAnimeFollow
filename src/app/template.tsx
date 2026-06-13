// Se remonta en cada navegación → la animación de entrada se reproduce al
// cambiar de página, dando una transición suave en toda la app.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
