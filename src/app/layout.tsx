import type { Metadata } from "next";
// Fuente Geist local (paquete `geist`): no descarga nada en build, a diferencia
// de next/font/google, que falla si no hay red durante la compilación.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "CDMS Anime Player",
  description: "Explora y visualiza anime — datos de AnimeFLV.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-neutral-100 selection:text-white">
        <Header />
        {children}
      </body>
    </html>
  );
}
