"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MotifSummary } from "@/lib/types";

const MiSans: React.CSSProperties = {
  fontFamily: "'MiSans', 'PingFang SC', 'Noto Sans SC', ui-sans-serif, sans-serif",
};

type Mode = "动机成形" | "替换" | "延续";
const MODES: Mode[] = ["动机成形", "替换", "延续"];
const STYLE_CHIPS = ["国风", "弦乐", "Lofi", "电影感", "游戏配乐"];
const LYRICS_TEMPLATE = "[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]";

// Carousel — reference size at full scale
const PANEL_W = 600;
const ACT_W = 280, ACT_H = 342;
const SIDE_W = 212, SIDE_H = 260;
const IMG_GAP = 24;

const IMAGES = ["/img-1.png", "/img-3.png"];

// Pseudo-waveform heights (0–1)
const WAVEFORM = Array.from({ length: 52 }, (_, i) => {
  const x = i / 51;
  return Math.max(0.12, Math.min(1, 0.25 + 0.75 * Math.sin(x * Math.PI) * (0.5 + 0.5 * Math.sin(x * 9.3 + 1))));
});

const DURATION = 14;

function fmtCountdown(remaining: number): string {
  const s = Math.max(0, Math.ceil(remaining));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const hh = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ampm = hh < 12 ? "AM" : "PM";
  const h12 = hh % 12 || 12;
  const yr = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(d.getUTCDate()).padStart(2, "0");
  return `${h12}:${mm} ${ampm}, ${yr}/${mo}/${dy}`;
}

/* ── Icons ── */

function IcClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1.33" y="4" width="10.67" height="10.67" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 1.33h9.33A1.33 1.33 0 0 1 14.67 2.67V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IcCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8.5L5.5 12L14 4" stroke="#6BE696" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M2.5 5h15M6.667 5V3.333a1.667 1.667 0 0 1 1.666-1.666h3.334a1.667 1.667 0 0 1 1.666 1.666V5m2.5 0v11.667a1.667 1.667 0 0 1-1.666 1.666H5.833a1.667 1.667 0 0 1-1.666-1.666V5h11.666z"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* expand-02: ↗ single diagonal arrow pointing upper-right */
function IcExpand() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 11L11 5M11 5H7M11 5V9"
        stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* minimize-01: ↙ single diagonal arrow pointing lower-left */
function IcMinimize() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11 5L5 11M5 11H9M5 11V7"
        stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4.5 3L13 8L4.5 13V3Z" fill="#000" />
    </svg>
  );
}

function IcPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="3" width="3.5" height="10" rx="1" fill="#000" />
      <rect x="9.5" y="3" width="3.5" height="10" rx="1" fill="#000" />
    </svg>
  );
}

function IcSparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
      <path d="M8.598 0.926C8.735 0.378 8.803 0.105 8.912 0.041C9.005-0.014 9.122-0.014 9.215 0.041C9.324 0.105 9.392 0.378 9.529 0.926L10.365 4.269C10.619 5.285 10.746 5.793 11.01 6.206C11.244 6.572 11.555 6.882 11.92 7.116C12.334 7.381 12.842 7.508 13.858 7.761L17.201 8.597C17.748 8.734 18.022 8.803 18.085 8.911C18.14 9.005 18.14 9.121 18.085 9.215C18.022 9.323 17.748 9.392 17.201 9.529L13.858 10.365C12.842 10.619 12.334 10.746 11.92 11.01C11.555 11.244 11.244 11.554 11.01 11.92C10.746 12.333 10.619 12.841 10.365 13.857L9.529 17.2C9.392 17.748 9.324 18.021 9.215 18.085C9.122 18.14 9.005 18.14 8.912 18.085C8.803 18.021 8.735 17.748 8.598 17.2L7.762 13.857C7.508 12.841 7.381 12.333 7.117 11.92C6.883 11.554 6.572 11.244 6.207 11.01C5.793 10.746 5.285 10.619 4.269 10.365L0.926 9.529C0.379 9.392 0.105 9.323 0.042 9.215C-0.013 9.121-0.013 9.005 0.042 8.911C0.105 8.803 0.379 8.734 0.926 8.597L4.269 7.761C5.285 7.508 5.793 7.381 6.207 7.116C6.572 6.882 6.883 6.572 7.117 6.206C7.381 5.793 7.508 5.285 7.762 4.269L8.598 0.926Z"
        fill="currentColor" />
    </svg>
  );
}

