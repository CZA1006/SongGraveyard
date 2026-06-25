"use client";

import "reactflow/dist/style.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Handle,
  Panel,
  Position,
  useReactFlow,
  useViewport,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
  type ReactFlowInstance,
} from "reactflow";
import { api } from "@/lib/api";
import type { MotifSummary, Relationship } from "@/lib/types";

export type CanvasMode = "归类" | "分支" | "沉浸";

const MiSans: React.CSSProperties = {
  fontFamily: "'MiSans', 'PingFang SC', 'Noto Sans SC', ui-sans-serif, sans-serif",
};

/* ── Placeholder motifs ─────────────────────────────────────────────────────── */
export const PLACEHOLDER_MOTIFS: MotifSummary[] = [
  {
    id: "ph-1", title: "湖边晨光",
    epitaph: "那个清晨的鸟鸣声，让一切都显得格外清晰",
    status: "buried", weight: 3, moodTags: ["Lofi"], projectTags: [],
    location: "湖边公园", createdAt: "2026-06-10T08:23:00Z",
    imageUrl: "https://picsum.photos/seed/lake-morning/300/300",
  },
  {
    id: "ph-2", title: "城市呼吸",
    epitaph: "地铁站里的混响，意外地有种韵律感",
    status: "ghosted", weight: 2, moodTags: ["城市"], projectTags: [],
    location: "人民广场", createdAt: "2026-06-11T14:30:00Z",
    imageUrl: "https://picsum.photos/seed/metro-street/300/300",
  },
  {
    id: "ph-3", title: "残章",
    epitaph: "弦断之前的那一刻，我试图记住那个音",
    status: "buried", weight: 4, moodTags: ["古典"], projectTags: [],
    location: null, createdAt: "2026-06-12T22:00:00Z",
    imageUrl: "https://picsum.photos/seed/music-score/300/300",
  },
  {
    id: "ph-4", title: "梅雨季",
    epitaph: "玻璃上的雨声节奏，3/4拍还是4/4?",
    status: "resurrected", weight: 2, moodTags: ["国风"], projectTags: [],
    location: "家", createdAt: "2026-06-12T16:45:00Z",
    imageUrl: "https://picsum.photos/seed/rainy-window-green/300/300",
  },
  {
    id: "ph-5", title: "霓虹倒影",
    epitaph: "深夜便利店的灯光，配上这段旋律刚好",
    status: "buried", weight: 3, moodTags: ["城市"], projectTags: [],
    location: "南京路", createdAt: "2026-06-13T23:15:00Z",
    imageUrl: "https://picsum.photos/seed/neon-city-rain/300/300",
  },
  {
    id: "ph-6", title: "爵士午后",
    epitaph: "咖啡冷掉之前，录下了这段即兴",
    status: "buried", weight: 3, moodTags: ["爵士"], projectTags: [],
    location: "咖啡馆", createdAt: "2026-06-13T15:20:00Z",
    imageUrl: "https://picsum.photos/seed/jazz-cafe-window/300/300",
  },
  {
    id: "ph-7", title: "电流涌动",
    epitaph: "合成器的杂音里，藏着一条旋律线",
    status: "buried", weight: 2, moodTags: ["电子"], projectTags: [],
    location: null, createdAt: "2026-06-14T21:00:00Z",
    imageUrl: "https://picsum.photos/seed/synth-keys-dark/300/300",
  },
  {
    id: "ph-8", title: "手稿碎片",
    epitaph: "只记下了前八小节，但已经足够",
    status: "buried", weight: 3, moodTags: ["古典"], projectTags: [],
    location: "练习室", createdAt: "2026-06-14T11:30:00Z",
    imageUrl: "https://picsum.photos/seed/handwritten-notes/300/300",
  },
  {
    id: "ph-9", title: "夜行滤镜",
    epitaph: "把城市噪音变成白噪音，反而睡着了",
    status: "buried", weight: 2, moodTags: ["Lofi"], projectTags: [],
    location: "卧室", createdAt: "2026-06-15T02:10:00Z",
    imageUrl: "https://picsum.photos/seed/night-window-light/300/300",
  },
  {
    id: "ph-10", title: "山雾间",
    epitaph: "那段泛音是意外发现的，山谷里的回声",
    status: "buried", weight: 4, moodTags: ["电影感"], projectTags: [],
    location: "莫干山", createdAt: "2026-06-15T09:50:00Z",
    imageUrl: "https://picsum.photos/seed/mountain-mist-trail/300/300",
  },
  {
    id: "ph-11", title: "模块序列",
    epitaph: "第3步骤触发了意想不到的和声",
    status: "buried", weight: 2, moodTags: ["电子"], projectTags: [],
    location: null, createdAt: "2026-06-16T19:00:00Z",
    imageUrl: "https://picsum.photos/seed/circuit-glow/300/300",
  },
  {
    id: "ph-12", title: "古琴即兴",
    epitaph: "五弦之外，找到了第六个音位",
    status: "buried", weight: 3, moodTags: ["国风"], projectTags: [],
    location: "琴房", createdAt: "2026-06-16T14:30:00Z",
    imageUrl: "https://picsum.photos/seed/bamboo-sunlight/300/300",
  },
  {
    id: "ph-13", title: "蓝调晚课",
    epitaph: "12小节，循环了三十遍后终于记住了",
    status: "buried", weight: 2, moodTags: ["爵士"], projectTags: [],
    location: null, createdAt: "2026-06-17T20:00:00Z",
    imageUrl: "https://picsum.photos/seed/blues-guitar-bokeh/300/300",
  },
  {
    id: "ph-14", title: "街头采样",
    epitaph: "路边摊的锅铲声竟然是完美的打击乐",
    status: "buried", weight: 2, moodTags: ["城市"], projectTags: [],
    location: "文庙路", createdAt: "2026-06-17T12:45:00Z",
    imageUrl: "https://picsum.photos/seed/street-market-blur/300/300",
  },
];

/* ── Second image URLs for source nodes ─────────────────────────────────────── */
export const SECOND_IMAGE_URLS: Record<string, string> = {
  "ph-1":  "https://picsum.photos/seed/music-score/300/300",
  "ph-2":  "https://picsum.photos/seed/subway-platform/300/300",
  "ph-3":  "https://picsum.photos/seed/cello-closeup/300/300",
  "ph-5":  "https://picsum.photos/seed/puddle-neon/300/300",
  "ph-6":  "https://picsum.photos/seed/vinyl-record-cafe/300/300",
  "ph-8":  "https://picsum.photos/seed/pencil-staves/300/300",
  "ph-9":  "https://picsum.photos/seed/city-rain-blur/300/300",
  "ph-10": "https://picsum.photos/seed/valley-cloud-sea/300/300",
  "ph-11": "https://picsum.photos/seed/waveform-dark/300/300",
  "ph-12": "https://picsum.photos/seed/guqin-silk/300/300",
  "ph-4":  "https://picsum.photos/seed/rain-glass-bokeh/300/300",
  "ph-7":  "https://picsum.photos/seed/modular-patch-dark/300/300",
  "ph-13": "https://picsum.photos/seed/piano-keys-close/300/300",
  "ph-14": "https://picsum.photos/seed/food-stall-evening/300/300",
};

