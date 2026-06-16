"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, resolveAsset, type GenerateParams } from "@/lib/api";
import type { Motif, Version, VersionType } from "@/lib/types";
import WaveformPlayer from "@/components/WaveformPlayer";

const TYPE_ACCENT: Record<VersionType, string> = {
  ghost: "#7fb8d6",
  resurrect: "#c9a8ff",
  grow: "#8fcab0",
  remix: "#e8a8c0",
};

const TYPE_LABEL: Record<VersionType, string> = {
  ghost: "Ghost",
  resurrect: "Resurrected",
  grow: "Grown",
  remix: "Remix",
};

export default function MotifDetailPage({ params }: { params: { id: string } }) {
  const [motif, setMotif] = useState<Motif | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [opts, setOpts] = useState<{ style: string; mood: string; instruments: string; lyrics: string }>(
    { style: "", mood: "", instruments: "", lyrics: "" },
  );
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const m = await api.getMotif(params.id);
      setMotif(m);
      return m;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [params.id]);

  // 初次加载
  useEffect(() => {
    refresh();
  }, [params.id, refresh]);

  // 有 generating 版本时轮询;无则停止
  useEffect(() => {
    const generating = motif?.versions.some((v) => v.status === "generating");
    if (generating && !pollRef.current) {
      pollRef.current = setInterval(refresh, 2000);
    } else if (!generating && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [motif, refresh]);

  async function run(kind: "ghost" | "resurrect" | "grow") {
    if (!motif) return;
    setBusy(kind);
    try {
      if (kind === "ghost") {
        await api.ghost(motif.id);
      } else {
        const body: GenerateParams = {
          style: opts.style || undefined,
          mood: opts.mood || undefined,
          instruments: opts.instruments
            ? opts.instruments.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
          lyrics: opts.lyrics || undefined,
        };
        await (kind === "resurrect" ? api.resurrect(motif.id, body) : api.grow(motif.id, body));
      }
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!motif) return <p className="text-grave-ghost/60">Summoning…</p>;

  const bg = resolveAsset(motif.imageUrl);
  const field =
    "w-full rounded-md border border-grave-border bg-grave-panel px-3 py-2 text-sm text-grave-warm outline-none focus:border-grave-ghost/60";

  return (
    <div className="space-y-8">
      {/* 视觉头 */}
      <header
        className="relative overflow-hidden rounded-2xl border border-grave-border p-8"
        style={
          bg
            ? { backgroundImage: `linear-gradient(rgba(10,12,18,0.7),rgba(10,12,18,0.92)), url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "radial-gradient(circle at top,#1a2234 0%,#0a0c12 60%)" }
        }
      >
        <div className="flex items-center gap-3 text-xs text-grave-ghost/60">
          <span className="rounded-full border border-grave-border px-2 py-0.5">{motif.status}</span>
          {motif.location && <span>{motif.location}</span>}
          <span>{new Date(motif.createdAt).toLocaleDateString()}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-grave-warm">{motif.title}</h1>
        <p className="mt-2 text-lg italic text-grave-ghost/85">{motif.epitaph}</p>
      </header>

      {/* 原始 */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-grave-ghost/60">Original</h2>
        <div className="rounded-xl border border-grave-border bg-grave-panel/60 p-4">
          <WaveformPlayer src={resolveAsset(motif.audioUrl)!} />
        </div>
        {motif.textNote && <p className="text-grave-warm/90">{motif.textNote}</p>}
        <div className="flex flex-wrap gap-1">
          {motif.moodTags.map((t) => (
            <span key={t} className="rounded bg-grave-moss/10 px-2 py-0.5 text-xs text-grave-moss">{t}</span>
          ))}
          {motif.projectTags.map((t) => (
            <span key={t} className="rounded bg-grave-ghost/10 px-2 py-0.5 text-xs text-grave-ghost">{t}</span>
          ))}
        </div>
      </section>

      {/* AI Actions */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wider text-grave-ghost/60">Bring it back</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={field} placeholder="Style (e.g. lofi, cinematic)"
                 value={opts.style} onChange={(e) => setOpts({ ...opts, style: e.target.value })} />
          <input className={field} placeholder="Mood (e.g. nostalgic)"
                 value={opts.mood} onChange={(e) => setOpts({ ...opts, mood: e.target.value })} />
          <input className={field} placeholder="Instruments (comma)"
                 value={opts.instruments} onChange={(e) => setOpts({ ...opts, instruments: e.target.value })} />
          <input className={field} placeholder="Lyrics (optional)"
                 value={opts.lyrics} onChange={(e) => setOpts({ ...opts, lyrics: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton label="👻 Summon Ghost" onClick={() => run("ghost")} busy={busy === "ghost"} />
          <ActionButton label="🪦 Resurrect" onClick={() => run("resurrect")} busy={busy === "resurrect"} />
          <ActionButton label="🌱 Grow" onClick={() => run("grow")} busy={busy === "grow"} />
          <Link href={`/remix?from=${motif.id}`}
                className="rounded-md border border-grave-border px-4 py-2 text-sm text-grave-ghost hover:bg-grave-ghost/10">
            🔀 Remix
          </Link>
        </div>
        <p className="text-xs text-grave-ghost/50">
          Ghost runs live (short echo). Resurrect / Grow may take longer or return a cached generation at demo time.
        </p>
      </section>

      {/* 生成版本 */}
      {motif.versions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-grave-ghost/60">Generated versions</h2>
          <div className="space-y-3">
            {[...motif.versions].reverse().map((v) => (
              <VersionRow key={v.id} v={v} />
            ))}
          </div>
        </section>
      )}

      {/* 相关动机 */}
      {motif.relatedMotifIds.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-grave-ghost/60">Related motifs</h2>
          <div className="flex flex-wrap gap-2">
            {motif.relatedMotifIds.map((id) => (
              <Link key={id} href={`/motif/${id}`}
                    className="rounded-md border border-grave-border px-3 py-1 text-sm text-grave-ghost hover:bg-grave-ghost/10">
                {id}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ActionButton({ label, onClick, busy }: { label: string; onClick: () => void; busy: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={busy}
            className="rounded-md bg-grave-ghost/20 px-4 py-2 text-sm text-grave-warm transition hover:bg-grave-ghost/30 disabled:opacity-50">
      {busy ? "Summoning…" : label}
    </button>
  );
}

function VersionRow({ v }: { v: Version }) {
  const accent = TYPE_ACCENT[v.type];
  return (
    <div className="rounded-xl border border-grave-border bg-grave-panel/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="font-medium" style={{ color: accent }}>{TYPE_LABEL[v.type]}</span>
        {v.source === "cached" && (
          <span className="rounded bg-grave-warm/10 px-2 py-0.5 text-xs text-grave-warm/80">using cached generation</span>
        )}
        <span className="ml-auto text-xs text-grave-ghost/50">{new Date(v.createdAt).toLocaleTimeString()}</span>
      </div>
      {v.status === "generating" && (
        <p className="animate-pulse text-sm text-grave-ghost/70">Summoning from the other side…</p>
      )}
      {v.status === "failed" && (
        <p className="text-sm text-red-400">Failed: {v.error}</p>
      )}
      {v.status === "done" && v.audioUrl && (
        <WaveformPlayer src={resolveAsset(v.audioUrl)!} accent={accent} />
      )}
    </div>
  );
}
