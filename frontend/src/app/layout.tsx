import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SongGraveyard",
  description: "Give every unfinished music idea a second life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="flex items-center justify-between border-b border-grave-border px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-wide text-grave-warm">
            🪦 SongGraveyard
          </Link>
          <nav className="flex gap-5 text-sm text-grave-ghost">
            <Link href="/" className="hover:text-grave-warm">Graveyard</Link>
            <Link href="/create" className="hover:text-grave-warm">Bury a motif</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
