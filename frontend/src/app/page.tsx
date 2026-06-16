"use client";

import Link from "next/link";
import MotifGraph from "@/components/MotifGraph";

export default function GraveyardPage() {
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-grave-warm">The Graveyard</h1>
          <p className="text-sm text-grave-ghost/70">Unfinished motifs, waiting for a second life.</p>
        </div>
        <Link
          href="/create"
          className="rounded-md border border-grave-ghost/40 px-4 py-2 text-sm text-grave-ghost hover:bg-grave-ghost/10"
        >
          + Bury a motif
        </Link>
      </div>

      <MotifGraph />
    </div>
  );
}
