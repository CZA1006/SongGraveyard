"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import MotifGraph, { type CanvasMode, PLACEHOLDER_MOTIFS, SECOND_IMAGE_URLS, PLACEHOLDER_GENERATED, PLACEHOLDER_RELATIONSHIPS } from "@/components/MotifGraph";
import MotifPanel from "@/components/MotifPanel";
import RemixPanel from "@/components/RemixPanel";
import CaptureTab from "@/components/CaptureTab";
import type { MotifSummary, Relationship } from "@/lib/types";
import { useIsMobile } from "@/lib/hooks";

/* ══════════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════════ */

const IcSearch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 14L11.1 11.1M7.33333 4C9.17428 4 10.6667 5.49238 10.6667 7.33333M12.6667 7.33333C12.6667 10.2789 10.2789 12.6667 7.33333 12.6667C4.38781 12.6667 2 10.2789 2 7.33333C2 4.38781 4.38781 2 7.33333 2C10.2789 2 12.6667 4.38781 12.6667 7.33333Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IcMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.333 7.99992C13.333 10.9454 10.9452 13.3333 7.99967 13.3333M13.333 7.99992C13.333 5.0544 10.9452 2.66659 7.99967 2.66659M13.333 7.99992H14.6663M7.99967 13.3333C5.05416 13.3333 2.66634 10.9454 2.66634 7.99992M7.99967 13.3333V14.6666M2.66634 7.99992C2.66634 5.0544 5.05416 2.66659 7.99967 2.66659M2.66634 7.99992H1.33301M7.99967 2.66659V1.33325M9.99967 7.99992C9.99967 9.10449 9.10424 9.99992 7.99967 9.99992C6.8951 9.99992 5.99967 9.10449 5.99967 7.99992C5.99967 6.89535 6.8951 5.99992 7.99967 5.99992C9.10424 5.99992 9.99967 6.89535 9.99967 7.99992Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IcDotsGrid = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    {[3.33, 8.0, 12.67].flatMap((cx) =>
      [3.33, 8.0, 12.67].map((cy) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="0.667" stroke="currentColor" strokeWidth="1.5" />
      ))
    )}
  </svg>
);

