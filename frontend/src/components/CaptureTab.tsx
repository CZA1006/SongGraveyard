"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MotifSummary } from "@/lib/types";

const MiSans: React.CSSProperties = {
  fontFamily: "'MiSans', 'PingFang SC', 'Noto Sans SC', ui-sans-serif, sans-serif",
};

export type MediaItem = {
  id: string;
  type: "image" | "audio";
  src: string;
  duration?: number; // seconds
  name: string;
};

function fmtSec(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ── Icons ── */

function IcSparkleGradient({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 19 19" fill="none">
      <defs>
        <linearGradient id="sg" x1="9.5" y1="0" x2="9.5" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1BD8C5" />
          <stop offset="100%" stopColor="#64E06E" />
        </linearGradient>
      </defs>
      <path d="M8.598 0.926C8.735 0.378 8.803 0.105 8.912 0.041C9.005-.014 9.122-.014 9.215.041C9.324.105 9.392.378 9.529.926L10.365 4.269C10.619 5.285 10.746 5.793 11.01 6.206C11.244 6.572 11.555 6.882 11.92 7.116C12.334 7.381 12.842 7.508 13.858 7.761L17.201 8.597C17.748 8.734 18.022 8.803 18.085 8.911C18.14 9.005 18.14 9.121 18.085 9.215C18.022 9.323 17.748 9.392 17.201 9.529L13.858 10.365C12.842 10.619 12.334 10.746 11.92 11.01C11.555 11.244 11.244 11.554 11.01 11.92C10.746 12.333 10.619 12.841 10.365 13.857L9.529 17.2C9.392 17.748 9.324 18.021 9.215 18.085C9.122 18.14 9.005 18.14 8.912 18.085C8.803 18.021 8.735 17.748 8.598 17.2L7.762 13.857C7.508 12.841 7.381 12.333 7.117 11.92C6.883 11.554 6.572 11.244 6.207 11.01C5.793 10.746 5.285 10.619 4.269 10.365L0.926 9.529C.379 9.392.105 9.323.042 9.215C-.013 9.121-.013 9.005.042 8.911C.105 8.803.379 8.734.926 8.597L4.269 7.761C5.285 7.508 5.793 7.381 6.207 7.116C6.572 6.882 6.883 6.572 7.117 6.206C7.381 5.793 7.508 5.285 7.762 4.269L8.598.926Z" fill="url(#sg)" />
    </svg>
  );
}

function IcSparkleBlack() {
  return (
    <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
      <path d="M8.598 0.926C8.735 0.378 8.803 0.105 8.912 0.041C9.005-.014 9.122-.014 9.215.041C9.324.105 9.392.378 9.529.926L10.365 4.269C10.619 5.285 10.746 5.793 11.01 6.206C11.244 6.572 11.555 6.882 11.92 7.116C12.334 7.381 12.842 7.508 13.858 7.761L17.201 8.597C17.748 8.734 18.022 8.803 18.085 8.911C18.14 9.005 18.14 9.121 18.085 9.215C18.022 9.323 17.748 9.392 17.201 9.529L13.858 10.365C12.842 10.619 12.334 10.746 11.92 11.01C11.555 11.244 11.244 11.554 11.01 11.92C10.746 12.333 10.619 12.841 10.365 13.857L9.529 17.2C9.392 17.748 9.324 18.021 9.215 18.085C9.122 18.14 9.005 18.14 8.912 18.085C8.803 18.021 8.735 17.748 8.598 17.2L7.762 13.857C7.508 12.841 7.381 12.333 7.117 11.92C6.883 11.554 6.572 11.244 6.207 11.01C5.793 10.746 5.285 10.619 4.269 10.365L0.926 9.529C.379 9.392.105 9.323.042 9.215C-.013 9.121-.013 9.005.042 8.911C.105 8.803.379 8.734.926 8.597L4.269 7.761C5.285 7.508 5.793 7.381 6.207 7.116C6.572 6.882 6.883 6.572 7.117 6.206C7.381 5.793 7.508 5.285 7.762 4.269L8.598.926Z" fill="#000" />
    </svg>
  );
}

function IcCamera() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M2.67 10.67C2.67 8.46 4.46 6.67 6.67 6.67H8L10 3h12l2 3.67h1.33C27.54 6.67 29.33 8.46 29.33 10.67v13.33C29.33 26.21 27.54 28 25.33 28H6.67C4.46 28 2.67 26.21 2.67 24V10.67Z" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="17" r="5" stroke="#000" strokeWidth="2.5" />
    </svg>
  );
}

