import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lari Kilat — Platformer 2D",
  description: "Game platformer 2D satu sesi: lari, lompat, kumpulkan koin, sentuh finis. Tanpa login.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
