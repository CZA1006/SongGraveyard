import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SongGraveyard",
  description: "Give every unfinished music idea a second life.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="h-full overflow-hidden">
        {children}
      </body>
    </html>
  );
}