function IcMic() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="10" y="2.67" width="12" height="18.67" rx="6" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.33 17.33C5.33 23.23 10.1 28 16 28C21.9 28 26.67 23.23 26.67 17.33" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="28" x2="16" y2="31" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IcMicRecording() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="10" y="2.67" width="12" height="18.67" rx="6" fill="#FF4444" stroke="#FF4444" strokeWidth="1" />
      <path d="M5.33 17.33C5.33 23.23 10.1 28 16 28C21.9 28 26.67 23.23 26.67 17.33" stroke="#FF4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="28" x2="16" y2="31" stroke="#FF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IcPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcPlayWhite() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M6.67 3.83L27.33 16L6.67 28.17V3.83Z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcPauseWhite() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="5.33" y="3.33" width="8" height="25.33" rx="2" stroke="#fff" strokeWidth="2.5" />
      <rect x="18.67" y="3.33" width="8" height="25.33" rx="2" stroke="#fff" strokeWidth="2.5" />
    </svg>
  );
}

function IcStop() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="2" fill="#fff" />
    </svg>
  );
}

function IcX() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2L12 12M12 2L2 12" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Camera Modal ── */

function CameraModal({ onCapture, onClose }: { onCapture: (src: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices
          .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
          .catch(() => navigator.mediaDevices.getUserMedia({ video: true }));
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch {
        setError("无法访问摄像头，请检查权限设置");
      }
    })();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.96)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32,
    }}>
      {error ? (
        <p style={{ ...MiSans, color: "rgba(255,255,255,0.7)", fontSize: 18 }}>{error}</p>
      ) : (
        <video
          ref={videoRef} autoPlay playsInline muted
          style={{
            width: "min(720px, 90vw)", borderRadius: 24, background: "#111",
            aspectRatio: "16/9", objectFit: "cover",
            opacity: ready ? 1 : 0, transition: "opacity 0.3s",
          }}
        />
      )}
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <button onClick={onClose} style={{
          ...MiSans, width: 120, height: 52, borderRadius: 12,
          background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
          color: "#fff", fontSize: 18,
        }}>
          取消
        </button>
        <button
          onClick={capture}
          disabled={!!error || !ready}
          style={{
            ...MiSans, width: 160, height: 52, borderRadius: 12,
            background: error || !ready ? "rgba(255,255,255,0.12)" : "#fff",
            border: "none", cursor: error || !ready ? "not-allowed" : "pointer",
            color: "#000", fontSize: 18, fontWeight: 600,
            transition: "background 0.2s",
          }}
        >
          拍照
        </button>
      </div>
    </div>
  );
}

/* ── Audio card ── */

