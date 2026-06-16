"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

// 波形 + 播放(Wavesurfer.js)。src 已是可直连的绝对 URL。
export default function WaveformPlayer({
  src,
  accent = "#7fb8d6",
}: {
  src: string;
  accent?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: src,
      height: 56,
      waveColor: "#3a4256",
      progressColor: accent,
      cursorColor: accent,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
    });
    wsRef.current = ws;
    ws.on("ready", () => setReady(true));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));
    return () => {
      ws.destroy();
      wsRef.current = null;
      setReady(false);
      setPlaying(false);
    };
  }, [src, accent]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => wsRef.current?.playPause()}
        disabled={!ready}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-grave-border bg-grave-panel text-grave-warm transition hover:border-grave-ghost/60 disabled:opacity-40"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div ref={containerRef} className="min-w-0 flex-1" />
    </div>
  );
}
