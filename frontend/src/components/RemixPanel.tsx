"use client";

import { useEffect, useRef, useState } from "react";
import type { MotifSummary } from "@/lib/types";

const MiSans: React.CSSProperties = {
  fontFamily: "'MiSans', 'PingFang SC', 'Noto Sans SC', ui-sans-serif, sans-serif",
};

type RemixMode = "旋律为主" | "情绪融合" | "和声叠加";
const REMIX_MODES: RemixMode[] = ["旋律为主", "情绪融合", "和声叠加"];
const STYLE_CHIPS = ["国风", "弦乐", "Lofi", "电影感", "游戏配乐"];
const LYRICS_TEMPLATE =
  "[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]";

const MINI_WAVE = Array.from({ length: 36 }, (_, i) => {
  const x = i / 35;
  return Math.max(0.1, Math.min(1, 0.3 + 0.7 * Math.sin(x * Math.PI) * (0.5 + 0.5 * Math.sin(x * 7.1 + 0.5))));
});

const DURATION = 14;

function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ── Icons ── */

function IcClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcTrash() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M2.5 5h15M6.667 5V3.333a1.667 1.667 0 0 1 1.666-1.666h3.334a1.667 1.667 0 0 1 1.666 1.666V5m2.5 0v11.667a1.667 1.667 0 0 1-1.666 1.666H5.833a1.667 1.667 0 0 1-1.666-1.666V5h11.666z"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function IcPlay() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <path d="M1 1L9 6L1 11V1Z" fill="#000" />
    </svg>
  );
}

function IcPause() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
      <rect x="1" y="1" width="3" height="10" rx="1" fill="#000" />
      <rect x="6" y="1" width="3" height="10" rx="1" fill="#000" />
    </svg>
  );
}

function IcSparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 19 19" fill="none">
      <path
        d="M8.598 0.926C8.735 0.378 8.803 0.105 8.912 0.041C9.005-0.014 9.122-0.014 9.215 0.041C9.324 0.105 9.392 0.378 9.529 0.926L10.365 4.269C10.619 5.285 10.746 5.793 11.01 6.206C11.244 6.572 11.555 6.882 11.92 7.116C12.334 7.381 12.842 7.508 13.858 7.761L17.201 8.597C17.748 8.734 18.022 8.803 18.085 8.911C18.14 9.005 18.14 9.121 18.085 9.215C18.022 9.323 17.748 9.392 17.201 9.529L13.858 10.365C12.842 10.619 12.334 10.746 11.92 11.01C11.555 11.244 11.244 11.554 11.01 11.92C10.746 12.333 10.619 12.841 10.365 13.857L9.529 17.2C9.392 17.748 9.324 18.021 9.215 18.085C9.122 18.14 9.005 18.14 8.912 18.085C8.803 18.021 8.735 17.748 8.598 17.2L7.762 13.857C7.508 12.841 7.381 12.333 7.117 11.92C6.883 11.554 6.572 11.244 6.207 11.01C5.793 10.746 5.285 10.619 4.269 10.365L0.926 9.529C0.379 9.392 0.105 9.323 0.042 9.215C-0.013 9.121-0.013 9.005 0.042 8.911C0.105 8.803 0.379 8.734 0.926 8.597L4.269 7.761C5.285 7.508 5.793 7.381 6.207 7.116C6.572 6.882 6.883 6.572 7.117 6.206C7.381 5.793 7.508 5.285 7.762 4.269L8.598 0.926Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* expand-02 ↗ — always on style field */
function IcExpand() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 11L11 5M11 5H7M11 5V9"
        stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* minimize-01 ↙ — always on lyrics field */
function IcMinimize() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11 5L5 11M5 11H9M5 11V7"
        stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Label ── */

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      ...MiSans, fontWeight: 330, fontSize: 16, lineHeight: "145%",
      color: "rgba(255,255,255,0.64)", width: 32, flexShrink: 0, ...style,
    }}>
      {children}
    </span>
  );
}

/* ── MotifRow with its own mini audio player ── */