/* ── Generated placeholder nodes (only shown in 分支 mode) ──────────────────── */
export const PLACEHOLDER_GENERATED: MotifSummary[] = [
  {
    id: "gen-1",
    title: "湖岸晨生",
    epitaph: "从湖边晨光生成",
    imageUrl: null,
    status: "buried", weight: 1, moodTags: ["Lofi"], projectTags: [],
    location: null, createdAt: "2026-06-11T10:00:00Z",
  },
  {
    id: "gen-2",
    title: "弦爵交响",
    epitaph: "残章 × 爵士午后 融合",
    imageUrl: null,
    status: "buried", weight: 1, moodTags: ["古典"], projectTags: [],
    location: null, createdAt: "2026-06-14T18:00:00Z",
  },
];

/* ── Placeholder relationships ─────────────────────────────────────────────── */
export const PLACEHOLDER_RELATIONSHIPS: Relationship[] = [
  // Group 1 — single source → generated
  { source: "ph-1",  target: "gen-1", relationType: "remix", strength: 0.9 },
  // Group 2 — two sources → generated (fusion)
  { source: "ph-3",  target: "gen-2", relationType: "remix", strength: 0.85 },
  { source: "ph-6",  target: "gen-2", relationType: "remix", strength: 0.85 },
];

/* ── Timeline birth days ───────────────────────────────────────────────────── */
const CAPTURED_DAY_INDICES = [
  1, 2, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 30,
];

function getBirthDay(motif: MotifSummary, idx: number): number {
  if (motif.id.startsWith("ph-")) return CAPTURED_DAY_INDICES[idx] ?? 0;
  return 0;
}

/* ── Group accent colors ───────────────────────────────────────────────────── */
const GROUP_ACCENT: Record<string, string> = {
  "Lofi":   "#7fb8d6",
  "城市":   "#e8c46a",
  "古典":   "#c9a8ff",
  "国风":   "#f0a870",
  "电影感": "#8fcab0",
  "爵士":   "#f0c070",
  "电子":   "#a8d4f0",
};

/* ── NodeData ── */
type NodeData = {
  motif: MotifSummary;
  index: number;
  visible: boolean;
  isSelected: boolean;
  remixMode?: boolean;
  isRemixSelected?: boolean;
  canvasMode?: CanvasMode;
  isGroupLeader?: boolean;
  groupTag?: string;
  groupAccentColor?: string;
  anySelected?: boolean;
  isGenerating?: boolean;
  nodeType?: "source" | "generated";
  extraImageUrls?: string[];
  isCenter?: boolean;
  isEdgeHighlighted?: boolean;
  immersivePos?: number;
  onSwap?: (id: string, swapped: boolean) => void;
  standaloneMode?: boolean; // true when rendered outside ReactFlow (ImmersiveFilmstrip)
};

/* ── Check badge ── */
function CheckBadge() {
  return (
    <div style={{
      position: "absolute", top: -5, right: -5, zIndex: 10,
      width: 18, height: 18, borderRadius: "50%",
      background: "#6BE696",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 8px rgba(107,230,150,0.6)",
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5L3.5 7.5L8.5 2.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ── Mini waveform for immersive card ── */
const IMMER_WAVE = [0.3,0.55,0.75,0.6,0.9,0.8,0.95,0.7,0.55,0.8,0.5,0.7,0.4,0.65,0.85,0.5,0.35,0.65,0.75,0.5,0.45,0.8,0.6,0.5];

function fmtTime(s: number) {
  const ss = Math.max(0, Math.floor(s));
  return `${Math.floor(ss / 60)}:${String(ss % 60).padStart(2, "0")}`;
}

/* ── ImmersiveCard (rendered inside GraveNode in 沉浸 mode) ── */
function ImmersiveCard({ data }: { data: NodeData }) {
  const { motif, isCenter, immersivePos, isSelected, isRemixSelected, remixMode } = data;
  const isActive = isSelected || !!isRemixSelected;
  const isRemixDimmed = remixMode && !isRemixSelected;
  const accentColor = "#6BE696";
  const absPos = Math.abs(immersivePos ?? 0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const duration = motif.durationSec ?? 28;

  useEffect(() => {
    const url = motif.audioUrl;
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
    if (motif.audioUrl && audioElRef.current) {
      if (playing) { audioElRef.current.pause(); setPlaying(false); }
      else { audioElRef.current.play().catch(() => {}); setPlaying(true); }
    } else {
      setPlaying(p => !p);
    }
  }

  const progress = currentTime / duration;
  const opacity = isRemixDimmed ? 0.35 : isCenter ? 1 : absPos === 1 ? 0.72 : 0.5;

  return (
    <div className="group" style={{
      width: "100%", height: "100%",
      opacity,
      transition: "opacity 0.4s",
      position: "relative",
      cursor: "pointer",
    }}>
      <div style={{
        width: "100%", height: "100%",
        background: "#18181c",
        borderRadius: 22,
        border: isActive
          ? `1.5px solid ${accentColor}`
          : `1.5px solid rgba(255,255,255,${isCenter ? "0.18" : "0.10"})`,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: isCenter
          ? "0 24px 64px rgba(0,0,0,0.75)"
          : "0 6px 20px rgba(0,0,0,0.5)",
        transition: "border-color 0.2s, box-shadow 0.4s",
      }}>
        {/* Image */}
        <div style={{ flex: "0 0 52%", position: "relative", overflow: "hidden" }}>
          {motif.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={motif.imageUrl} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            // Generated node: waveform art as primary visual
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(160deg, #0e1a14 0%, #111827 60%, #0a1628 100%)",
              display: "flex", alignItems: "flex-end",
              padding: "0 12px 10px",
              gap: 2,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 40%, rgba(107,230,150,0.10) 0%, transparent 70%)",
              }} />
              {IMMER_WAVE.map((h, i) => {
                const barPos = (i + 0.5) / IMMER_WAVE.length;
                return (
                  <div key={i} style={{
                    flex: 1, borderRadius: 2,
                    height: `${h * 70}%`,
                    background: barPos < progress
                      ? "rgba(107,230,150,0.85)"
                      : "rgba(255,255,255,0.10)",
                  }} />
                );
              })}
            </div>
          )}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(24,24,28,0.95) 100%)",
          }} />
        </div>

        {/* Content */}
        <div style={{
          flex: 1, padding: "10px 12px 12px",
          display: "flex", flexDirection: "column", gap: 5, overflow: "hidden",
          minHeight: 0,
        }}>
          <span style={{
            ...MiSans, fontSize: isCenter ? 14 : 12, fontWeight: 500, lineHeight: 1.3,
            color: isActive ? accentColor : "#fff",
            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            flexShrink: 0,
          }}>
            {motif.title}
          </span>

          {motif.moodTags.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexShrink: 0, overflow: "hidden" }}>
              {motif.moodTags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  ...MiSans, fontSize: 10, color: "rgba(255,255,255,0.45)",
                  background: "rgba(255,255,255,0.07)",
                  padding: "2px 7px", borderRadius: 20, whiteSpace: "nowrap",
                }}>{tag}</span>
              ))}
            </div>
          )}

          {motif.epitaph && (
            <p style={{
              ...MiSans, fontSize: 11, fontWeight: 330,
              color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: isCenter ? 3 : 2,
              WebkitBoxOrient: "vertical",
              flexShrink: 0,
            }}>
              {motif.epitaph}
            </p>
          )}

          {/* Push player to bottom */}
          <div style={{ flex: 1, minHeight: 0 }} />

          {/* Mini player */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
              background: "rgba(255,255,255,0.05)", borderRadius: 100,
              padding: "4px 8px 4px 5px",
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <button onClick={handlePlay} style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: accentColor, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {playing ? (
                <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
                  <rect x="0" y="0" width="2.5" height="9" rx="1" fill="#000" />
                  <rect x="5.5" y="0" width="2.5" height="9" rx="1" fill="#000" />
                </svg>
              ) : (
                <svg width="9" height="10" viewBox="0 0 9 10" fill="none">
                  <path d="M1.5 1.5L7.5 5L1.5 8.5V1.5Z" fill="#000" />
                </svg>
              )}
            </button>
            <div style={{ flex: 1, height: 18, display: "flex", alignItems: "center", gap: 1.5 }}>
              {IMMER_WAVE.map((h, i) => {
                const barPos = (i + 0.5) / IMMER_WAVE.length;
                return (
                  <div key={i} style={{
                    flex: 1, borderRadius: 1,
                    height: `${h * 100}%`,
                    background: barPos < progress ? accentColor : "rgba(255,255,255,0.2)",
                  }} />
                );
              })}
            </div>
            <span style={{
              ...MiSans, fontSize: 10, color: "rgba(255,255,255,0.45)", flexShrink: 0,
            }}>
              {fmtTime(duration - currentTime)}
            </span>
          </div>

        </div>
      </div>

      {!data.standaloneMode && (
        <>
          <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
          <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: "none" }} />
        </>
      )}
    </div>
  );
}

