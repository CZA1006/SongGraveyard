"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { MotifSummary } from "@/lib/types";

export default function RemixPage() {
  return (
    <Suspense fallback={<p className="text-grave-ghost/60">Loading remix table...</p>}>
      <RemixContent />
    </Suspense>
  );
}

function RemixContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [motifs, setMotifs] = useState<MotifSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(from ? [from] : []));
  const [direction, setDirection] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listMotifs()
      .then(setMotifs)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (from) {
      setSelected((current) => new Set([...current, from]));
    }
  }, [from]);

  const selectedMotifs = useMemo(
    () => motifs.filter((motif) => selected.has(motif.id)),
    [motifs, selected],
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size < 2) {
      setError("Select at least two motifs.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.remix([...selected], direction || undefined);
      router.push(`/motif/${result.motifId}`);
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-grave-warm">Remix together</h1>
          <p className="mt-1 text-sm text-grave-ghost/70">
            Choose fragments to fuse into a new motif node.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-grave-border px-4 py-2 text-sm text-grave-ghost hover:bg-grave-ghost/10"
        >
          Back to graph
        </Link>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="space-y-3">
          {loading && <p className="text-grave-ghost/60">Loading motifs...</p>}
          {!loading && motifs.length === 0 && (
            <div className="rounded-lg border border-dashed border-grave-border bg-grave-panel/60 p-6">
              <p className="text-sm text-grave-ghost/70">No motifs available.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {motifs.map((motif) => {
              const checked = selected.has(motif.id);
              return (
                <button
                  key={motif.id}
                  type="button"
                  onClick={() => toggle(motif.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    checked
                      ? "border-grave-rebirth bg-grave-rebirth/10 shadow-[0_0_24px_rgba(201,168,255,0.12)]"
                      : "border-grave-border bg-grave-panel/60 hover:border-grave-ghost/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        checked
                          ? "border-grave-rebirth bg-grave-rebirth/20 text-grave-warm"
                          : "border-grave-border text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-grave-warm">{motif.title}</span>
                      <span className="mt-1 line-clamp-2 block text-xs italic text-grave-ghost/75">
                        {motif.epitaph}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {motif.moodTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded bg-grave-moss/10 px-2 py-0.5 text-xs text-grave-moss">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-grave-border bg-grave-panel/70 p-4">
          <div className="text-sm font-medium text-grave-warm">Selected</div>
          <div className="mt-3 min-h-16 space-y-2">
            {selectedMotifs.length === 0 && (
              <p className="text-sm text-grave-ghost/60">Pick two or more motifs.</p>
            )}
            {selectedMotifs.map((motif) => (
              <div key={motif.id} className="rounded border border-grave-border bg-grave-bg/50 px-3 py-2">
                <p className="truncate text-sm text-grave-warm">{motif.title}</p>
              </div>
            ))}
          </div>

          <label className="mt-5 block text-sm text-grave-ghost">Direction</label>
          <textarea
            rows={4}
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="mt-1 w-full rounded-md border border-grave-border bg-grave-bg px-3 py-2 text-sm text-grave-warm outline-none focus:border-grave-ghost/60"
            placeholder="Blend the chorus energy with the quieter piano sketch"
          />

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={busy || selected.size < 2}
            className="mt-4 w-full rounded-md bg-grave-rebirth/20 py-2 text-sm text-grave-warm transition hover:bg-grave-rebirth/30 disabled:opacity-50"
          >
            {busy ? "Creating remix..." : "Create remix"}
          </button>
        </aside>
      </form>
    </div>
  );
}