/* ── Shared sub-components ── */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      ...MiSans,
      padding: "6px 12px",
      border: "1px solid rgba(255,255,255,0.4)",
      borderRadius: 200,
      fontWeight: 330, fontSize: 14, lineHeight: "20px",
      color: "rgba(255,255,255,0.64)",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      ...MiSans,
      fontWeight: 330, fontSize: 16, lineHeight: "145%",
      color: "rgba(255,255,255,0.64)",
      width: 32, flexShrink: 0,
      ...style,
    }}>
      {children}
    </span>
  );
}

/* ── Section divider ── */

function SectionDivider() {
  return (
    <div style={{
      height: 1,
      background: "rgba(255,255,255,0.08)",
      margin: "20px 24px",
      flexShrink: 0,
    }} />
  );
}

/* ── Mini motif row with independent player (for source/child display) ── */

function MiniMotifRow({ motif }: { motif: MotifSummary }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const duration = motif.durationSec ?? 28;

  useEffect(() => {
    const url = motif.audioUrl;
    if (!url) { audioRef.current = null; return; }
    const audio = new Audio(url);
    audioRef.current = audio;
    const onUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [motif.audioUrl]);

  useEffect(() => {
    if (motif.audioUrl) return;
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.1;
        if (next >= duration) { setPlaying(false); return 0; }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, motif.audioUrl, duration]);

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (audioRef.current) {
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else { audioRef.current.play().catch(() => {}); setPlaying(true); }
    } else {
      setPlaying(p => !p);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      {/* Mini reel thumbnail */}
      <div style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: motif.imageUrl
          ? undefined
          : "radial-gradient(circle at 38% 35%, #1e3228 0%, #192038 100%)",
        border: "1.5px solid rgba(255,255,255,0.12)",
        overflow: "hidden", position: "relative",
      }}>
        {motif.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={motif.imageUrl} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <svg viewBox="0 0 44 44" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const cx = 22 + Math.cos(a) * 18, cy = 22 + Math.sin(a) * 18;
              return <rect key={i} x={cx - 1.5} y={cy - 2.5} width={3} height={5} rx={1}
                fill="rgba(255,255,255,0.35)" transform={`rotate(${(i / 8) * 360} ${cx} ${cy})`} />;
            })}
          </svg>
        )}
      </div>
      {/* Title + tags */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          ...MiSans, fontSize: 14, fontWeight: 450, color: "#fff",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {motif.title}
        </div>
        <div style={{ ...MiSans, fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
          {[motif.moodTags[0], motif.location].filter(Boolean).join(" · ")}
        </div>
      </div>
      {/* Play button */}
      <button onClick={handlePlay} style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: "#6BE696", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {playing ? <IcPause /> : <IcPlay />}
      </button>
      {/* Countdown */}
      <span style={{
        ...MiSans, fontSize: 12, color: "rgba(255,255,255,0.4)",
        flexShrink: 0, minWidth: 28, textAlign: "right",
      }}>
        {fmtCountdown(duration - currentTime)}
      </span>
    </div>
  );
}

/* ── Main component ── */

interface Props {
  motif: MotifSummary | null;
  onClose: () => void;
  onGenerate?: (motif: MotifSummary) => void;
  onDelete?: (id: string) => void;
  isMobile?: boolean;
  extraImageUrls?: string[];
  initialActiveImg?: number;
  sourceMotifs?: MotifSummary[];
  childMotifs?: MotifSummary[];
}

export default function MotifPanel({ motif, onClose, onGenerate, onDelete, extraImageUrls, initialActiveImg = 0, sourceMotifs, childMotifs, isMobile }: Props) {
  const [activeImg, setActiveImg] = useState(0);
  const [mode, setMode] = useState<Mode>("动机成形");
  const [styleVal, setStyleVal] = useState("");
  const [lyrics, setLyrics] = useState(LYRICS_TEMPLATE);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [expanded, setExpanded] = useState<"none" | "style" | "lyrics">("none");

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const actualDuration = motif?.durationSec ?? DURATION;
  const images: string[] = motif?.imageUrl
    ? [motif.imageUrl, ...(extraImageUrls ?? [])]
    : [];
  const hasImages = images.length > 0;
  // Generated/fusion node: no captured image, has source relationships
  const isGenerated = !hasImages && (sourceMotifs?.length ?? 0) > 0;

  // Dynamic carousel height: compresses on shorter viewports so AI inputs stay visible
  const [carouselBaseH, setCarouselBaseH] = useState(ACT_H);
  useEffect(() => {
    function compute() {
      // Reserve: header(83) + margins(~48) + audio(81) + generate+footer(150) + AI min(180)
      const RESERVED = 83 + 48 + 81 + 150 + 180;
      setCarouselBaseH(Math.max(80, Math.min(ACT_H, window.innerHeight - RESERVED)));
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Reset all state when a different motif is selected
  useEffect(() => {
    setActiveImg(initialActiveImg);
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    setPlaying(false);
    setCurrentTime(0);
    setCopied(false);
    setDescExpanded(false);
    setExpanded("none");
    setLyrics(LYRICS_TEMPLATE);
  }, [motif?.id, initialActiveImg]);

  // Real audio element — created/destroyed when motif.audioUrl changes
  useEffect(() => {
    const url = motif?.audioUrl;
    if (!url) { audioElRef.current = null; return; }
    const audio = new Audio(url);
    audioElRef.current = audio;
    const onUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onUpdate);
      audio.removeEventListener("ended", onEnded);
      audioElRef.current = null;
    };
  }, [motif?.audioUrl]);

  // Simulated playback (fallback when no real audio)
  useEffect(() => {
    if (motif?.audioUrl) return;
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.1;
        if (next >= actualDuration) { setPlaying(false); return 0; }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, motif?.audioUrl, actualDuration]);

  function handlePlayToggle() {
    if (audioElRef.current) {
      if (playing) { audioElRef.current.pause(); }
      else { void audioElRef.current.play(); }
    }
    setPlaying(p => !p);
  }

  const open = motif !== null;
  const isFocused = expanded !== "none";
  const progress = currentTime / actualDuration;

  // Carousel: shrinks when focused, and compresses on short viewports
  const carouselH = isFocused ? 180 : carouselBaseH;
  const scale = carouselH / ACT_H;
  const scaledActW = Math.round(ACT_W * scale);
  const scaledSideW = Math.round(SIDE_W * scale);
  const scaledSideH = Math.round(SIDE_H * scale);
  const carouselSideTop = Math.round((carouselH - scaledSideH) / 2);
  const carouselActLeft = Math.round((PANEL_W - scaledActW) / 2);

  // Description text — only pad with boilerplate for short placeholder motifs
  const isPlaceholder = motif?.id.startsWith("ph-") ?? false;
  const desc = motif
    ? (isPlaceholder && motif.epitaph.length < 60
        ? motif.epitaph + "。那天空气里有种说不清的湿润感，录音机里的杂音意外地成为了这个片段最重要的组成部分。反复听了很多遍，觉得它值得被好好打磨成一首完整的曲子。"
        : motif.epitaph)
    : "";

  function handleCopy() {
    navigator.clipboard.writeText(desc).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function isChipSelected(chip: string): boolean {
    return styleVal.split(",").map(s => s.trim()).includes(chip);
  }

  function toggleChip(chip: string) {
    const chips = styleVal.split(",").map(s => s.trim()).filter(Boolean);
    if (chips.includes(chip)) {
      setStyleVal(chips.filter(c => c !== chip).join(", "));
    } else {
      setStyleVal([...chips, chip].join(", "));
    }
  }

  const panelStyle: React.CSSProperties = isMobile ? {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: "82vh",
    background: "#000000",
    borderTop: "0.4px solid rgba(255,255,255,0.4)",
    borderRadius: "20px 20px 0 0",
    zIndex: 30,
    transform: open ? "translateY(0)" : "translateY(100%)",
    transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
  } : {
    position: "absolute",
    right: 0, top: 0, bottom: 0,
    width: 600,
    background: "#000000",
    borderLeft: "0.4px solid rgba(255,255,255,0.4)",
    zIndex: 30,
    transform: open ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={panelStyle}>
      {motif && (
        <>
          {/* ── Header ── */}
          <div style={{ height: 83, position: "relative", flexShrink: 0 }}>
            <div style={{
              position: "absolute",
              left: 24, right: 24, top: 27,
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ ...MiSans, fontWeight: 450, fontSize: 20, color: "#FFFFFF", lineHeight: "24px" }}>
                  {motif.title}
                </span>
                <span style={{ ...MiSans, fontWeight: 330, fontSize: 14, color: "rgba(255,255,255,0.64)", lineHeight: "17px" }}>
                  {formatDate(motif.createdAt)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  {motif.location && <Chip>{motif.location}</Chip>}
                  {motif.moodTags.slice(0, 1).map(t => <Chip key={t}>{t}</Chip>)}
                </div>
                <button
                  onClick={() => onDelete?.(motif.id)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <IcTrash />
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <IcClose />
                </button>
              </div>
            </div>
          </div>

          {/* ── Image Carousel — only shown if motif has real images ── */}
          {hasImages && (
            <div
              style={{
                position: "relative",
                height: carouselH,
                marginTop: 24,
                overflow: "hidden",
                flexShrink: 0,
                transition: "height 0.35s cubic-bezier(0.4,0,0.2,1)",
                cursor: isFocused ? "pointer" : "default",
              }}
              onClick={() => setExpanded("none")}
            >
              {images.map((src, i) => {
                const isActive = i === activeImg;
                const isLeft = i < activeImg;

                let imgLeft: number;
                if (isActive) {
                  imgLeft = carouselActLeft;
                } else if (isLeft) {
                  imgLeft = carouselActLeft - (activeImg - i) * (scaledSideW + IMG_GAP);
                } else {
                  imgLeft = carouselActLeft + scaledActW + IMG_GAP + (i - activeImg - 1) * (scaledSideW + IMG_GAP);
                }

                const w = isActive ? scaledActW : scaledSideW;
                const h = isActive ? carouselH : scaledSideH;
                const top = isActive ? 0 : carouselSideTop;

                return (
                  <div
                    key={i}
                    onClick={e => { e.stopPropagation(); if (!isActive) setActiveImg(i); setExpanded("none"); }}
                    style={{
                      position: "absolute",
                      left: imgLeft,
                      top,
                      width: w,
                      height: h,
                      borderRadius: 20,
                      overflow: "hidden",
                      opacity: isActive ? 1 : 0.5,
                      cursor: isActive ? "default" : "pointer",
                      transition: [
                        "left 0.35s cubic-bezier(0.4,0,0.2,1)",
                        "width 0.35s cubic-bezier(0.4,0,0.2,1)",
                        "height 0.35s cubic-bezier(0.4,0,0.2,1)",
                        "top 0.35s cubic-bezier(0.4,0,0.2,1)",
                        "opacity 0.35s ease",
                      ].join(", "),
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Generated/Fusion node: relationship section replaces carousel ── */}
          {isGenerated && (
            <div style={{ padding: "24px 24px 0", flexShrink: 0 }}>
              {(sourceMotifs?.length ?? 0) > 0 && (
                <div style={{ marginBottom: (childMotifs?.length ?? 0) > 0 ? 20 : 0 }}>
                  <div style={{
                    ...MiSans, fontSize: 11, fontWeight: 500,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    marginBottom: 4,
                  }}>
                    来源
                  </div>
                  {sourceMotifs!.map(m => <MiniMotifRow key={m.id} motif={m} />)}
                </div>
              )}
              {(childMotifs?.length ?? 0) > 0 && (
                <div>
                  <div style={{
                    ...MiSans, fontSize: 11, fontWeight: 500,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    marginBottom: 4,
                  }}>
                    衍生
                  </div>
                  {childMotifs!.map(m => <MiniMotifRow key={m.id} motif={m} />)}
                </div>
              )}
            </div>
          )}

          {/* ── Description — hidden when empty or generated node; 2 lines default ── */}
          {desc && !isGenerated && (
            <div style={{
              padding: hasImages
                ? (isFocused ? "8px 24px 0" : "16px 24px 0")
                : "0 24px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              flexShrink: 0,
            }}>
              <p
                style={{
                  ...MiSans,
                  fontWeight: 330, fontSize: 15, lineHeight: "145%",
                  color: "rgba(255,255,255,0.64)", textAlign: "center",
                  maxWidth: 380, margin: 0,
                  ...((!isFocused && descExpanded) ? {} : {
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  } as React.CSSProperties),
                }}
              >
                {desc}
              </p>
              {/* Controls only visible when not focused */}
              {!isFocused && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => setDescExpanded(e => !e)}
                    style={{
                      ...MiSans, fontSize: 12, fontWeight: 330,
                      color: "rgba(255,255,255,0.4)",
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                    }}
                  >
                    {descExpanded ? "折叠" : "展开"}
                  </button>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      color: copied ? "#6BE696" : "rgba(255,255,255,0.6)",
                      display: "flex", alignItems: "center", gap: 4,
                      transition: "color 0.2s",
                    }}
                  >
                    {copied ? <IcCheck /> : <IcCopy />}
                    {copied && (
                      <span style={{ ...MiSans, fontSize: 12, fontWeight: 330, color: "#6BE696" }}>
                        已复制
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Audio Player ── */}
          <div style={{
            margin: "28px 24px 0",
            height: 81,
            background: "rgba(255,255,255,0.07)",
            borderRadius: 400,
            display: "flex", alignItems: "center",
            padding: "0 20px", gap: 16,
            flexShrink: 0,
          }}>
            {/* Play / Pause */}
            <button
              onClick={handlePlayToggle}
              style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: "#6BE696", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {playing ? <IcPause /> : <IcPlay />}
            </button>

            {/* Waveform + playhead */}
            <div style={{ flex: 1, position: "relative", height: 44 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 2 }}>
                {WAVEFORM.map((barH, i) => {
                  const barPos = (i + 0.5) / WAVEFORM.length;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1, borderRadius: 1, minWidth: 2,
                        height: `${barH * 100}%`,
                        background: barPos < progress ? "#6BE696" : "rgba(255,255,255,0.35)",
                      }}
                    />
                  );
                })}
              </div>
              {(playing || currentTime > 0) && (
                <div style={{
                  position: "absolute",
                  left: `${progress * 100}%`,
                  top: 0, bottom: 0,
                  width: 2,
                  background: "#FFFFFF",
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                }}>
                  <div style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 8, height: 8,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                  }} />
                </div>
              )}
            </div>

            {/* Countdown */}
            <span style={{
              ...MiSans, fontWeight: 330, fontSize: 14,
              color: "rgba(255,255,255,0.64)",
              flexShrink: 0, minWidth: 32, textAlign: "right",
            }}>
              {fmtCountdown(actualDuration - currentTime)}
            </span>
          </div>

          {/* ── AI Creation — fills remaining height ── */}
          <div style={{
            flex: 1, minHeight: 0,
            padding: "28px 24px 0",
            display: "flex", flexDirection: "column", gap: 16,
            overflow: "hidden",
          }}>
            {/* Mode row */}
            <div style={{ display: "flex", alignItems: "center", gap: 23, flexShrink: 0 }}>
              <Label>模式</Label>
              <div style={{
                flex: 1, height: 48,
                background: "rgba(0,0,0,0.36)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: 18, padding: 8, display: "flex",
              }}>
                {MODES.map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1, height: 32, border: "none", cursor: "pointer",
                      borderRadius: 12,
                      background: mode === m ? "#FFFFFF" : "transparent",
                      ...MiSans,
                      fontWeight: mode === m ? 520 : 330,
                      fontSize: 14,
                      color: mode === m ? "#000000" : "#FFFFFF",
                      transition: "background 0.15s ease, color 0.15s ease",
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Fields area — style + lyrics fill remaining space ── */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* STYLE ROW — gap 16px, IcExpand always */}
              <div style={{
                display: "flex", gap: 16, alignItems: "stretch",
                ...(expanded === "style" ? { flex: 1, minHeight: 0 } : { flexShrink: 0 }),
              }}>
                <Label style={{ paddingTop: expanded === "style" ? 14 : 12 }}>风格</Label>
                <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {expanded === "style" ? (
                    <>
                      {/* Expanded: position:relative so textarea can fill with inset:0 */}
                      <div style={{
                        flex: 1, minHeight: 48, position: "relative",
                        background: "rgba(255,255,255,0.12)",
                        borderRadius: 24,
                        overflow: "hidden",
                      }}>
                        <textarea
                          value={styleVal}
                          onChange={e => setStyleVal(e.target.value)}
                          autoFocus
                          style={{
                            position: "absolute", inset: 0, width: "100%", height: "100%",
                            padding: "12px 44px 12px 16px", boxSizing: "border-box",
                            background: "none", border: "none", outline: "none",
                            resize: "none",
                            ...MiSans, fontSize: 14, color: "rgba(255,255,255,0.64)", lineHeight: "150%",
                            overflowY: "auto",
                          }}
                        />
                        <button
                          onClick={() => setExpanded("none")}
                          style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          <IcExpand />
                        </button>
                      </div>
                      {/* Chips pinned below textarea */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                        {STYLE_CHIPS.map(chip => {
                          const sel = isChipSelected(chip);
                          return (
                            <button
                              key={chip}
                              onClick={() => toggleChip(chip)}
                              style={{
                                ...MiSans, fontWeight: sel ? 450 : 330, fontSize: 13,
                                color: sel ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.64)",
                                padding: "4px 10px",
                                border: `1px solid ${sel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"}`,
                                borderRadius: 200,
                                background: sel ? "rgba(255,255,255,0.18)" : "none",
                                cursor: "pointer", lineHeight: "20px",
                                transition: "background 0.15s, border-color 0.15s, color 0.15s",
                              }}
                            >
                              {chip}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* Collapsed */
                    <>
                      <div style={{
                        height: 48, background: "rgba(255,255,255,0.12)",
                        borderRadius: 24, padding: "12px 16px",
                        display: "flex", flexDirection: "row", alignItems: "center", gap: 16,
                      }}>
                        <input
                          value={styleVal}
                          onChange={e => setStyleVal(e.target.value)}
                          onFocus={() => setExpanded("style")}
                          style={{
                            flex: 1, background: "none", border: "none", outline: "none",
                            ...MiSans, fontSize: 14, color: "rgba(255,255,255,0.64)", lineHeight: "24px",
                          }}
                        />
                        <button
                          onClick={() => setExpanded("style")}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                        >
                          <IcExpand />
                        </button>
                      </div>
                      {/* Chips only in default state */}
                      {expanded === "none" && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {STYLE_CHIPS.map(chip => {
                            const sel = isChipSelected(chip);
                            return (
                              <button
                                key={chip}
                                onClick={() => toggleChip(chip)}
                                style={{
                                  ...MiSans, fontWeight: sel ? 450 : 330, fontSize: 13,
                                  color: sel ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.64)",
                                  padding: "4px 10px",
                                  border: `1px solid ${sel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"}`,
                                  borderRadius: 200,
                                  background: sel ? "rgba(255,255,255,0.18)" : "none",
                                  cursor: "pointer", lineHeight: "20px",
                                  transition: "background 0.15s, border-color 0.15s, color 0.15s",
                                }}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* LYRICS ROW — gap 23px, IcMinimize always */}
              <div style={{
                display: "flex", gap: 23, alignItems: "stretch",
                ...(expanded === "style" ? { flexShrink: 0 } : { flex: 1, minHeight: 48 }),
              }}>
                <Label style={{ paddingTop: 14 }}>歌词</Label>

                {expanded === "style" ? (
                  /* Folded: entire box is clickable to expand lyrics */
                  <div
                    onClick={() => setExpanded("lyrics")}
                    style={{
                      flex: 1, height: 48,
                      background: "rgba(255,255,255,0.12)",
                      borderRadius: 24, padding: "16px",
                      display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 16,
                      overflow: "hidden", cursor: "pointer",
                    }}
                  >
                    <div style={{
                      flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                      ...MiSans, fontSize: 13, color: "rgba(255,255,255,0.64)", lineHeight: "16px",
                      pointerEvents: "none",
                    }}>
                      {lyrics.split("\n")[0]}
                    </div>
                    <div style={{ flexShrink: 0, pointerEvents: "none" }}>
                      <IcMinimize />
                    </div>
                  </div>
                ) : (
                  /* Default or expanded: position:relative so textarea fills with inset:0 */
                  <div
                    style={{
                      flex: 1, minHeight: 48, position: "relative",
                      background: "rgba(255,255,255,0.12)",
                      borderRadius: 24,
                      overflow: "hidden", cursor: "text",
                    }}
                    onClick={() => { if (expanded !== "lyrics") setExpanded("lyrics"); }}
                  >
                    <textarea
                      value={lyrics}
                      onChange={e => setLyrics(e.target.value)}
                      onFocus={() => { if (expanded !== "lyrics") setExpanded("lyrics"); }}
                      style={{
                        position: "absolute", inset: 0, width: "100%", height: "100%",
                        padding: "16px 44px 16px 16px", boxSizing: "border-box",
                        background: "none", border: "none", outline: "none",
                        resize: "none",
                        ...MiSans, fontSize: 14, color: "rgba(255,255,255,0.64)", lineHeight: "150%",
                        overflowY: "auto", cursor: "text",
                      }}
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setExpanded(expanded === "lyrics" ? "none" : "lyrics");
                      }}
                      style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <IcMinimize />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Generate button — always pinned above footer ── */}
          <div style={{ padding: "24px 24px 0", flexShrink: 0 }}>
            <button
              onClick={() => motif && onGenerate?.(motif)}
              style={{
                width: "100%", height: 54,
                background: "linear-gradient(287.49deg, #64E06E 10.24%, #1BD8C5 79.72%)",
                borderRadius: 12, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                ...MiSans, fontWeight: 380, fontSize: 20, color: "#000000", letterSpacing: "0.08em",
              }}
            >
              <IcSparkle />
              生成
            </button>
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: "16px 24px 48px", textAlign: "center", flexShrink: 0 }}>
            <span style={{ ...MiSans, fontWeight: 330, fontSize: 14, color: "rgba(255,255,255,0.64)" }}>
              想融合多个motif? 点击顶部{" "}
              <Link href="/remix" style={{ color: "#6BE696", textDecoration: "none" }}>Remix</Link>
              {" "}进入拾取模式
            </span>
          </div>
        </>
      )}
    </div>
  );
}