function AudioCard({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  }

  return (
    <div style={{ position: "relative", width: 172, height: 172, flexShrink: 0 }}>
      <div style={{
        width: "100%", height: "100%", borderRadius: 48,
        background: "rgba(255,255,255,0.24)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 12,
        boxSizing: "border-box",
      }}>
        <button onClick={toggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {playing ? <IcPauseWhite /> : <IcPlayWhite />}
        </button>
        {item.duration !== undefined && (
          <span style={{ ...MiSans, fontSize: 16, fontWeight: 330, color: "#fff" }}>
            {fmtSec(item.duration)}
          </span>
        )}
      </div>
      <audio ref={audioRef} src={item.src} onEnded={() => setPlaying(false)} />
      <button onClick={onRemove} style={{
        position: "absolute", top: 0, right: 0,
        width: 32, height: 32, borderRadius: "50%",
        background: "#fff", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IcX />
      </button>
    </div>
  );
}

/* ── Image card ── */

function ImageCard({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
  return (
    <div style={{ position: "relative", width: 172, height: 172, flexShrink: 0 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 48, overflow: "hidden", background: "#333" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <button onClick={onRemove} style={{
        position: "absolute", top: 0, right: 0,
        width: 32, height: 32, borderRadius: "50%",
        background: "#fff", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IcX />
      </button>
    </div>
  );
}

/* ── Add button card ── */

function AddCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 172, height: 172, flexShrink: 0, borderRadius: 48,
      border: "1px dashed rgba(255,255,255,0.7)", background: "none", cursor: "pointer",
      display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8,
    }}>
      <IcPlus />
      <span style={{ ...MiSans, fontSize: 16, fontWeight: 520, color: "#fff" }}>{label}</span>
    </button>
  );
}

/* ── CaptureTab ── */

interface Props {
  onGenerate?: (motif: MotifSummary) => void;
}

function extractTagsFromDesc(desc: string): string[] {
  if (!desc.trim()) return [];
  const STOP = new Set(["的", "了", "在", "是", "也", "和", "与", "或", "但", "而", "却", "就", "都", "很", "到", "把", "被", "这", "那", "一", "有", "我", "你", "他", "她", "它", "我的", "这个", "那个"]);
  const words = desc
    .split(/[\s，。、！？,.\-!?()\[\]""'']+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP.has(w));
  return [...new Set(words)].slice(0, 4);
}

export default function CaptureTab({ onGenerate }: Props) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused">("idle");
  const [recordingSec, setRecordingSec] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [motifName, setMotifName] = useState("");
  const [motifDesc, setMotifDesc] = useState("");

  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingSecRef = useRef(0);
  recordingSecRef.current = recordingSec;
  // Captures elapsed seconds at stop time, before React resets recordingSec to 0
  const elapsedAtStopRef = useRef(0);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  /* Recording */

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const src = URL.createObjectURL(blob);
        // Use elapsedAtStopRef — recordingSecRef resets to 0 before onstop fires
        const saved = elapsedAtStopRef.current;
        const tmp = new Audio(src);
        const onMeta = () => {
          const dur = isFinite(tmp.duration) && tmp.duration > 0 ? Math.round(tmp.duration) : saved;
          setMediaItems(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type: "audio", src, duration: dur, name: `recording_${Date.now()}.webm` }]);
        };
        tmp.onloadedmetadata = onMeta;
        tmp.onerror = onMeta;
        tmp.load();
      };
      mr.start(100);
      mrRef.current = mr;
      setRecordingState("recording");
      setRecordingSec(0);
      timerRef.current = setInterval(() => setRecordingSec(s => s + 1), 1000);
    } catch {
      alert("无法访问麦克风，请检查权限设置");
    }
  }, []);

  function pauseRecording() {
    mrRef.current?.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingState("paused");
  }

  function resumeRecording() {
    mrRef.current?.resume();
    timerRef.current = setInterval(() => setRecordingSec(s => s + 1), 1000);
    setRecordingState("recording");
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    elapsedAtStopRef.current = recordingSecRef.current; // snapshot before state reset
    mrRef.current?.stop();
    setRecordingState("idle");
    setRecordingSec(0);
  }

  /* Uploads */

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = ev => {
          const src = ev.target?.result as string;
          setMediaItems(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type: "image", src, name: file.name }]);
        };
        reader.readAsDataURL(file);
      } else {
        const src = URL.createObjectURL(file);
        const tmp = new Audio(src);
        const add = () => {
          const dur = isFinite(tmp.duration) && tmp.duration > 0 ? Math.round(tmp.duration) : undefined;
          setMediaItems(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type: "audio", src, duration: dur, name: file.name }]);
        };
        tmp.onloadedmetadata = add;
        tmp.onerror = add;
        tmp.load();
      }
    });
    e.target.value = "";
  }

  function handleCameraCapture(src: string) {
    setMediaItems(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type: "image", src, name: `photo_${Date.now()}.jpg` }]);
    setCameraOpen(false);
  }

  function removeItem(id: string) {
    setMediaItems(prev => prev.filter(it => it.id !== id));
  }

  async function handleGenerate() {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setGenerating(false);
    const firstAudio = mediaItems.find(m => m.type === "audio");
    const images = mediaItems.filter(m => m.type === "image");
    const newMotif: MotifSummary = {
      id: `user-${Date.now()}`,
      title: motifName.trim() || "新动机",
      epitaph: motifDesc.trim(),
      status: "buried",
      weight: 2,
      moodTags: extractTagsFromDesc(motifDesc),
      projectTags: [],
      location: null,
      createdAt: new Date().toISOString(),
      imageUrl: images[0]?.src ?? null,
      extraImageUrls: images.slice(1).map(m => m.src),
      audioUrl: firstAudio?.src ?? null,
      durationSec: firstAudio?.duration,
    };
    setMotifName("");
    setMotifDesc("");
    setMediaItems([]);
    onGenerate?.(newMotif);
  }

  const hasMedia = mediaItems.length > 0;
  const isRecording = recordingState !== "idle";
  const micIcon = isRecording ? <IcMicRecording /> : <IcMic />;

  return (
    <>
      {/* Hidden input — accepts both image and audio */}
      <input ref={fileInputRef} type="file" accept="image/*,audio/*" multiple style={{ display: "none" }} onChange={handleFileUpload} />

      {/* Camera modal */}
      {cameraOpen && <CameraModal onCapture={handleCameraCapture} onClose={() => setCameraOpen(false)} />}

      {/* Full-screen capture view */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 15,
        background: "radial-gradient(76.32% 76.32% at 50% 50%, #2A2B30 0%, #111111 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        overflow: "hidden",
      }}>

        {/* Scrollable content area */}
        <div style={{
          flex: 1, minHeight: 0,
          width: "100%", overflowY: "auto",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "160px 24px 0",
          gap: 56, boxSizing: "border-box",
        }}>

          {/* ── Capture card ── */}
          <div style={{
            width: "min(620px, 100%)", flexShrink: 0,
            padding: "48px 64px",
            background: "rgba(255,255,255,0.16)",
            borderRadius: 48,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
            boxSizing: "border-box",
          }}>
            {/* Prompt row */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, width: "100%" }}>
              <IcSparkleGradient size={24} />
              <span style={{ ...MiSans, fontWeight: 330, fontSize: 20, lineHeight: "20px", letterSpacing: "0.12em", color: "#fff" }}>
                当下就灵光乍现？按下快门捕捉时刻！
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 24 }}>
              {/* Camera */}
              <button
                onClick={() => setCameraOpen(true)}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "#fff", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.12s, box-shadow 0.12s",
                }}
              >
                <IcCamera />
              </button>

              {/* Mic */}
              <button
                onClick={() => {
                  if (recordingState === "idle") startRecording();
                  else if (recordingState === "recording") pauseRecording();
                  else resumeRecording();
                }}
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: isRecording ? "rgba(255,68,68,0.18)" : "#fff",
                  border: isRecording ? "2px solid rgba(255,68,68,0.6)" : "none",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s, border-color 0.2s",
                }}
              >
                {micIcon}
              </button>
            </div>

            {/* Recording controls — appears inside card when recording */}
            {isRecording && (
              <div style={{
                width: "100%", display: "flex", flexDirection: "row",
                alignItems: "center", justifyContent: "center", gap: 20,
                padding: "16px 24px",
                background: "rgba(255,68,68,0.12)",
                borderRadius: 24,
                boxSizing: "border-box",
              }}>
                {/* Timer */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: "#FF4444", flexShrink: 0,
                    animation: recordingState === "recording" ? "recPulse 1s ease-in-out infinite" : "none",
                  }} />
                  <span style={{ ...MiSans, fontWeight: 450, fontSize: 20, color: "#fff", fontVariantNumeric: "tabular-nums", minWidth: 52, textAlign: "center" }}>
                    {fmtSec(recordingSec)}
                  </span>
                </div>

                <div style={{ flex: 1 }} />

                {/* Pause/Resume */}
                <button
                  onClick={() => recordingState === "recording" ? pauseRecording() : resumeRecording()}
                  style={{
                    ...MiSans, fontSize: 14, fontWeight: 330, color: "rgba(255,255,255,0.72)",
                    background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
                    padding: "8px 16px", borderRadius: 12,
                  }}
                >
                  {recordingState === "recording" ? "暂停" : "继续"}
                </button>

                {/* Stop */}
                <button
                  onClick={stopRecording}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    ...MiSans, fontSize: 14, fontWeight: 450, color: "#fff",
                    background: "rgba(255,68,68,0.4)", border: "none", cursor: "pointer",
                    padding: "8px 16px", borderRadius: 12,
                  }}
                >
                  <IcStop />
                  停止录音
                </button>
              </div>
            )}
          </div>

          {/* ── 灵感库 section ── */}
          <div style={{
            flexShrink: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
            width: "100%",
          }}>
            <span style={{ ...MiSans, fontWeight: 330, fontSize: 20, lineHeight: "20px", letterSpacing: "0.12em", color: "#fff" }}>
              灵感库
            </span>

            {/* Card row — centered, scrollable horizontally when overflow */}
            <div style={{
              maxWidth: "100%", overflowX: "auto",
              display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24,
              paddingBottom: 8,
            }}>
              {mediaItems.map(item =>
                item.type === "image"
                  ? <ImageCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
                  : <AudioCard key={item.id} item={item} onRemove={() => removeItem(item.id)} />
              )}
              <AddCard label="本地上传" onClick={() => fileInputRef.current?.click()} />
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1, minHeight: 48 }} />
        </div>

        {/* ── Generate button — always pinned at bottom ── */}
        <div style={{
          flexShrink: 0,
          width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          padding: "0 24px 36px",
          boxSizing: "border-box",
          background: "linear-gradient(to bottom, transparent 0%, rgba(17,17,17,0.95) 40%)",
        }}>
          {/* ── 动机描述表单 ── */}
          <div style={{ width: "min(502px, 100%)", display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={motifName}
              onChange={e => setMotifName(e.target.value)}
              placeholder="动机名称"
              style={{
                width: "100%", height: 38, borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                padding: "0 14px", boxSizing: "border-box",
                ...MiSans, fontSize: 14, color: "#fff", outline: "none",
              }}
            />
            <textarea
              value={motifDesc}
              onChange={e => setMotifDesc(e.target.value)}
              placeholder="动机描述（可选）— 系统将自动提取标签"
              rows={2}
              style={{
                width: "100%", borderRadius: 10,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                padding: "8px 14px", boxSizing: "border-box",
                ...MiSans, fontSize: 14, color: "#fff",
                resize: "none", outline: "none", lineHeight: "1.5",
              }}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!hasMedia || generating}
            style={{
              width: "min(502px, 100%)", height: 54,
              background: hasMedia && !generating
                ? "linear-gradient(287.49deg, #64E06E 10.24%, #1BD8C5 79.72%)"
                : "rgba(173,173,173,0.2)",
              borderRadius: 12, border: "none",
              cursor: hasMedia && !generating ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              ...MiSans, fontWeight: 380, fontSize: 20, letterSpacing: "0.08em",
              color: hasMedia && !generating ? "#000" : "rgba(255,255,255,0.3)",
              transition: "background 0.25s, color 0.25s",
            }}
          >
            <IcSparkleBlack />
            {generating ? "生成中…" : "埋下这个动机"}
          </button>
          <span style={{ ...MiSans, fontWeight: 330, fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>
            素材会帮助 AI 捕捉灵感，生成你的第一个动机
          </span>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes recPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </>
  );
}
