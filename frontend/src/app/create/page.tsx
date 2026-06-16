"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

// 切片 1:录入流程。upload → createMotif → 跳详情。
export default function CreatePage() {
  const router = useRouter();
  const [audio, setAudio] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [textNote, setTextNote] = useState("");
  const [location, setLocation] = useState("");
  const [moods, setMoods] = useState("");
  const [projects, setProjects] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const splitTags = (s: string) =>
    s.split(",").map((t) => t.trim()).filter(Boolean);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audio) {
      setError("Please add an audio motif.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const up = await api.upload(audio, image);
      const motif = await api.createMotif({
        audioUrl: up.audioUrl,
        imageUrl: up.imageUrl,
        textNote,
        location,
        moodTags: splitTags(moods),
        projectTags: splitTags(projects),
      });
      router.push(`/motif/${motif.id}`);
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  }

  const field = "w-full rounded-md border border-grave-border bg-grave-panel px-3 py-2 text-sm text-grave-warm outline-none focus:border-grave-ghost/60";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-grave-warm">Bury a motif</h1>
      <p className="mb-6 text-sm text-grave-ghost/70">
        An unfinished hum, riff, or lyric — give it a resting place.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-grave-ghost">Audio motif *</label>
          <input type="file" accept="audio/*" className={field}
                 onChange={(e) => setAudio(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-grave-ghost">Image (optional)</label>
          <input type="file" accept="image/*" className={field}
                 onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-grave-ghost">A few words</label>
          <textarea className={field} rows={3} value={textNote}
                    onChange={(e) => setTextNote(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-grave-ghost">Location</label>
            <input className={field} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-grave-ghost">Mood tags (comma)</label>
            <input className={field} value={moods} onChange={(e) => setMoods(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-grave-ghost">Project tags (comma)</label>
          <input className={field} value={projects} onChange={(e) => setProjects(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={busy}
                className="w-full rounded-md bg-grave-ghost/20 py-2 text-grave-warm hover:bg-grave-ghost/30 disabled:opacity-50">
          {busy ? "Burying…" : "Bury it"}
        </button>
      </form>
    </div>
  );
}
