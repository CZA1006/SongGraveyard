"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MotifSummary } from "@/lib/types";

// 切片 1:列表视图。切片 2 升级为 React Flow graph view。
export default function GraveyardPage() {
  const [motifs, setMotifs] = useState<MotifSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listMotifs()
      .then(setMotifs)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

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

      {loading && <p className="text-grave-ghost/60">Summoning the graveyard…</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && motifs.length === 0 && (
        <p className="text-grave-ghost/60">No motifs yet. Bury your first idea.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {motifs.map((m) => (
          <Link
            key={m.id}
            href={`/motif/${m.id}`}
            className="rounded-lg border border-grave-border bg-grave-panel p-4 transition hover:border-grave-ghost/50"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-grave-warm">{m.title}</h2>
              <span className="text-xs text-grave-ghost/50">{m.status}</span>
            </div>
            <p className="mt-1 text-sm italic text-grave-ghost/80">{m.epitaph}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {m.moodTags.map((t) => (
                <span key={t} className="rounded bg-grave-moss/10 px-2 py-0.5 text-xs text-grave-moss">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
