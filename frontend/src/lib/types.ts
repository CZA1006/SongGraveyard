// 与后端 API 契约对齐(docs/DEVELOPMENT.md §4, docs/PRD.md §6)。

export type MotifStatus = "buried" | "ghosted" | "resurrected";
export type VersionType = "ghost" | "resurrect" | "grow" | "remix";
export type VersionStatus = "generating" | "done" | "failed";
export type VersionSource = "live" | "cached";

export interface Version {
  id: string;
  type: VersionType;
  status: VersionStatus;
  audioUrl: string | null;
  source: VersionSource | null;
  params: Record<string, unknown>;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface MotifSummary {
  id: string;
  title: string;
  epitaph: string;
  imageUrl: string | null;
  status: MotifStatus;
  weight: number;
  moodTags: string[];
  projectTags: string[];
  location: string | null;
  createdAt: string;
  // Frontend-only: populated for locally-created motifs, absent for API motifs
  audioUrl?: string | null;
  durationSec?: number;
  extraImageUrls?: string[]; // all captured photos after the first
}

export interface Motif extends MotifSummary {
  audioUrl: string;
  textNote: string | null;
  isRemix: boolean;
  sourceMotifIds: string[];
  relatedMotifIds: string[];
  versions: Version[];
}

export interface UploadResult {
  audioUrl: string;
  imageUrl: string | null;
  durationSec: number;
}

export interface Relationship {
  source: string;
  target: string;
  relationType: "same_mood" | "same_project" | "same_location" | "remix";
  strength: number;
}