/* ── ZoomWidget — renders inside ReactFlow context so useViewport / useReactFlow work ── */
function ZoomWidget() {
  const { setViewport } = useReactFlow();
  const { zoom, x, y } = useViewport();
  const pct = Math.round(zoom * 100);
  const btnStyle: React.CSSProperties = {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)",
  };
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 8, borderRadius: 24, padding: 12,
      background: "rgba(255,255,255,0.06)",
    }}>
      <button style={btnStyle}
        onClick={() => setViewport({ zoom: Math.max(0.3, zoom - 0.1), x, y }, { duration: 150 })}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      <span style={{ fontFamily: "'MiSans','PingFang SC',ui-sans-serif,sans-serif", fontSize: 16, color: "rgba(255,255,255,0.5)", userSelect: "none", lineHeight: 1 }}>
        {pct}%
      </span>
      <button style={btnStyle}
        onClick={() => setViewport({ zoom: Math.min(1.8, zoom + 0.1), x, y }, { duration: 150 })}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  );
}

/* ── GraveNode ── */
function GraveNode({ data }: NodeProps<NodeData>) {
  const {
    motif, index, visible, isSelected, remixMode, isRemixSelected,
    canvasMode, isGroupLeader, groupTag, groupAccentColor,
    anySelected, isGenerating, nodeType, extraImageUrls, isCenter, isEdgeHighlighted,
  } = data;
  void anySelected;

  const [imageIndex, setImageIndex] = useState(0);
  const [ringAngle, setRingAngle] = useState(0);
  const [isRingDragging, setIsRingDragging] = useState(false);
  const ringDragRef = useRef<{ startPA: number; startRA: number; startIdx: number }>({
    startPA: 0, startRA: 0, startIdx: 0,
  });
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const nodeContainerRef = useRef<HTMLDivElement>(null);

  const isSource = nodeType === "source";
  const isActive = isSelected || !!isRemixSelected;
  const isRemixDimmed = remixMode && !isRemixSelected;
  const accentColor = "#6BE696";

  const imageUrls = [motif.imageUrl, ...(extraImageUrls ?? [])].filter(Boolean) as string[];
  const currentImg = imageUrls[imageIndex] ?? null;

  if (canvasMode === "沉浸") {
    return <ImmersiveCard data={data} />;
  }

  function getPointerAngle(e: React.PointerEvent) {
    const el = nodeContainerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2)) * (180 / Math.PI);
  }

  function isInScrubZone(e: React.PointerEvent) {
    const el = nodeContainerRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const r = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
    const outerR = rect.width / 2;
    // Sprocket band: between photo edge (67%) and reel outer edge
    return r >= outerR * 0.67 && r <= outerR + 2;
  }

  function handleRingPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isInScrubZone(e) || imageUrls.length < 2) return;
    e.stopPropagation();
    e.preventDefault();
    ringDragRef.current = { startPA: getPointerAngle(e), startRA: ringAngle, startIdx: imageIndex };
    setIsRingDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleRingPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isRingDragging) return;
    e.stopPropagation();
    let delta = getPointerAngle(e) - ringDragRef.current.startPA;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    const newRA = ringDragRef.current.startRA + delta;
    setRingAngle(newRA);
    const n = imageUrls.length;
    const step = 360 / n;
    const steps = Math.round(delta / step);
    const newIdx = ((ringDragRef.current.startIdx + steps) % n + n) % n;
    if (newIdx !== imageIndex) {
      setImageIndex(newIdx);
      data.onSwap?.(motif.id, newIdx > 0);
    }
  }

  function handleRingPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isRingDragging) return;
    e.stopPropagation();
    setIsRingDragging(false);
    const n = imageUrls.length;
    if (n > 1) {
      const step = 360 / n;
      const rawIdx = Math.round(ringAngle / step);
      const snappedIdx = ((rawIdx % n) + n) % n;
      const snappedAngle = rawIdx * step;
      setRingAngle(snappedAngle);
      if (snappedIdx !== imageIndex) {
        setImageIndex(snappedIdx);
        data.onSwap?.(motif.id, snappedIdx > 0);
      }
    }
  }

  // Deterministic muted gradient for generated nodes (no photo)
  const GRAD_PALETTE: [string, string][] = [
    ["#2b3545", "#18202d"],
    ["#352b45", "#201828"],
    ["#2b4535", "#182d20"],
    ["#45352b", "#2d201a"],
    ["#353545", "#1e1e2d"],
  ];
  const gradIdx = motif.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRAD_PALETTE.length;
  const [gradC1, gradC2] = GRAD_PALETTE[gradIdx];

  const opacity = !visible ? 0 : isRemixDimmed ? 0.45 : 1;

  const borderColor = isActive
    ? accentColor
    : isEdgeHighlighted
    ? "rgba(107,230,150,0.6)"
    : remixMode
    ? "rgba(255,255,255,0.35)"
    : "rgba(255,255,255,0.17)";

  return (
    <div
      ref={nodeContainerRef}
      style={{
        width: "100%", height: "100%",
        opacity,
        transform: visible ? "scale(1)" : "scale(0.4)",
        transition: "opacity 0.45s cubic-bezier(0.34,1.56,0.64,1), transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: visible ? "auto" : "none",
        position: "relative",
        cursor: "pointer",
      }}
      onMouseEnter={() => {
        if (!isActive && visible && nodeContainerRef.current)
          setTooltipRect(nodeContainerRef.current.getBoundingClientRect());
      }}
      onMouseLeave={() => setTooltipRect(null)}
    >
      {/* Breathing wrapper — floats gently in 分支 mode */}
      <div style={{
        position: "absolute", inset: 0,
        animation: (canvasMode === "分支" && visible)
          ? `nodeBreathe ${(3 + (index % 4) * 0.65).toFixed(2)}s ease-in-out ${((index % 7) * 0.45).toFixed(2)}s infinite`
          : "none",
      }}>
      {isSource ? (
        /* ── Source node: circular film reel — sprocket band is the scrubber ── */
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "radial-gradient(circle at 50% 50%, #252529 0%, #1c1c20 60%, #141417 100%)",
            overflow: "hidden",
            border: `1.5px solid ${borderColor}`,
            boxShadow: isActive
              ? "0 0 0 3px rgba(107,230,150,0.22), 0 8px 32px rgba(0,0,0,0.7)"
              : "0 4px 22px rgba(0,0,0,0.55)",
            transition: "border-color 0.2s, box-shadow 0.2s",
            cursor: imageUrls.length > 1 ? (isRingDragging ? "grabbing" : "default") : "default",
            touchAction: "none",
          }}
          onPointerDown={handleRingPointerDown}
          onPointerMove={handleRingPointerMove}
          onPointerUp={handleRingPointerUp}
          onPointerCancel={handleRingPointerUp}
        >
          {/* Photo — centered, 67% of reel diameter; gradient fill for audio-only nodes */}
          {imageUrls.length === 0 ? (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "67%", height: "67%", borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #1e3228 0%, #192038 100%)", zIndex: 1 }} />
          ) : currentImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={imageIndex} src={currentImg} alt=""
              style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "67%", height: "67%", objectFit: "cover", borderRadius: "50%", zIndex: 1, animation: "reelFade 0.2s ease" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : null}
          {/* Sprocket + indicators SVG — the band rotates as the user scrubs */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none" }} viewBox="0 0 108 108">
            {/* Separator ring between photo and sprocket band */}
            <circle cx={54} cy={54} r={37} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />
            {/* Rotating group — sprockets + image dots */}
            <g
              transform={`rotate(${ringAngle} 54 54)`}
              style={{ transition: isRingDragging ? "none" : "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)" }}
            >
              {/* 8 sprocket holes */}
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const cx = 54 + Math.cos(a) * 44, cy = 54 + Math.sin(a) * 44;
                return <rect key={i} x={cx - 3} y={cy - 5} width={6} height={10} rx={1.5} fill="rgba(0,0,0,0.7)" transform={`rotate(${(i / 8) * 360} ${cx} ${cy})`} />;
              })}
              {/* Image position indicator dots (at r=49, slightly outside sprockets) */}
              {imageUrls.length > 1 && imageUrls.map((_, i) => {
                const a = (i / imageUrls.length) * Math.PI * 2 - Math.PI / 2;
                const active = i === imageIndex;
                return (
                  <circle key={i}
                    cx={54 + Math.cos(a) * 49} cy={54 + Math.sin(a) * 49}
                    r={active ? 3 : 2}
                    fill={active ? "rgba(140,140,148,0.9)" : "rgba(70,70,76,0.7)"}
                  />
                );
              })}
            </g>
          </svg>
          {/* Film grain */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", opacity: 0.06,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }} />
          {/* Radial vignette */}
          <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", background: "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0,0,0,0.32) 100%)" }} />
          {isRemixSelected && <CheckBadge />}
        </div>
      ) : (
        /* ── Generated node: circular reel with gradient center (no photo) ── */
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "radial-gradient(circle at 50% 50%, #222226 0%, #191920 60%, #131317 100%)",
          overflow: "hidden",
          border: `1.5px solid ${borderColor}`,
          boxShadow: isActive
            ? "0 0 0 3px rgba(107,230,150,0.22), 0 8px 32px rgba(0,0,0,0.7)"
            : "0 4px 18px rgba(0,0,0,0.5)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}>
          {/* Gradient color block — replaces the photo */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "67%", height: "67%",
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 32%, ${gradC1} 0%, ${gradC2} 100%)`,
            zIndex: 1,
          }} />
          {/* Sprocket holes — static, no scrubber needed */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none" }} viewBox="0 0 108 108">
            <circle cx={54} cy={54} r={37} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const cx = 54 + Math.cos(a) * 44, cy = 54 + Math.sin(a) * 44;
              return <rect key={i} x={cx - 3} y={cy - 5} width={6} height={10} rx={1.5} fill="rgba(0,0,0,0.6)" transform={`rotate(${(i / 8) * 360} ${cx} ${cy})`} />;
            })}
          </svg>
          {/* Film grain */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", opacity: 0.05,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }} />
          {/* Radial vignette */}
          <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", background: "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0,0,0,0.4) 100%)" }} />
          {isRemixSelected && <CheckBadge />}
        </div>
      )}
      </div>{/* end breathing wrapper */}

      {/* 归类 group badge — unified accent green */}
      {canvasMode === "归类" && isGroupLeader && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          zIndex: 20,
          pointerEvents: "none",
          background: "rgba(107,230,150,0.12)",
          border: "1px solid rgba(107,230,150,0.35)",
          borderRadius: 20,
          padding: "3px 10px",
          ...MiSans, fontSize: 11, fontWeight: 500,
          color: "#6BE696",
        }}>
          {groupTag}
        </div>
      )}

      {/* Active label below node */}
      {isActive && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          zIndex: 20,
          pointerEvents: "none",
          ...MiSans, fontSize: 12, fontWeight: 450,
          color: accentColor,
          textShadow: "0 0 12px rgba(107,230,150,0.6)",
        }}>
          {motif.title}
        </div>
      )}

      {/* Hover tooltip via portal — floats above all nodes & panels */}
      {tooltipRect && !isActive && visible && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          left: tooltipRect.left + tooltipRect.width / 2,
          top: tooltipRect.top - 10,
          transform: "translate(-50%, -100%)",
          zIndex: 9000,
          pointerEvents: "none",
          width: 192,
          background: "rgba(8,8,8,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "10px 12px",
          boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
        }}>
          <p style={{ ...MiSans, fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>{motif.title}</p>
          <p style={{ ...MiSans, fontSize: 11, fontStyle: "italic", color: "rgba(255,255,255,0.5)", margin: "4px 0 0", lineHeight: 1.5 }}>{motif.epitaph}</p>
        </div>,
        document.body
      )}

      {/* Generating pulse */}
      {isGenerating && (
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "2px solid #6BE696",
          animation: "motifPulse 1s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 25,
        }} />
      )}

      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Left}  style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { grave: GraveNode };

/* ── buildNodes ── */
function buildNodes(
  motifs: MotifSummary[],
  todayIndex: number,
  selectedMotifId?: string | null,
  remixMode?: boolean,
  remixSelectedIds?: Set<string>,
  canvasMode: CanvasMode = "归类",
  loadingMotifIds?: Set<string>,
  relationships: Relationship[] = [],
  onNodeImageSwap?: (id: string, swapped: boolean) => void,
): Node[] {
  if (motifs.length === 0) return [];

  const baseX = 460;
  const baseY = 280;
  const anySelected = !!selectedMotifId;

  function makeData(motif: MotifSummary, idx: number, extra?: Partial<NodeData>): NodeData {
    const isSource = motif.imageUrl !== null || motif.id.startsWith("user-");
    return {
      motif, index: idx, visible: getBirthDay(motif, idx) <= todayIndex,
      isSelected: selectedMotifId === motif.id,
      remixMode, isRemixSelected: remixSelectedIds?.has(motif.id) ?? false,
      canvasMode, anySelected,
      isGroupLeader: true,
      isGenerating: loadingMotifIds?.has(motif.id) ?? false,
      nodeType: isSource ? "source" : "generated",
      extraImageUrls: motif.extraImageUrls ?? (SECOND_IMAGE_URLS[motif.id] ? [SECOND_IMAGE_URLS[motif.id]!] : []),
      onSwap: onNodeImageSwap,
      ...extra,
    };
  }

  /* ─────────── 归类: column layout per tag ─────────── */
  if (canvasMode === "归类") {
    const groups = new Map<string, MotifSummary[]>();
    for (const motif of motifs) {
      const origIndex = motifs.indexOf(motif);
      if (getBirthDay(motif, origIndex) > todayIndex) continue; // skip future motifs — avoids phantom columns
      const tag = motif.moodTags[0] ?? "其他";
      if (!groups.has(tag)) groups.set(tag, []);
      groups.get(tag)!.push(motif);
    }
    const groupKeys = [...groups.keys()];

    const NODE_W = 168;
    const COL_GAP = 104;
    const ROW_GAP = 18;

    const totalW = groupKeys.length * NODE_W + (groupKeys.length - 1) * COL_GAP;
    const startX = baseX - totalW / 2;

    // Top-align all columns: use actual per-node sizes for height, not fixed NODE_W
    function colActualHeight(gm: MotifSummary[]): number {
      return gm.reduce((h, m, i) => {
        const ns = (m.imageUrl !== null || m.id.startsWith("user-")) ? 168 : 88;
        return h + ns + (i < gm.length - 1 ? ROW_GAP : 0);
      }, 0);
    }
    const maxColH = Math.max(...groupKeys.map(tag => colActualHeight(groups.get(tag)!)));
    const startY = baseY - maxColH / 2;

    const result: Node[] = [];
    groupKeys.forEach((tag, gi) => {
      const groupMotifs = groups.get(tag)!;
      const accentColor = GROUP_ACCENT[tag] ?? "rgba(255,255,255,0.5)";
      const colX = startX + gi * (NODE_W + COL_GAP);

      let rowY = startY;
      groupMotifs.forEach((motif, si) => {
        const origIndex = motifs.indexOf(motif);
        const isSource = motif.imageUrl !== null || motif.id.startsWith("user-");
        const nodeSize = isSource ? 168 : 88;
        const offset = (NODE_W - nodeSize) / 2;

        result.push({
          id: motif.id,
          type: "grave",
          position: { x: colX + offset, y: rowY },
          selectable: getBirthDay(motif, origIndex) <= todayIndex,
          zIndex: 200,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: makeData(motif, origIndex, {
            isGroupLeader: si === 0,
            groupTag: tag,
            groupAccentColor: accentColor,
          }) satisfies NodeData,
          style: { width: nodeSize, height: nodeSize },
        });
        rowY += nodeSize + ROW_GAP;
      });
    });
    return result;
  }

  /* ─────────── 分支: organic scatter layout ─────────── */
  if (canvasMode === "分支") {
    // Only remix edges define derivation hierarchy; other edges are just associations
    const remixTargets = new Set<string>();
    const incomingRemix = new Map<string, string[]>();
    for (const rel of relationships) {
      if (rel.relationType === "remix") {
        remixTargets.add(rel.target);
        if (!incomingRemix.has(rel.target)) incomingRemix.set(rel.target, []);
        incomingRemix.get(rel.target)!.push(rel.source);
      }
    }

    function idHash(id: string): number {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
      return Math.abs(h);
    }

    // Root nodes: not produced by any remix
    const rootNodes = motifs.filter(m => !remixTargets.has(m.id));
    // Only visible roots join the circle; future/invisible nodes are tucked offscreen
    const visibleRoots = rootNodes.filter(m => getBirthDay(m, motifs.indexOf(m)) <= todayIndex);
    const N = visibleRoots.length;

    const nodePositions = new Map<string, { x: number; y: number }>();

    // Circular distribution — fixed radius, spacing auto-adapts to visible count
    if (N > 0) {
      const radius = 400;
      visibleRoots.forEach((motif, i) => {
        const hash = idHash(motif.id);
        const jx = (hash % 40) - 20;
        const jy = ((hash >> 4) % 40) - 20;
        const angle = (i / N) * 2 * Math.PI - Math.PI / 2; // start from top
        nodePositions.set(motif.id, {
          x: baseX + Math.cos(angle) * radius + jx,
          y: baseY + Math.sin(angle) * radius + jy,
        });
      });
    }

    // Invisible future root nodes: place far offscreen (render as tiny invisible dots)
    rootNodes.filter(m => !nodePositions.has(m.id)).forEach((motif, i) => {
      nodePositions.set(motif.id, { x: baseX + 1200 + i * 40, y: baseY - 1200 });
    });

    // Place remix-derived nodes near the centroid of their sources
    const toPlace = motifs.filter(m => remixTargets.has(m.id));
    let safety = 0;
    while (toPlace.length > 0 && safety++ < 50) {
      const idx = toPlace.findIndex(m =>
        (incomingRemix.get(m.id) ?? []).every(s => nodePositions.has(s)),
      );
      if (idx === -1) {
        // Fallback: scatter unresolved nodes to the right
        toPlace.forEach((m, i) => {
          const hash = idHash(m.id);
          nodePositions.set(m.id, { x: baseX + 520 + i * 240, y: baseY + (hash % 160) - 80 });
        });
        break;
      }
      const motif = toPlace.splice(idx, 1)[0];
      const srcs = (incomingRemix.get(motif.id) ?? [])
        .map(s => nodePositions.get(s))
        .filter(Boolean) as { x: number; y: number }[];
      const avgX = srcs.reduce((s, p) => s + p.x, 0) / srcs.length;
      const avgY = srcs.reduce((s, p) => s + p.y, 0) / srcs.length;
      const hash = idHash(motif.id);
      nodePositions.set(motif.id, {
        x: avgX + 300 + (hash % 40) - 20,
        y: avgY + ((hash >> 4) % 60) - 30,
      });
    }

    return motifs.map((motif, idx) => {
      const pos = nodePositions.get(motif.id) ?? { x: baseX, y: baseY };
      const isSource = motif.imageUrl !== null || motif.id.startsWith("user-");
      const nodeSize = isSource ? 168 : 88;

      return {
        id: motif.id,
        type: "grave",
        position: { x: pos.x - nodeSize / 2, y: pos.y - nodeSize / 2 },
        selectable: getBirthDay(motif, idx) <= todayIndex,
        zIndex: 200,
        data: makeData(motif, idx) satisfies NodeData,
        style: { width: nodeSize, height: nodeSize },
      };
    });
  }

  /* ─────────── 沉浸: filmstrip layout ─────────── */
  if (canvasMode === "沉浸") {
    // Source motifs: have an image or are user-captured — sorted by capture date
    const sourcePairs = motifs
      .map((m, i) => ({ motif: m, idx: i, birthDay: getBirthDay(m, i) }))
      .filter(p => {
        const isSource = p.motif.imageUrl !== null || p.motif.id.startsWith("user-");
        return isSource && p.birthDay <= todayIndex;
      })
      .sort((a, b) => a.birthDay - b.birthDay);

    // Generated motifs: no image, not user-captured — always appended after sources
    const maxSourceBD = sourcePairs.length > 0 ? sourcePairs[sourcePairs.length - 1].birthDay : 0;
    const generatedPairs = motifs
      .map((m, i) => ({ motif: m, idx: i }))
      .filter(({ motif }) => motif.imageUrl === null && !motif.id.startsWith("user-") && !motif.id.startsWith("ph-"))
      .map((p, k) => ({ ...p, birthDay: maxSourceBD + 1 + k }));

    const visiblePairs = [...sourcePairs, ...generatedPairs];

    if (visiblePairs.length === 0) return [];

    // Center = source motif closest to todayIndex (not generated)
    let centerI = sourcePairs.length > 0 ? sourcePairs.length - 1 : 0;
    let minDiff = Infinity;
    sourcePairs.forEach(({ birthDay }, i) => {
      const d = Math.abs(birthDay - todayIndex);
      if (d < minDiff) { minDiff = d; centerI = i; }
    });

    const CENTER_W = 260, CENTER_H = 360;
    const ADJ_W = 178, ADJ_H = 248;
    const FAR_W = 128, FAR_H = 178;
    const STEP = 310;

    const result: Node[] = [];
    visiblePairs.forEach(({ motif, idx }, i) => {
      const pos = i - centerI; // signed distance from integer center (used for sizing + data)
      const absPos = Math.abs(pos);
      if (absPos > 3) return; // render ±3 so transitions are smooth when center shifts

      const w = absPos === 0 ? CENTER_W : absPos === 1 ? ADJ_W : FAR_W;
      const h = absPos === 0 ? CENTER_H : absPos === 1 ? ADJ_H : FAR_H;

      // Reversed layout: newer nodes sit to the LEFT so dragging the timeline
      // right (newer) pans the viewport right (gallery slides right).
      const canvasSlot = visiblePairs.length - 1 - i;
      result.push({
        id: motif.id,
        type: "grave",
        // Fixed absolute position — viewport pans to slide, nodes don't jump
        position: {
          x: baseX + 130 + canvasSlot * STEP - w / 2,
          y: baseY - h / 2,
        },
        selectable: true,
        zIndex: 200 - absPos * 10,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: makeData(motif, idx, {
          isCenter: pos === 0,
          immersivePos: pos,
        }) satisfies NodeData,
        style: { width: w, height: h },
      });
    });
    return result;
  }

  return [];
}

/* ── PrecomputedEdge — renders a pre-calculated bezier arc from data.path ── */
function PrecomputedEdge({ id, data, style }: EdgeProps) {
  const d = (data as { path?: string } | undefined)?.path;
  if (!d) return null;
  return (
    <>
      {/* Wide transparent hit-area for easy clicking */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={18} style={{ cursor: "pointer" }} />
      <path id={id} className="react-flow__edge-path" d={d} fill="none" style={style} />
    </>
  );
}

const edgeTypes: EdgeTypes = { arc: PrecomputedEdge };

/* ── ImmersiveFilmstrip — pure CSS slideshow, no ReactFlow ── */
function ImmersiveFilmstrip({
  displayMotifs,
  todayFloat,
  todayIndex,
  selectedMotifId,
  onNodeSelect,
  onImmersiveCenter,
}: {
  displayMotifs: MotifSummary[];
  todayFloat: number;
  todayIndex: number;
  selectedMotifId?: string | null;
  onNodeSelect?: (m: MotifSummary) => void;
  onImmersiveCenter?: (bd: number) => void;
}) {
  const [vw, setVw] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    function onResize() { setVw(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const mob = vw < 768;

  const CENTER_W = mob ? 220 : 340, CENTER_H = mob ? 300 : 470;
  const ADJ_W = mob ? 148 : 224, ADJ_H = mob ? 204 : 310;
  const FAR_W = mob ? 104 : 156, FAR_H = mob ? 144 : 216;
  const STEP = mob ? 244 : 370;

  // Source motifs visible on timeline, sorted old→new
  const sourcePairs = useMemo(() =>
    displayMotifs
      .map((m, i) => ({ motif: m, idx: i, birthDay: getBirthDay(m, i) }))
      .filter(({ motif, birthDay }) =>
        (motif.imageUrl !== null || motif.id.startsWith("user-")) && birthDay <= todayIndex
      )
      .sort((a, b) => a.birthDay - b.birthDay),
  [displayMotifs, todayIndex]);

  // Generated (AI) motifs — always appended after sources
  const generatedPairs = useMemo(() => {
    const maxBD = sourcePairs.length > 0 ? sourcePairs[sourcePairs.length - 1].birthDay : 0;
    return displayMotifs
      .map((m, i) => ({ motif: m, idx: i }))
      .filter(({ motif }) =>
        motif.imageUrl === null && !motif.id.startsWith("user-") && !motif.id.startsWith("ph-")
      )
      .map((p, k) => ({ ...p, birthDay: maxBD + 1 + k }));
  }, [displayMotifs, sourcePairs]);

  const allPairs = useMemo(() => [...sourcePairs, ...generatedPairs], [sourcePairs, generatedPairs]);

  // Map todayFloat (day axis) → fractional array index in sourcePairs
  const floatIdx = useMemo(() => {
    const sp = sourcePairs;
    if (sp.length === 0) return 0;
    if (todayFloat <= sp[0].birthDay) return 0;
    if (todayFloat >= sp[sp.length - 1].birthDay) return sp.length - 1;
    for (let i = 0; i < sp.length - 1; i++) {
      if (todayFloat >= sp[i].birthDay && todayFloat <= sp[i + 1].birthDay) {
        return i + (todayFloat - sp[i].birthDay) / (sp[i + 1].birthDay - sp[i].birthDay);
      }
    }
    return sp.length - 1;
  }, [sourcePairs, todayFloat]);

  // Integer center for sizing snaps
  const centerI = Math.round(floatIdx);

  return (
    <div style={{
      width: "100%", height: "100%",
      position: "relative", overflow: "hidden",
    }}>
      {allPairs.map(({ motif, idx }, i) => {
        const absDist = Math.abs(i - floatIdx);
        if (absDist > 3.5) return null;

        const intDist = Math.abs(i - centerI);
        const isCenter = intDist === 0;
        const w = intDist === 0 ? CENTER_W : intDist === 1 ? ADJ_W : FAR_W;
        const h = intDist === 0 ? CENTER_H : intDist === 1 ? ADJ_H : FAR_H;

        // offset=0 → card center at 50% of container; positive offset → slide right
        const offset = (floatIdx - i) * STEP;

        const isSourceMotif = motif.imageUrl !== null || motif.id.startsWith("user-");

        return (
          <div
            key={motif.id}
            onClick={() => {
              const bd = getBirthDay(motif, idx);
              if (bd > 0) onImmersiveCenter?.(bd);
              onNodeSelect?.(motif);
            }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: w, height: h,
              // translate: center card at (50%, 50%); -50% shifts by half the card's own size
              transform: `translate(calc(${offset}px - 50%), -50%)`,
              transition: "width 0.18s ease, height 0.18s ease",
              cursor: "pointer",
              zIndex: 200 - intDist * 10,
              pointerEvents: intDist > 2 ? "none" : "auto",
            }}
          >
            <ImmersiveCard data={{
              motif,
              index: idx,
              visible: true,
              isSelected: selectedMotifId === motif.id,
              canvasMode: "沉浸",
              isCenter,
              immersivePos: Math.round(i - floatIdx),
              nodeType: isSourceMotif ? "source" : "generated",
              standaloneMode: true,
            }} />
          </div>
        );
      })}
    </div>
  );
}

/* ── MotifGraph ── */
interface MotifGraphProps {
  onNodeSelect?: (motif: MotifSummary) => void;
  selectedMotifId?: string | null;
  focusMotifId?: string | null;
  todayIndex?: number;
  todayFloat?: number;
  remixMode?: boolean;
  remixSelectedIds?: Set<string>;
  onRemixNodeSelect?: (motif: MotifSummary) => void;
  canvasMode?: CanvasMode;
  extraMotifs?: MotifSummary[];
  extraRelationships?: Relationship[];
  loadingMotifIds?: Set<string>;
  deletedMotifIds?: Set<string>;
  onPaneClick?: () => void;
  onNodeImageSwap?: (id: string, swapped: boolean) => void;
  onImmersiveCenter?: (todayIndex: number) => void;
}

export default function MotifGraph({
  todayFloat: todayFloatProp,
  onNodeSelect,
  selectedMotifId,
  focusMotifId,
  todayIndex = 31,
  remixMode = false,
  remixSelectedIds,
  onRemixNodeSelect,
  canvasMode = "归类",
  extraMotifs,
  extraRelationships,
  loadingMotifIds,
  deletedMotifIds,
  onPaneClick,
  onNodeImageSwap,
  onImmersiveCenter,
}: MotifGraphProps = {}) {
  const router = useRouter();
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const [motifs, setMotifs] = useState<MotifSummary[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  // 分支 mode interactivity
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeHighlightIds, setEdgeHighlightIds] = useState<Set<string>>(new Set());
  const [nodeHighlightId, setNodeHighlightId] = useState<string | null>(null);
  const [branchDragPos, setBranchDragPos] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    Promise.all([api.listMotifs(), api.relationships()])
      .then(([motifData, edgeData]) => { setMotifs(motifData); setRelationships(edgeData); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayMotifs = useMemo(() => {
    const base = motifs.length > 0 ? motifs : PLACEHOLDER_MOTIFS;
    const filtered = deletedMotifIds?.size ? base.filter(m => !deletedMotifIds.has(m.id)) : base;
    const extras = extraMotifs?.filter(m => !deletedMotifIds?.has(m.id)) ?? [];
    // Generated placeholder nodes appear in all views (same data, different layout)
    const placeholderGen = motifs.length === 0 ? PLACEHOLDER_GENERATED : [];
    return [...filtered, ...extras, ...placeholderGen];
  }, [motifs, extraMotifs, deletedMotifIds]);

  const displayEdges = useMemo(() => {
    const base = motifs.length > 0 ? relationships : (canvasMode === "分支" ? PLACEHOLDER_RELATIONSHIPS : []);
    return extraRelationships?.length ? [...base, ...extraRelationships] : base;
  }, [motifs.length, relationships, canvasMode, extraRelationships]);

  // Source pairs for the 沉浸 filmstrip — used by the viewport slide effect
  const immersiveSourcePairs = useMemo(() => {
    if (canvasMode !== "沉浸") return [] as Array<{ birthDay: number }>;
    return displayMotifs
      .map((m, i) => ({ motif: m, birthDay: getBirthDay(m, i) }))
      .filter(({ motif, birthDay }) => {
        const isSource = motif.imageUrl !== null || motif.id.startsWith("user-");
        return isSource && birthDay <= todayIndex;
      })
      .sort((a, b) => a.birthDay - b.birthDay);
  }, [canvasMode, displayMotifs, todayIndex]);

  const nodes = useMemo(
    () => buildNodes(displayMotifs, todayIndex, selectedMotifId, remixMode, remixSelectedIds, canvasMode, loadingMotifIds, displayEdges, onNodeImageSwap),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayMotifs, todayIndex, selectedMotifId, remixMode, remixSelectedIds, canvasMode, loadingMotifIds, displayEdges],
  );

  // Clear 分支 interaction state when leaving the mode
  useEffect(() => {
    if (canvasMode !== "分支") {
      setBranchDragPos({});
      setSelectedEdgeId(null);
      setEdgeHighlightIds(new Set());
      setNodeHighlightId(null);
    }
  }, [canvasMode]);

  // Clear node highlight when panel closes
  useEffect(() => {
    if (!selectedMotifId) setNodeHighlightId(null);
  }, [selectedMotifId]);

  // Overlay drag positions + edge highlight onto computed nodes
  const finalNodes = useMemo(() => {
    const hasDrag = Object.keys(branchDragPos).length > 0;
    const hasHL = edgeHighlightIds.size > 0;
    const hasNodeHL = nodeHighlightId !== null;
    if (!hasDrag && !hasHL && !hasNodeHL) return nodes;
    // Source nodes of the selected generated node get the highlight border
    const nodeHLSources = hasNodeHL
      ? new Set(displayEdges.filter(r => r.target === nodeHighlightId).map(r => r.source))
      : new Set<string>();
    return nodes.map(n => ({
      ...n,
      ...(branchDragPos[n.id] ? { position: branchDragPos[n.id] } : {}),
      data: {
        ...n.data,
        isEdgeHighlighted: edgeHighlightIds.has(n.id) || nodeHLSources.has(n.id),
      },
    }));
  }, [nodes, branchDragPos, edgeHighlightIds, nodeHighlightId, displayEdges]);

  // Compute bezier arcs from finalNodes positions so paths update as nodes are dragged
  const edges = useMemo((): Edge[] => {
    if (canvasMode !== "分支") return [];

    const nodeMap = new Map(finalNodes.map(n => [n.id, n]));

    return displayEdges.map(rel => {
      const srcN = nodeMap.get(rel.source);
      const tgtN = nodeMap.get(rel.target);
      const id = `${rel.source}-${rel.target}`;
      const isSelected = id === selectedEdgeId;
      const isNodeHL = nodeHighlightId !== null && (rel.source === nodeHighlightId || rel.target === nodeHighlightId);
      const isHighlighted = isSelected || isNodeHL;
      const isRemix = rel.relationType === "remix";

      let path = "M 0,0 Q 0,0 0,0";

      if (srcN && tgtN) {
        const sw = typeof srcN.style?.width === "number" ? srcN.style.width : 168;
        const sh = typeof srcN.style?.height === "number" ? srcN.style.height : 168;
        const tw = typeof tgtN.style?.width === "number" ? tgtN.style.width : 168;
        const th = typeof tgtN.style?.height === "number" ? tgtN.style.height : 168;

        const scx = srcN.position.x + sw / 2, scy = srcN.position.y + sh / 2;
        const tcx = tgtN.position.x + tw / 2, tcy = tgtN.position.y + th / 2;
        const dx = tcx - scx, dy = tcy - scy;
        const dist = Math.hypot(dx, dy);

        if (dist > 4) {
          const nx = dx / dist, ny = dy / dist;
          // Start/end exactly on circle circumferences
          const x1 = scx + nx * (sw / 2 - 2), y1 = scy + ny * (sh / 2 - 2);
          const x2 = tcx - nx * (tw / 2 - 2), y2 = tcy - ny * (th / 2 - 2);
          // Quadratic bezier — control point bows gently perpendicular to the line
          const bow = Math.min(dist * 0.14, 60);
          const qx = (x1 + x2) / 2 - ny * bow, qy = (y1 + y2) / 2 + nx * bow;
          path = `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${qx.toFixed(1)},${qy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
        }
      }

      return {
        id,
        source: rel.source,
        target: rel.target,
        type: "arc",
        data: { path },
        style: {
          stroke: isHighlighted ? "#6BE696" : isRemix ? "rgba(107,230,150,0.6)" : "rgba(255,255,255,0.22)",
          strokeWidth: isHighlighted ? 2.5 : isRemix ? 1.5 : 1,
          strokeDasharray: isRemix || isHighlighted ? undefined : "4 4",
        },
        zIndex: isHighlighted ? 100 : 1,
      };
    });
  }, [displayEdges, finalNodes, canvasMode, selectedEdgeId, nodeHighlightId]);

  function handleNodesChange(changes: NodeChange[]) {
    if (canvasMode !== "分支") return;
    const updates: Record<string, { x: number; y: number }> = {};
    for (const c of changes) {
      if (c.type === "position" && c.position) updates[c.id] = c.position;
    }
    if (Object.keys(updates).length > 0) setBranchDragPos(prev => ({ ...prev, ...updates }));
  }

  function handleEdgeClick(_: React.MouseEvent, edge: Edge) {
    const next = selectedEdgeId === edge.id ? null : edge.id;
    setSelectedEdgeId(next);
    setEdgeHighlightIds(next ? new Set([edge.source, edge.target]) : new Set());
    setNodeHighlightId(null);
  }

  useEffect(() => {
    if (!focusMotifId || !rfInstance.current) return;
    const node = nodes.find(n => n.id === focusMotifId);
    if (!node) return;
    const w = typeof node.style?.width === "number" ? node.style.width : 96;
    const h = typeof node.style?.height === "number" ? node.style.height : 96;
    rfInstance.current.setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: 1.2, duration: 700 });
  }, [focusMotifId, nodes]);

  // Re-fit when mode or todayIndex changes (归类 / 分支 only; 沉浸 uses slide effect)
  useEffect(() => {
    if (!rfInstance.current || canvasMode === "沉浸") return;
    setTimeout(() => rfInstance.current?.fitView({ duration: 350, padding: 0.18 }), 50);
  }, [canvasMode, todayIndex]);

  // 沉浸: set a comfortable fixed zoom on first entry
  useEffect(() => {
    if (canvasMode !== "沉浸" || !rfInstance.current) return;
    const { x, y } = rfInstance.current.getViewport();
    rfInstance.current.setViewport({ x, y, zoom: 0.9 });
  }, [canvasMode]);

  // 沉浸: slide the canvas in sync with the continuous todayFloat
  useEffect(() => {
    if (canvasMode !== "沉浸" || !rfInstance.current) return;
    const sp = immersiveSourcePairs;
    if (sp.length === 0) return;

    const tf = todayFloatProp ?? todayIndex;

    // Map day-float → fractional index in the sorted source-pair array
    let floatIdx: number;
    if (tf <= sp[0].birthDay) {
      floatIdx = 0;
    } else if (tf >= sp[sp.length - 1].birthDay) {
      floatIdx = sp.length - 1;
    } else {
      floatIdx = sp.length - 1;
      for (let i = 0; i < sp.length - 1; i++) {
        if (tf >= sp[i].birthDay && tf <= sp[i + 1].birthDay) {
          floatIdx = i + (tf - sp[i].birthDay) / (sp[i + 1].birthDay - sp[i].birthDay);
          break;
        }
      }
    }

    // Canvas x of the node whose center aligns with floatIdx.
    // Because the layout is reversed (newer = left), the canvas slot for
    // floatIdx is (N-1 - floatIdx), mirroring the buildNodes canvasSlot formula.
    const targetCX = 590 + (sp.length - 1 - floatIdx) * 310;
    const { zoom, y } = rfInstance.current.getViewport();
    rfInstance.current.setViewport({
      x: window.innerWidth / 2 - targetCX * zoom,
      y,
      zoom,
    });
  }, [todayFloatProp, todayIndex, canvasMode, immersiveSourcePairs]);

  if (loading) return null;

  // 沉浸 mode: pure CSS filmstrip — no ReactFlow, cards slide via transform
  if (canvasMode === "沉浸") {
    return (
      <div className="w-full h-full" style={{ background: "#0e0e12" }}>
        <ImmersiveFilmstrip
          displayMotifs={displayMotifs}
          todayFloat={todayFloatProp ?? todayIndex}
          todayIndex={todayIndex}
          selectedMotifId={selectedMotifId}
          onNodeSelect={onNodeSelect}
          onImmersiveCenter={onImmersiveCenter}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <style>{`
        @keyframes motifPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes reelFade { from { opacity:0 } to { opacity:1 } }
        @keyframes nodeBreathe {
          0%,100% { transform: translateY(0px) scale(1); }
          50%     { transform: translateY(-6px) scale(1.016); }
        }
      `}</style>
      <ReactFlow
        fitView
        nodes={finalNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.3}
        maxZoom={1.8}
        panOnScroll
        nodesDraggable={canvasMode === "分支"}
        onNodesChange={handleNodesChange}
        onEdgeClick={handleEdgeClick}
        onInit={instance => { rfInstance.current = instance; }}
        onNodeClick={(_, node) => {
          const nodeData = node.data as NodeData;
          if (!nodeData.visible) return;
          const motif = displayMotifs.find(m => m.id === node.id);
          if (!motif) return;
          // In 分支: clicking a generated node highlights its source edges/nodes
          if (canvasMode === "分支" && !remixMode) {
            if (nodeData.nodeType === "generated") {
              setNodeHighlightId(prev => prev === node.id ? null : node.id);
              setSelectedEdgeId(null);
              setEdgeHighlightIds(new Set());
            } else {
              setNodeHighlightId(null);
            }
          }
          if (remixMode && onRemixNodeSelect) {
            onRemixNodeSelect(motif);
          } else if (onNodeSelect) {
            onNodeSelect(motif);
          } else {
            router.push(`/motif/${node.id}`);
          }
        }}
        onPaneClick={() => {
          if (canvasMode === "分支") {
            setSelectedEdgeId(null);
            setEdgeHighlightIds(new Set());
            setNodeHighlightId(null);
          }
          onPaneClick?.();
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Panel position="bottom-left" style={{ bottom: 80, left: 32, margin: 0 }}>
          <ZoomWidget />
        </Panel>
      </ReactFlow>
    </div>
  );
}
