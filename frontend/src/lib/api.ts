// 唯一后端客户端。前端只调后端,绝不直连 AI 引擎。
import type {
  Motif,
  MotifSummary,
  Relationship,
  UploadResult,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// 把后端返回的相对资源路径(/storage/.., /pregenerated/..)补全为绝对 URL
export function resolveAsset(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BASE}${url}`;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = await res.json();
      msg = body?.error?.message || body?.detail || msg;
    } catch {
      /* ignore */
    }
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async upload(audio: File, image?: File | null): Promise<UploadResult> {
    const fd = new FormData();
    fd.append("audio", audio);
    if (image) fd.append("image", image);
    return json(await fetch(`${BASE}/api/upload`, { method: "POST", body: fd }));
  },

  async createMotif(body: {
    audioUrl: string;
    imageUrl?: string | null;
    textNote?: string;
    location?: string;
    moodTags?: string[];
    projectTags?: string[];
    title?: string;
  }): Promise<Motif> {
    return json(
      await fetch(`${BASE}/api/motifs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  },

  async listMotifs(): Promise<MotifSummary[]> {
    const data = await json<{ motifs: MotifSummary[] }>(
      await fetch(`${BASE}/api/motifs`, { cache: "no-store" }),
    );
    return data.motifs;
  },

  async getMotif(id: string): Promise<Motif> {
    return json(await fetch(`${BASE}/api/motifs/${id}`, { cache: "no-store" }));
  },

  async relationships(): Promise<Relationship[]> {
    const data = await json<{ edges: Relationship[] }>(
      await fetch(`${BASE}/api/relationships`, { cache: "no-store" }),
    );
    return data.edges;
  },
};