function MotifRow({ motif, onRemove }: { motif: MotifSummary; onRemove: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const actualDuration = motif.durationSec ?? DURATION;

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
        if (next >= actualDuration) { setPlaying(false); return 0; }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, motif.audioUrl, actualDuration]);

  function handlePlayToggle() {
    if (motif.audioUrl && audioElRef.current) {
      if (playing) { audioElRef.current.pause(); setPlaying(false); }
      else { audioElRef.current.play().catch(() => {}); setPlaying(true); }
    } else {
      setPlaying(p => !p);
    }
  }

  const progress = currentTime / actualDuration;

  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 20, width: "100%", flexShrink: 0 }}>
      {/* Thumbnail */}
      <div style={{
        width: 84, height: 84, flexShrink: 0, borderRadius: 24, overflow: "hidden",
        background: "linear-gradient(135deg, rgba(127,184,214,0.35) 0%, rgba(201,168,255,0.35) 100%)",
      }}>
        {motif.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={motif.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
      </div>

      {/* Info column */}
      <div style={{
        flex: 1, minWidth: 0, height: 84,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        {/* Title + tags + trash */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
            <span style={{ ...MiSans, fontWeight: 450, fontSize: 16, color: "#fff", lineHeight: "120%", flexShrink: 0 }}>
              {motif.title}
            </span>
            {motif.location && (
              <span style={{
                ...MiSans, fontWeight: 330, fontSize: 13, color: "rgba(255,255,255,0.64)",
                padding: "4px 10px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 200,
                whiteSpace: "nowrap", lineHeight: "20px",
              }}>
                {motif.location}
              </span>
            )}
            {motif.moodTags.slice(0, 1).map(tag => (
              <span key={tag} style={{
                ...MiSans, fontWeight: 330, fontSize: 13, color: "rgba(255,255,255,0.64)",
                padding: "4px 10px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 200,
                whiteSpace: "nowrap", lineHeight: "20px",
              }}>
                {tag}
              </span>
            ))}
          </div>
          <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
            <IcTrash />
          </button>
        </div>

        {/* Mini audio player */}
        <div style={{
          background: "rgba(255,255,255,0.07)", borderRadius: 400,
          display: "flex", alignItems: "center",
          padding: "0 12px", gap: 10, height: 42,
        }}>
          <button
            onClick={handlePlayToggle}
            style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "#6BE696", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {playing ? <IcPause /> : <IcPlay />}
          </button>
          <div style={{ flex: 1, position: "relative", height: 28 }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 1.5 }}>
              {MINI_WAVE.map((h, i) => {
                const barPos = (i + 0.5) / MINI_WAVE.length;
                return (
                  <div key={i} style={{
                    flex: 1, borderRadius: 1, minWidth: 2,
                    height: `${h * 100}%`,
                    background: barPos < progress ? "#6BE696" : "rgba(255,255,255,0.3)",
                  }} />
                );
              })}
            </div>
          </div>
          <span style={{ ...MiSans, fontWeight: 330, fontSize: 12, color: "rgba(255,255,255,0.64)", flexShrink: 0 }}>
            {fmtTime(actualDuration - Math.floor(currentTime))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── RemixPanel ── */

interface Props {
  open: boolean;
  selectedMotifs: MotifSummary[];
  onClose: () => void;
  onRemoveMotif: (id: string) => void;
  onGenerate?: (motifs: MotifSummary[]) => void;
  isMobile?: boolean;
}

export default function RemixPanel({ open, selectedMotifs, onClose, onRemoveMotif, onGenerate, isMobile }: Props) {
  const [mode, setMode] = useState<RemixMode>("旋律为主");
  const [styleVal, setStyleVal] = useState("");
  const [lyrics, setLyrics] = useState(LYRICS_TEMPLATE);
  const [expanded, setExpanded] = useState<"none" | "style" | "lyrics">("none");

  const isFocused = expanded !== "none";

  function isChipSelected(chip: string) {
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
    padding: 20,
    gap: 20,
    boxSizing: "border-box",
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
    padding: 24,
    gap: 24,
    boxSizing: "border-box",
  };

  return (
    <div style={panelStyle}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, height: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ ...MiSans, fontWeight: 450, fontSize: 20, color: "#fff", lineHeight: "120%" }}>
            融合动机
          </span>
          <span style={{
            ...MiSans, fontWeight: 330, fontSize: 14, color: "rgba(255,255,255,0.64)",
            padding: "6px 12px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 200,
          }}>
            已选：{selectedMotifs.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <IcClose />
        </button>
      </div>

      {/* ── Motif list ── */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ ...MiSans, fontWeight: 330, fontSize: 14, color: "rgba(255,255,255,0.64)", lineHeight: "120%", margin: 0 }}>
          想加入融合更多动机？在画布中添加选择：
        </p>
        {selectedMotifs.length === 0 ? (
          <p style={{ ...MiSans, fontWeight: 330, fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            在画布中点击节点以选择（至少 2 个）
          </p>
        ) : (
          selectedMotifs.map(motif => (
            <MotifRow key={motif.id} motif={motif} onRemove={() => onRemoveMotif(motif.id)} />
          ))
        )}
      </div>

      {/* ── Separator ── */}
      <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 48, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)" }} />
      </div>

      {/* ── Mode ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <Label>模式</Label>
        <div style={{
          flex: 1, height: 48,
          background: "rgba(0,0,0,0.36)",
          border: "1px solid rgba(255,255,255,0.5)",
          borderRadius: 18, padding: 8, display: "flex",
        }}>
          {REMIX_MODES.map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, height: 32, border: "none", cursor: "pointer", borderRadius: 12,
                background: mode === m ? "#FFFFFF" : "transparent",
                ...MiSans, fontWeight: mode === m ? 520 : 330, fontSize: 14,
                color: mode === m ? "#000000" : "#FFFFFF",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fields (style + lyrics) — fills remaining height ── */}
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
                <div style={{
                  flex: 1, minHeight: 0, position: "relative",
                  background: "rgba(255,255,255,0.12)", borderRadius: 24, overflow: "hidden",
                }}>
                  <textarea
                    value={styleVal}
                    onChange={e => setStyleVal(e.target.value)}
                    autoFocus
                    style={{
                      position: "absolute", inset: 0, width: "100%", height: "100%",
                      padding: "12px 44px 12px 16px", boxSizing: "border-box",
                      background: "none", border: "none", outline: "none", resize: "none",
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
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                  {STYLE_CHIPS.map(chip => {
                    const sel = isChipSelected(chip);
                    return (
                      <button key={chip} onClick={() => toggleChip(chip)} style={{
                        ...MiSans, fontWeight: sel ? 450 : 330, fontSize: 13,
                        color: sel ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.64)",
                        padding: "4px 10px",
                        border: `1px solid ${sel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"}`,
                        borderRadius: 200,
                        background: sel ? "rgba(255,255,255,0.18)" : "none",
                        cursor: "pointer", lineHeight: "20px",
                        transition: "background 0.15s, border-color 0.15s, color 0.15s",
                      }}>
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
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
                  <button onClick={() => setExpanded("style")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                    <IcExpand />
                  </button>
                </div>
                {/* Chips always visible when style not expanded */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {STYLE_CHIPS.map(chip => {
                    const sel = isChipSelected(chip);
                    return (
                      <button key={chip} onClick={() => toggleChip(chip)} style={{
                        ...MiSans, fontWeight: sel ? 450 : 330, fontSize: 13,
                        color: sel ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.64)",
                        padding: "4px 10px",
                        border: `1px solid ${sel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"}`,
                        borderRadius: 200,
                        background: sel ? "rgba(255,255,255,0.18)" : "none",
                        cursor: "pointer", lineHeight: "20px",
                        transition: "background 0.15s, border-color 0.15s, color 0.15s",
                      }}>
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* LYRICS ROW — gap 20px, IcMinimize always */}
        <div style={{
          display: "flex", gap: 20, alignItems: "stretch",
          ...(expanded === "style" ? { flexShrink: 0 } : { flex: 1, minHeight: 0 }),
        }}>
          <Label style={{ paddingTop: 14 }}>歌词</Label>

          {expanded === "style" ? (
            /* Folded: entire box clickable */
            <div
              onClick={() => setExpanded("lyrics")}
              style={{
                flex: 1, height: 48,
                background: "rgba(255,255,255,0.12)", borderRadius: 24, padding: "16px",
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
              <div style={{ flexShrink: 0, pointerEvents: "none" }}><IcMinimize /></div>
            </div>
          ) : (
            /* Default or expanded: fills available height */
            <div
              style={{
                flex: 1, minHeight: 0, position: "relative",
                background: "rgba(255,255,255,0.12)", borderRadius: 24,
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
                  background: "none", border: "none", outline: "none", resize: "none",
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

      {/* ── Generate + footer ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, flexShrink: 0 }}>
        <button
          disabled={selectedMotifs.length < 2}
          onClick={() => selectedMotifs.length >= 2 && onGenerate?.(selectedMotifs)}
          style={{
            width: "100%", height: 54,
            background: selectedMotifs.length >= 2
              ? "linear-gradient(287.49deg, #64E06E 10.24%, #1BD8C5 79.72%)"
              : "rgba(255,255,255,0.08)",
            borderRadius: 12, border: "none",
            cursor: selectedMotifs.length >= 2 ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            ...MiSans, fontWeight: 380, fontSize: 20,
            color: selectedMotifs.length >= 2 ? "#000000" : "rgba(255,255,255,0.3)",
            letterSpacing: "0.08em",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          <IcSparkle />
          生成
        </button>
        <span style={{ ...MiSans, fontWeight: 330, fontSize: 14, color: "rgba(255,255,255,0.64)", lineHeight: "120%", textAlign: "center" }}>
          融合结果会成为新的节点，自动回连动机源
        </span>
      </div>
    </div>
  );
}