const IcGitBranch = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 2V8.8C2 9.92011 2 10.4802 2.21799 10.908C2.40973 11.2843 2.71569 11.5903 3.09202 11.782C3.51984 12 4.0799 12 5.2 12H10M10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12ZM2 5.33333L10 5.33333M10 5.33333C10 6.4379 10.8954 7.33333 12 7.33333C13.1046 7.33333 14 6.4379 14 5.33333C14 4.22876 13.1046 3.33333 12 3.33333C10.8954 3.33333 10 4.22876 10 5.33333Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IcMarkerPin = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10.6663 8.91629C13.0209 9.37923 14.6663 10.4365 14.6663 11.6667C14.6663 13.3235 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 13.3235 1.33301 11.6667C1.33301 10.4365 2.97847 9.37923 5.33301 8.91629M7.99967 11.3333V6M7.99967 6C9.10424 6 9.99967 5.10457 9.99967 4C9.99967 2.89543 9.10424 2 7.99967 2C6.8951 2 5.99967 2.89543 5.99967 4C5.99967 5.10457 6.8951 6 7.99967 6Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IcMusic = () => (
  <svg width="17" height="17" viewBox="0 0 17 16.8373" fill="none">
    <path d="M13.5 14.1706C14.8807 14.1706 16 13.0513 16 11.6706C16 10.2899 14.8807 9.1706 13.5 9.1706C12.1193 9.1706 11 10.2899 11 11.6706C11 13.0513 12.1193 14.1706 13.5 14.1706Z" fill="currentColor"/>
    <path d="M3.5 15.8373C4.88071 15.8373 6 14.718 6 13.3373C6 11.9566 4.88071 10.8373 3.5 10.8373C2.11929 10.8373 1 11.9566 1 13.3373C1 14.718 2.11929 15.8373 3.5 15.8373Z" fill="currentColor"/>
    <path d="M6 13.3373V3.63344C6 3.23216 6 3.03152 6.073 2.86878C6.13735 2.72534 6.24097 2.60302 6.37189 2.51596C6.5204 2.4172 6.71831 2.38421 7.11413 2.31824L14.4475 1.09602C14.9816 1.007 15.2487 0.962487 15.4568 1.0398C15.6395 1.10764 15.7926 1.23734 15.8895 1.40635C16 1.59895 16 1.8697 16 2.41121V11.6706M6 13.3373C6 14.718 4.88071 15.8373 3.5 15.8373C2.11929 15.8373 1 14.718 1 13.3373C1 11.9566 2.11929 10.8373 3.5 10.8373C4.88071 10.8373 6 11.9566 6 13.3373ZM16 11.6706C16 13.0513 14.8807 14.1706 13.5 14.1706C12.1193 14.1706 11 13.0513 11 11.6706C11 10.2899 12.1193 9.1706 13.5 9.1706C14.8807 9.1706 16 10.2899 16 11.6706Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IcRecording = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2.25 6.75V11.25"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M6.75 7.875V10.125" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M11.25 3.375V14.625" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M15.75 6.75V11.25"  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const IcSparkle = () => (
  <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
    <path d="M8.59781 0.925663C8.7346 0.378475 8.803 0.104881 8.91173 0.0411276C9.00543 -0.0138157 9.12152 -0.0138157 9.21522 0.0411276C9.32395 0.104881 9.39235 0.378475 9.52914 0.925662L10.365 4.26898C10.6189 5.28484 10.7459 5.79277 11.0104 6.20608C11.2443 6.57166 11.5548 6.88214 11.9204 7.11607C12.3337 7.38054 12.8416 7.50753 13.8575 7.76149L17.2008 8.59732C17.748 8.73412 18.0216 8.80252 18.0853 8.91124C18.1403 9.00495 18.1403 9.12103 18.0853 9.21473C18.0216 9.32346 17.748 9.39186 17.2008 9.52866L13.8575 10.3645C12.8416 10.6185 12.3337 10.7454 11.9204 11.0099C11.5548 11.2438 11.2443 11.5543 11.0104 11.9199C10.7459 12.3332 10.6189 12.8411 10.365 13.857L9.52915 17.2003C9.39235 17.7475 9.32395 18.0211 9.21522 18.0848C9.12152 18.1398 9.00544 18.1398 8.91173 18.0848C8.80301 18.0211 8.73461 17.7475 8.59781 17.2003L7.76198 13.857C7.50801 12.8411 7.38103 12.3332 7.11656 11.9199C6.88263 11.5543 6.57215 11.2438 6.20657 11.0099C5.79325 10.7454 5.28532 10.6185 4.26947 10.3645L0.926151 9.52866C0.378963 9.39186 0.10537 9.32346 0.0416159 9.21473C-0.0133274 9.12103 -0.0133274 9.00495 0.0416159 8.91124C0.10537 8.80252 0.378963 8.73412 0.926151 8.59732L4.26947 7.76149C5.28533 7.50753 5.79325 7.38054 6.20656 7.11607C6.57215 6.88214 6.88263 6.57166 7.11656 6.20608C7.38103 5.79277 7.50801 5.28484 7.76198 4.26898L8.59781 0.925663Z"
      fill="currentColor" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════════════════════════ */

const MiSans: React.CSSProperties = {
  fontFamily: "'MiSans', 'PingFang SC', 'Noto Sans SC', ui-sans-serif, sans-serif",
};

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════ */

function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function filterMotifs(query: string, motifs: MotifSummary[]): MotifSummary[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return motifs.filter(m => {
    const text = [m.title, m.epitaph, ...m.moodTags, m.location ?? "", m.createdAt].join(" ").toLowerCase();
    return text.includes(q);
  }).slice(0, 6);
}

function selectMotifsByPrompt(prompt: string, motifs: MotifSummary[]): MotifSummary[] {
  const keywords = prompt.toLowerCase().split(/[\s，,。、！？!?]+/).filter(w => w.length >= 1);
  const scored = motifs.map(m => {
    const text = [m.title, m.epitaph, ...m.moodTags, m.location ?? ""].join(" ").toLowerCase();
    let score = Math.random() * 0.35;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 0.55;
    }
    return { motif: m, score };
  });
  const count = 2 + Math.floor(Math.random() * 2);
  return scored.sort((a, b) => b.score - a.score).slice(0, count).map(s => s.motif);
}

/* ══════════════════════════════════════════════════════════════════════
   LOGO
═══════════════════════════════════════════════════════════════════════ */

function Logo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{
        ...MiSans,
        fontSize: 8,
        fontWeight: 600,
        letterSpacing: "0.55em",
        color: "#6BE696",
        textTransform: "uppercase",
        lineHeight: 1,
      }}>
        Song
      </span>
      <span style={{
        ...MiSans,
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: "0.22em",
        color: "rgba(255,255,255,0.88)",
        textTransform: "uppercase",
        lineHeight: 1,
      }}>
        Graveyard
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SEARCH PANEL
═══════════════════════════════════════════════════════════════════════ */

