"use client";

import { useEffect, useState } from "react";
import { api, resolveAsset } from "@/lib/api";
import type { Motif } from "@/lib/types";

// 切片 1:最小详情(确保 create 跳转可达)。切片 3 补视觉头/波形/AI actions/对比播放。
export default function MotifDetailPage({ params }: { params: { id: string } }) {
  const [motif, setMotif] = useState<Motif | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMotif(params.id).then(setMotif).catch((e) => setError(String(e)));
  }, [params.id]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!motif) return <p className="text-grave-ghost/60">Summoning…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-grave-warm">{motif.title}</h1>
        <p className="italic text-grave-ghost/80">{motif.epitaph}</p>
        <p className="mt-1 text-xs text-grave-ghost/50">
          {motif.location} · {new Date(motif.createdAt).toLocaleString()} · weight {motif.weight}
        </p>
      </div>

      {motif.audioUrl && (
        <audio controls src={resolveAsset(motif.audioUrl) ?? undefined} className="w-full" />
      )}

      {motif.textNote && <p className="text-grave-warm/90">{motif.textNote}</p>}

      <div className="flex flex-wrap gap-1">
        {motif.moodTags.map((t) => (
          <span key={t} className="rounded bg-grave-moss/10 px-2 py-0.5 text-xs text-grave-moss">{t}</span>
        ))}
      </div>
    </div>
  );
}