function SearchPanel({
  query,
  onQueryChange,
  results,
  onSelect,
  onClose,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  results: MotifSummary[];
  onSelect: (m: MotifSummary) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      background: "rgba(8,8,8,0.92)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.16)",
      padding: "10px",
      width: 280,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 8px 36px rgba(0,0,0,0.6)",
    }}>
      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 12, padding: "8px 12px",
      }}>
        <span style={{ color: "rgba(255,255,255,0.4)", display: "flex", flexShrink: 0 }}>
          <IcSearch />
        </span>
        <input
          autoFocus
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Escape") onClose(); }}
          placeholder="名称 / 标签 / 日期…"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            ...MiSans, fontSize: 14, color: "#fff",
          }}
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.4)", fontSize: 18, padding: 0,
              lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 300, overflowY: "auto" }}>
          {results.map(m => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                padding: "8px 10px", borderRadius: 12, textAlign: "left",
                background: "rgba(255,255,255,0.05)",
                border: "none", cursor: "pointer", width: "100%",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <span style={{ ...MiSans, fontSize: 14, fontWeight: 450, color: "#fff" }}>
                {m.title}
              </span>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                {m.moodTags.slice(0, 2).map(t => (
                  <span key={t} style={{
                    ...MiSans, fontSize: 11, color: "#6BE696",
                    background: "rgba(107,230,150,0.12)",
                    padding: "1px 7px", borderRadius: 20,
                  }}>
                    {t}
                  </span>
                ))}
                {m.location && (
                  <span style={{ ...MiSans, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    {m.location}
                  </span>
                )}
                <span style={{ ...MiSans, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                  {fmtDateShort(m.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.trim() && results.length === 0 && (
        <span style={{ ...MiSans, fontSize: 13, color: "rgba(255,255,255,0.32)", padding: "4px 10px" }}>
          无结果
        </span>
      )}

      {!query.trim() && (
        <span style={{ ...MiSans, fontSize: 12, color: "rgba(255,255,255,0.22)", padding: "2px 10px" }}>
          支持名称、标签、日期搜索
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   AWAKEN POPOVER
═══════════════════════════════════════════════════════════════════════ */

function AwakenPopover({
  prompt,
  onPromptChange,
  onGenerate,
}: {
  prompt: string;
  onPromptChange: (p: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div style={{
      background: "rgba(8,8,8,0.92)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.16)",
      padding: "14px",
      width: 264,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      boxShadow: "0 8px 36px rgba(0,0,0,0.6)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#6BE696", display: "flex", flexShrink: 0 }}>
          <IcMark />
        </span>
        <span style={{ ...MiSans, fontSize: 13, fontWeight: 450, color: "rgba(255,255,255,0.85)" }}>
          唤醒
        </span>
      </div>
      <span style={{ ...MiSans, fontSize: 12, fontWeight: 330, color: "rgba(255,255,255,0.45)", lineHeight: "1.55" }}>
        描述你想要的感觉或风格，系统会自动抽取相关节点进行融合
      </span>
      <textarea
        autoFocus
        value={prompt}
        onChange={e => onPromptChange(e.target.value)}
        onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && prompt.trim()) onGenerate(); }}
        placeholder="e.g. 雨天的爵士，带一点电子感…"
        rows={3}
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "10px 12px",
          resize: "none", outline: "none",
          ...MiSans, fontSize: 13, color: "#fff", lineHeight: "1.55",
          width: "100%", boxSizing: "border-box",
        }}
      />
      <button
        onClick={onGenerate}
        disabled={!prompt.trim()}
        style={{
          height: 38, borderRadius: 10, border: "none",
          background: prompt.trim()
            ? "linear-gradient(287.49deg, #64E06E 10.24%, #1BD8C5 79.72%)"
            : "rgba(255,255,255,0.07)",
          color: prompt.trim() ? "#000" : "rgba(255,255,255,0.25)",
          cursor: prompt.trim() ? "pointer" : "default",
          ...MiSans, fontSize: 14, fontWeight: 500,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        唤醒
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TOP NAV
═══════════════════════════════════════════════════════════════════════ */

type Tab = "墓地" | "捕捉";

function TopNav({
  activeTab,
  onTabChange,
  remixMode,
  onRemixClick,
  isMobile,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  remixMode?: boolean;
  onRemixClick?: () => void;
  isMobile?: boolean;
}) {
  const btnPad = isMobile ? "9px 14px" : "12px 20px";
  const btnFs = isMobile ? "14px" : "16px";
  const gap = isMobile ? "8px" : "16px";

  return (
    <div style={{
      display: "flex", flexDirection: "row", alignItems: "center",
      padding: isMobile ? "8px" : "12px", gap,
      background: "rgba(0,0,0,0.36)",
      boxShadow: "0px 4px 28px rgba(255,255,255,0.12)",
      borderRadius: "24px",
      border: "1px solid rgba(255,255,255,0.32)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
        {(["墓地", "捕捉"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              ...MiSans,
              display: "flex", flexDirection: "row", alignItems: "center",
              justifyContent: "center",
              padding: btnPad, gap: "8px",
              background: activeTab === tab ? "#FFFFFF" : "transparent",
              borderRadius: "12px",
              color: activeTab === tab ? "#000000" : "#FFFFFF",
              fontWeight: activeTab === tab ? 630 : 330,
              fontSize: btnFs, lineHeight: "20px",
              letterSpacing: "0.12em", whiteSpace: "nowrap",
              border: "none", cursor: "pointer",
              transition: "background 0.18s, color 0.18s",
            }}
          >
            {tab === "墓地" ? <IcMusic /> : <IcRecording />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "墓地" && (
        <>
          <div style={{ width: "1.5px", height: "12px", background: "rgba(255,255,255,0.72)", borderRadius: "1px", flexShrink: 0 }} />

          <button
            onClick={onRemixClick}
            style={{
              ...MiSans,
              display: "flex", flexDirection: "row", alignItems: "center",
              justifyContent: "center",
              padding: btnPad, gap: "8px",
              background: "linear-gradient(287.49deg, #64E06E 10.24%, #1BD8C5 79.72%)",
              borderRadius: "12px",
              color: "#000000", fontWeight: 400, fontSize: btnFs, lineHeight: "20px",
              whiteSpace: "nowrap", border: "none", cursor: "pointer",
              outline: remixMode ? "2px solid rgba(255,255,255,0.7)" : "none",
              outlineOffset: "2px",
              transition: "outline 0.15s",
            }}
          >
            <IcSparkle />
            {!isMobile && "Remix"}
          </button>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LEFT TOOLBAR
═══════════════════════════════════════════════════════════════════════ */

type ToolItem = {
  icon: React.ReactNode;
  label: string;
  modeKey?: CanvasMode;
  actionKey?: "search" | "awaken";
} | null;

const TOOLBAR_ITEMS: ToolItem[] = [
  { icon: <IcSearch />,    label: "搜索", actionKey: "search" },
  { icon: <IcMark />,      label: "唤醒", actionKey: "awaken" },
  null,
  { icon: <IcDotsGrid />,  label: "归类", modeKey: "归类" },
  { icon: <IcGitBranch />, label: "分支", modeKey: "分支" },
  { icon: <IcMarkerPin />, label: "沉浸", modeKey: "沉浸" },
];

function LeftToolbar({
  canvasMode,
  onModeChange,
  searchActive,
  onSearchToggle,
  awakenActive,
  onAwakenToggle,
  isMobile,
}: {
  canvasMode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  searchActive: boolean;
  onSearchToggle: () => void;
  awakenActive: boolean;
  onAwakenToggle: () => void;
  isMobile?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Mobile: flat horizontal row, no expand animation
  if (isMobile) {
    return (
      <div style={{
        display: "flex", flexDirection: "row", alignItems: "center",
        padding: "8px 12px", gap: "4px",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.22)",
        boxSizing: "border-box",
      }}>
        {TOOLBAR_ITEMS.map((item, idx) => {
          if (item === null) {
            return (
              <div key={`sep-${idx}`} style={{
                width: "1px", height: "20px", margin: "0 4px",
                background: "rgba(255,255,255,0.32)", flexShrink: 0,
              }} />
            );
          }
          const { icon, label, modeKey, actionKey } = item;
          const active = modeKey
            ? canvasMode === modeKey
            : actionKey === "search" ? searchActive
            : actionKey === "awaken" ? awakenActive : false;

          return (
            <button
              key={label}
              onClick={() => {
                if (modeKey) onModeChange(modeKey);
                else if (actionKey === "search") onSearchToggle();
                else if (actionKey === "awaken") onAwakenToggle();
              }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 40, height: 40,
                background: active ? "#FFFFFF" : "transparent",
                borderRadius: "10px", border: "none", cursor: "pointer",
                color: active ? "#000000" : "#FFFFFF", flexShrink: 0,
              }}
            >
              {icon}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => { setExpanded(false); setHoveredLabel(null); }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "12px", gap: "16px",
        width: expanded ? "98px" : "64px",
        background: "rgba(0,0,0,0.36)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.32)",
        boxSizing: "border-box", overflow: "hidden",
        transition: "width 0.22s ease",
        flexShrink: 0,
      }}
    >
      {TOOLBAR_ITEMS.map((item, idx) => {
        if (item === null) {
          return (
            <div
              key={`sep-${idx}`}
              style={{
                padding: "16px 0",
                width: expanded ? "50px" : "14px",
                transition: "width 0.22s ease",
                flexShrink: 0,
              }}
            >
              <div style={{ height: "1px", background: "rgba(255,255,255,0.72)" }} />
            </div>
          );
        }

        const { icon, label, modeKey, actionKey } = item;
        const active = modeKey
          ? canvasMode === modeKey
          : actionKey === "search"
          ? searchActive
          : actionKey === "awaken"
          ? awakenActive
          : false;

        const itemHovered = hoveredLabel === label;
        const bg = active ? "#FFFFFF" : itemHovered ? "rgba(255,255,255,0.08)" : "transparent";

        return (
          <button
            key={label}
            onMouseEnter={() => setHoveredLabel(label)}
            onMouseLeave={() => setHoveredLabel(null)}
            onClick={() => {
              if (modeKey) onModeChange(modeKey);
              else if (actionKey === "search") onSearchToggle();
              else if (actionKey === "awaken") onAwakenToggle();
            }}
            style={{
              display: "flex", flexDirection: "row", alignItems: "center",
              justifyContent: "center",
              padding: "12px", gap: "0px",
              width: expanded ? "74px" : "40px",
              height: "40px",
              background: bg,
              borderRadius: "12px", border: "none",
              cursor: "pointer",
              color: active ? "#000000" : "#FFFFFF",
              flexShrink: 0,
              transition: "width 0.22s ease, background 0.15s ease",
              boxSizing: "border-box", overflow: "hidden",
            }}
          >
            <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              {icon}
            </span>
            <span style={{
              ...MiSans, fontSize: "13px", fontWeight: 300, lineHeight: "20px",
              color: active ? "#000000" : "#FFFFFF",
              whiteSpace: "nowrap", overflow: "hidden",
              maxWidth: expanded ? "26px" : "0px",
              marginLeft: expanded ? "8px" : "0px",
              opacity: expanded ? 1 : 0,
              transition: "max-width 0.22s ease, margin-left 0.22s ease, opacity 0.18s ease",
              flexShrink: 0,
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   TIMELINE
═══════════════════════════════════════════════════════════════════════ */

const TIMELINE_DAYS: Array<{ captured: boolean; isWeek: boolean }> = [
  { captured: false, isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: false, isWeek: false },
  { captured: false, isWeek: true  },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: true  },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: false },
  { captured: true,  isWeek: true  },
  { captured: false, isWeek: false },
  { captured: false, isWeek: false },
  { captured: false, isWeek: false },
  { captured: false, isWeek: false },
  { captured: true,  isWeek: false },
  { captured: false, isWeek: false },
];

const TICK_WIDTH = 2;
const TICK_STEP = 25 + TICK_WIDTH;
const HIT_HALF = 13;

function timelineDate(idx: number): string {
  const d = new Date("2026-06-01");
  d.setDate(d.getDate() + idx);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function Timeline({ todayIndex, onTodayChange, onTodayFloat }: {
  todayIndex: number;
  onTodayChange: (d: number) => void;
  onTodayFloat?: (f: number) => void;
}) {
  const markerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const markerPixel = useRef(todayIndex * TICK_STEP);
  const todayIdxRef = useRef(todayIndex);
  todayIdxRef.current = todayIndex;

  useLayoutEffect(() => {
    if (!isDragging.current && markerRef.current) {
      markerRef.current.style.left = `${todayIndex * TICK_STEP - HIT_HALF}px`;
      markerPixel.current = todayIndex * TICK_STEP;
    }
  }, [todayIndex]);

  function startDrag(e: React.MouseEvent) {
    isDragging.current = true;
    document.body.style.cursor = "grabbing";
    if (markerRef.current) markerRef.current.style.cursor = "grabbing";
    const dragStartX = e.clientX;
    const startPixel = markerPixel.current;
    const maxPixel = (TIMELINE_DAYS.length - 1) * TICK_STEP;
    e.preventDefault();

    function onMove(ev: MouseEvent) {
      const newPixel = Math.max(0, Math.min(maxPixel, startPixel + (ev.clientX - dragStartX)));
      markerPixel.current = newPixel;
      if (markerRef.current) markerRef.current.style.left = `${newPixel - HIT_HALF}px`;
      // Fire continuous float on every frame (for gallery slide)
      onTodayFloat?.(newPixel / TICK_STEP);
      const newDay = Math.max(0, Math.min(TIMELINE_DAYS.length - 1, Math.round(newPixel / TICK_STEP)));
      if (newDay !== todayIdxRef.current) {
        todayIdxRef.current = newDay;
        onTodayChange(newDay);
      }
    }

    function onUp() {
      isDragging.current = false;
      document.body.style.cursor = "";
      if (markerRef.current) markerRef.current.style.cursor = "grab";
      const finalDay = Math.max(0, Math.min(TIMELINE_DAYS.length - 1, Math.round(markerPixel.current / TICK_STEP)));
      markerPixel.current = finalDay * TICK_STEP;
      if (markerRef.current) markerRef.current.style.left = `${finalDay * TICK_STEP - HIT_HALF}px`;
      onTodayFloat?.(finalDay); // snap float to exact integer on release
      onTodayChange(finalDay);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startDragTouch(e: React.TouchEvent) {
    if (e.touches.length === 0) return;
    isDragging.current = true;
    const dragStartX = e.touches[0].clientX;
    const startPixel = markerPixel.current;
    const maxPixel = (TIMELINE_DAYS.length - 1) * TICK_STEP;

    function onMove(ev: TouchEvent) {
      if (ev.touches.length === 0) return;
      const newPixel = Math.max(0, Math.min(maxPixel, startPixel + (ev.touches[0].clientX - dragStartX)));
      markerPixel.current = newPixel;
      if (markerRef.current) markerRef.current.style.left = `${newPixel - HIT_HALF}px`;
      onTodayFloat?.(newPixel / TICK_STEP);
      const newDay = Math.max(0, Math.min(TIMELINE_DAYS.length - 1, Math.round(newPixel / TICK_STEP)));
      if (newDay !== todayIdxRef.current) {
        todayIdxRef.current = newDay;
        onTodayChange(newDay);
      }
    }

    function onUp() {
      isDragging.current = false;
      const finalDay = Math.max(0, Math.min(TIMELINE_DAYS.length - 1, Math.round(markerPixel.current / TICK_STEP)));
      markerPixel.current = finalDay * TICK_STEP;
      if (markerRef.current) markerRef.current.style.left = `${finalDay * TICK_STEP - HIT_HALF}px`;
      onTodayFloat?.(finalDay);
      onTodayChange(finalDay);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    }

    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onUp);
  }

  const trackW = (TIMELINE_DAYS.length - 1) * TICK_STEP + TICK_WIDTH;

  return (
    <div className="timeline-scroll" style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: "calc(100vw - 32px)", overflowX: "auto", overflowY: "visible" }}>
      <div style={{ position: "relative", width: trackW, height: 50, userSelect: "none", flexShrink: 0 }}>
        {TIMELINE_DAYS.map((day, i) => (
          <div key={i} style={{
            position: "absolute", left: i * TICK_STEP,
            top: "50%", transform: "translateY(-50%)",
            width: TICK_WIDTH, height: day.isWeek ? 24 : 12,
            background: day.captured ? "#FFFFFF" : "rgba(255,255,255,0.3)",
            borderRadius: 1,
          }} />
        ))}
        <div
          ref={markerRef}
          onMouseDown={startDrag}
          onTouchStart={startDragTouch}
          style={{
            position: "absolute", top: 0, bottom: 0,
            width: HIT_HALF * 2 + TICK_WIDTH,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "grab", zIndex: 10, touchAction: "none",
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#6BE696", flexShrink: 0 }} />
          <div style={{ width: 2, height: 40, background: "#6BE696", borderRadius: 1, flexShrink: 0 }} />
        </div>
      </div>
      {/* Date label — inline after track when scrollable */}
      <div style={{
        whiteSpace: "nowrap", flexShrink: 0,
        fontFamily: "'MiSans', 'PingFang SC', ui-sans-serif, sans-serif",
        fontSize: 12, fontWeight: 450,
        color: "#6BE696",
        pointerEvents: "none",
        letterSpacing: "0.04em",
      }}>
        {timelineDate(todayIndex)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════ */

export default function GraveyardPage() {
  const isMobile = useIsMobile();
  const glowRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("墓地");
  const [todayIndex, setTodayIndex] = useState(11);
  const [todayFloat, setTodayFloat] = useState(11);
  const [selectedMotif, setSelectedMotif] = useState<MotifSummary | null>(null);
  const [nodeImageIndex, setNodeImageIndex] = useState<Record<string, number>>({});
  const handleNodeImageSwap = useCallback((id: string, swapped: boolean) => {
    setNodeImageIndex(prev => ({ ...prev, [id]: swapped ? 1 : 0 }));
  }, []);
  const [remixMode, setRemixMode] = useState(false);
  const [remixSelectedMotifs, setRemixSelectedMotifs] = useState<MotifSummary[]>([]);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("归类");

  // Search
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusMotifId, setFocusMotifId] = useState<string | null>(null);

  // Awaken
  const [awakenActive, setAwakenActive] = useState(false);
  const [awakenPrompt, setAwakenPrompt] = useState("");

  // Extra motifs (user-created or AI-generated)
  const [extraMotifs, setExtraMotifs] = useState<MotifSummary[]>([]);
  const [extraRelationships, setExtraRelationships] = useState<Relationship[]>([]);
  const [loadingMotifIds, setLoadingMotifIds] = useState<Set<string>>(new Set());
  const [deletedMotifIds, setDeletedMotifIds] = useState<Set<string>>(new Set());

  const remixSelectedIds = useMemo(
    () => new Set(remixSelectedMotifs.map(m => m.id)),
    [remixSelectedMotifs],
  );

  // All motifs available in the graph (mirrors displayMotifs in MotifGraph)
  const allGraphMotifs = useMemo(() => {
    const base = PLACEHOLDER_MOTIFS;
    const filtered = deletedMotifIds.size ? base.filter(m => !deletedMotifIds.has(m.id)) : base;
    const extras = extraMotifs.filter(m => !deletedMotifIds.has(m.id));
    return [...filtered, ...extras, ...PLACEHOLDER_GENERATED];
  }, [extraMotifs, deletedMotifIds]);

  const allRelationships = useMemo(
    () => [...PLACEHOLDER_RELATIONSHIPS, ...extraRelationships],
    [extraRelationships],
  );

  // Source nodes and downstream children for the selected generated node
  const sourceMotifs = useMemo(() => {
    if (!selectedMotif) return [];
    const srcIds = allRelationships.filter(r => r.target === selectedMotif.id).map(r => r.source);
    return srcIds.map(id => allGraphMotifs.find(m => m.id === id)).filter(Boolean) as MotifSummary[];
  }, [selectedMotif, allGraphMotifs, allRelationships]);

  const childMotifs = useMemo(() => {
    if (!selectedMotif) return [];
    const childIds = allRelationships.filter(r => r.source === selectedMotif.id).map(r => r.target);
    return childIds.map(id => allGraphMotifs.find(m => m.id === id)).filter(Boolean) as MotifSummary[];
  }, [selectedMotif, allGraphMotifs, allRelationships]);

  function handleRemixClick() {
    setRemixMode(true);
    setSelectedMotif(null);
    setSearchActive(false);
    setAwakenActive(false);
  }

  function handleCloseRemix() {
    setRemixMode(false);
    setRemixSelectedMotifs([]);
  }

  function handleRemixNodeSelect(motif: MotifSummary) {
    setRemixSelectedMotifs(prev =>
      prev.find(m => m.id === motif.id)
        ? prev.filter(m => m.id !== motif.id)
        : [...prev, motif],
    );
  }

  function handleSearchSelect(motif: MotifSummary) {
    setSelectedMotif(motif);
    setFocusMotifId(motif.id);
    setSearchActive(false);
    setSearchQuery("");
    // Reset focusMotifId after animation so the same motif can be re-focused
    setTimeout(() => setFocusMotifId(null), 900);
  }

  function handleAwakenGenerate() {
    const picked = selectMotifsByPrompt(awakenPrompt, PLACEHOLDER_MOTIFS);
    setRemixSelectedMotifs(picked);
    setRemixMode(true);
    setSelectedMotif(null);
    setAwakenActive(false);
    setAwakenPrompt("");
  }

  function handleAddMotif(motif: MotifSummary) {
    setExtraMotifs(prev => [...prev, motif]);
  }

  function handleGenerateFromMotif(sourceMotif: MotifSummary) {
    const newId = `gen-${Date.now()}`;
    const newMotif: MotifSummary = {
      id: newId,
      title: `${sourceMotif.title} 续写`,
      epitaph: "AI 正在生成…",
      status: "buried",
      weight: 2,
      moodTags: sourceMotif.moodTags,
      projectTags: [],
      location: null,
      createdAt: new Date().toISOString(),
      imageUrl: null,
    };
    setExtraMotifs(prev => [...prev, newMotif]);
    setExtraRelationships(prev => [
      ...prev,
      { source: sourceMotif.id, target: newId, relationType: "remix", strength: 1 },
    ]);
    setLoadingMotifIds(prev => new Set([...prev, newId]));
    setSelectedMotif(null);
    setTimeout(() => {
      setLoadingMotifIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
    }, 2500);
  }

  function handleGenerateFromRemix(sourceMotifs: MotifSummary[]) {
    const newId = `remix-${Date.now()}`;
    const newMotif: MotifSummary = {
      id: newId,
      title: sourceMotifs.length > 0
        ? `融合：${sourceMotifs.map(m => m.title).join(" × ")}`
        : "融合动机",
      epitaph: "AI 正在生成…",
      status: "buried",
      weight: 3,
      moodTags: [...new Set(sourceMotifs.flatMap(m => m.moodTags))],
      projectTags: [],
      location: null,
      createdAt: new Date().toISOString(),
      imageUrl: null,
    };
    setExtraMotifs(prev => [...prev, newMotif]);
    setExtraRelationships(prev => [
      ...prev,
      ...sourceMotifs.map(m => ({ source: m.id, target: newId, relationType: "remix" as const, strength: 1 })),
    ]);
    setLoadingMotifIds(prev => new Set([...prev, newId]));
    setRemixMode(false);
    setRemixSelectedMotifs([]);
    setTimeout(() => {
      setLoadingMotifIds(prev => { const n = new Set(prev); n.delete(newId); return n; });
    }, 2500);
  }

  function handleDeleteMotif(id: string) {
    setExtraMotifs(prev => prev.filter(m => m.id !== id));
    setDeletedMotifIds(prev => new Set([...prev, id]));
    setSelectedMotif(null);
  }

  function toggleSearch() {
    setSearchActive(s => {
      if (!s) setAwakenActive(false);
      return !s;
    });
    setSearchQuery("");
  }

  function toggleAwaken() {
    setAwakenActive(a => {
      if (!a) setSearchActive(false);
      return !a;
    });
    setAwakenPrompt("");
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!glowRef.current) return;
    const { clientX: x, clientY: y } = e;
    glowRef.current.style.background = [
      `radial-gradient(circle 520px at ${x}px ${y}px,`,
      ` rgba(255,255,255,0.07) 0%,`,
      ` rgba(255,255,255,0.05) 22%,`,
      ` rgba(255,255,255,0.028) 44%,`,
      ` rgba(255,255,255,0.01) 66%,`,
      ` rgba(255,255,255,0.003) 82%,`,
      ` transparent 100%)`,
    ].join("");
  }

  const searchResults = useMemo(
    () => filterMotifs(searchQuery, PLACEHOLDER_MOTIFS),
    [searchQuery],
  );

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: "radial-gradient(76.32% 76.32% at 50% 50%, #111111 0%, #111111 100%)" }}
      onMouseMove={handleMouseMove}
    >
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "14px 14px",
        }}
      />

      {/* Mouse glow */}
      <div ref={glowRef} className="absolute inset-0 pointer-events-none" />

      {/* Canvas — zIndex:0 creates a stacking context so ReactFlow node z-indices (up to 200) stay contained */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <MotifGraph
          onNodeSelect={remixMode ? undefined : setSelectedMotif}
          selectedMotifId={remixMode ? null : selectedMotif?.id}
          focusMotifId={focusMotifId}
          todayIndex={todayIndex}
          todayFloat={todayFloat}
          remixMode={remixMode}
          remixSelectedIds={remixSelectedIds}
          onRemixNodeSelect={handleRemixNodeSelect}
          canvasMode={canvasMode}
          extraMotifs={extraMotifs}
          extraRelationships={extraRelationships}
          loadingMotifIds={loadingMotifIds}
          deletedMotifIds={deletedMotifIds}
          onPaneClick={() => {
            setSelectedMotif(null);
            setRemixMode(false);
            setRemixSelectedMotifs([]);
          }}
          onNodeImageSwap={handleNodeImageSwap}
          onImmersiveCenter={day => { setTodayIndex(day); setTodayFloat(day); }}
        />
      </div>

      {/* Single-motif panel */}
      <MotifPanel
        motif={remixMode ? null : selectedMotif}
        onClose={() => setSelectedMotif(null)}
        onGenerate={handleGenerateFromMotif}
        onDelete={handleDeleteMotif}
        extraImageUrls={selectedMotif?.extraImageUrls ?? (selectedMotif?.id && SECOND_IMAGE_URLS[selectedMotif.id] ? [SECOND_IMAGE_URLS[selectedMotif.id]!] : [])}
        initialActiveImg={nodeImageIndex[selectedMotif?.id ?? ""] ?? 0}
        sourceMotifs={sourceMotifs}
        childMotifs={childMotifs}
        isMobile={isMobile}
      />

      {/* Remix panel */}
      <RemixPanel
        open={remixMode}
        selectedMotifs={remixSelectedMotifs}
        onClose={handleCloseRemix}
        onRemoveMotif={id => setRemixSelectedMotifs(prev => prev.filter(m => m.id !== id))}
        onGenerate={handleGenerateFromRemix}
        isMobile={isMobile}
      />

      {/* Capture tab overlay */}
      {activeTab === "捕捉" && (
        <CaptureTab onGenerate={motif => { handleAddMotif(motif); setActiveTab("墓地"); }} />
      )}

      {/* Logo — top-left (hidden on mobile) */}
      {!isMobile && (
        <div className="absolute left-8 top-6 z-20" style={{ display: "flex", alignItems: "center", height: 68 }}>
          <Logo />
        </div>
      )}

      {/* Top nav — centered */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <TopNav
          activeTab={activeTab}
          onTabChange={tab => {
            setActiveTab(tab);
            if (tab === "墓地") { setRemixMode(false); setRemixSelectedMotifs([]); }
            if (tab === "捕捉") { setSelectedMotif(null); setRemixMode(false); setRemixSelectedMotifs([]); }
          }}
          remixMode={remixMode}
          onRemixClick={handleRemixClick}
          isMobile={isMobile}
        />
      </div>

      {/* Desktop: Left toolbar + search/awaken panels */}
      {!isMobile && activeTab === "墓地" && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <LeftToolbar
            canvasMode={canvasMode}
            onModeChange={setCanvasMode}
            searchActive={searchActive}
            onSearchToggle={toggleSearch}
            awakenActive={awakenActive}
            onAwakenToggle={toggleAwaken}
          />

          {searchActive && (
            <SearchPanel
              query={searchQuery}
              onQueryChange={setSearchQuery}
              results={searchResults}
              onSelect={handleSearchSelect}
              onClose={() => setSearchActive(false)}
            />
          )}

          {awakenActive && (
            <AwakenPopover
              prompt={awakenPrompt}
              onPromptChange={setAwakenPrompt}
              onGenerate={handleAwakenGenerate}
            />
          )}
        </div>
      )}

      {/* Mobile: bottom toolbar + popovers above it */}
      {isMobile && activeTab === "墓地" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {searchActive && (
            <SearchPanel
              query={searchQuery}
              onQueryChange={setSearchQuery}
              results={searchResults}
              onSelect={handleSearchSelect}
              onClose={() => setSearchActive(false)}
            />
          )}
          {awakenActive && (
            <AwakenPopover
              prompt={awakenPrompt}
              onPromptChange={setAwakenPrompt}
              onGenerate={handleAwakenGenerate}
            />
          )}
          <LeftToolbar
            canvasMode={canvasMode}
            onModeChange={setCanvasMode}
            searchActive={searchActive}
            onSearchToggle={toggleSearch}
            awakenActive={awakenActive}
            onAwakenToggle={toggleAwaken}
            isMobile
          />
        </div>
      )}

      {/* Timeline — bottom center (above mobile toolbar), hidden on capture tab */}
      {activeTab === "墓地" && (
        <div
          className="absolute z-20"
          style={isMobile
            ? { bottom: 76, left: 16, right: 16 }
            : { bottom: 20, left: "50%", transform: "translateX(-50%)" }
          }
        >
          <Timeline
            todayIndex={todayIndex}
            onTodayChange={d => { setTodayIndex(d); setTodayFloat(d); }}
            onTodayFloat={setTodayFloat}
          />
        </div>
      )}

    </div>
  );
}
