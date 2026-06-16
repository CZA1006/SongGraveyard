"use client";

import "reactflow/dist/style.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "reactflow";
import { api } from "@/lib/api";
import type { MotifSummary, Relationship } from "@/lib/types";

const RELATION_COLORS: Record<Relationship["relationType"], string> = {
  same_mood: "#7fb8d6",
  same_project: "#8fcab0",
  same_location: "#e8e4d8",
  remix: "#c9a8ff",
};

function GraveNode({ data }: NodeProps<{ motif: MotifSummary }>) {
  const motif = data.motif;
  return (
    <div className="group relative cursor-pointer rounded-full border border-grave-border/80 bg-grave-panel/95 shadow-[0_0_40px_rgba(10,12,18,0.55)] transition hover:border-grave-ghost/60 hover:shadow-[0_0_30px_rgba(127,184,214,0.2)]">
      <div className="flex h-full w-full items-center justify-center rounded-full px-4 text-center">
        <span className="max-w-[10rem] text-sm font-medium text-grave-warm">{motif.title}</span>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.75rem)] z-20 hidden w-56 -translate-x-1/2 rounded-lg border border-grave-border bg-grave-bg/95 p-3 text-left group-hover:block">
        <p className="text-sm font-medium text-grave-warm">{motif.title}</p>
        <p className="mt-1 text-xs italic text-grave-ghost/80">{motif.epitaph}</p>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { grave: GraveNode };

function buildNodes(motifs: MotifSummary[]): Node[] {
  if (motifs.length === 0) return [];

  const centerX = 340;
  const centerY = 250;
  const radius = Math.max(150, 90 + motifs.length * 18);

  return motifs.map((motif, index) => {
    const angle = (index / motifs.length) * Math.PI * 2;
    const size = Math.max(84, 84 + motif.weight * 6);
    return {
      id: motif.id,
      type: "grave",
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { motif },
      style: { width: size, height: size },
    };
  });
}

function buildEdges(edges: Relationship[]): Edge[] {
  return edges.map((edge) => ({
    id: `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    animated: edge.relationType === "remix",
    markerEnd: { type: MarkerType.ArrowClosed, color: RELATION_COLORS[edge.relationType] },
    style: {
      stroke: RELATION_COLORS[edge.relationType],
      strokeWidth: 1.5 + edge.strength * 4,
      opacity: 0.85,
    },
    label: edge.relationType.replace("same_", ""),
    labelStyle: { fill: "#e8e4d8", fontSize: 10 },
  }));
}

export default function MotifGraph() {
  const router = useRouter();
  const [motifs, setMotifs] = useState<MotifSummary[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listMotifs(), api.relationships()])
      .then(([motifData, edgeData]) => {
        setMotifs(motifData);
        setRelationships(edgeData);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const nodes = useMemo(() => buildNodes(motifs), [motifs]);
  const edges = useMemo(() => buildEdges(relationships), [relationships]);

  if (loading) {
    return <p className="text-grave-ghost/60">Summoning the graveyard…</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (motifs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-grave-border bg-grave-panel/60 p-8">
        <p className="text-grave-ghost/60">No motifs yet. Bury your first idea.</p>
      </div>
    );
  }

  return (
    <div className="h-[32rem] overflow-hidden rounded-2xl border border-grave-border bg-[radial-gradient(circle_at_top,#1a2234_0%,#0a0c12_56%)]">
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        minZoom={0.45}
        maxZoom={1.5}
        panOnScroll
        onNodeClick={(_, node) => router.push(`/motif/${node.id}`)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#222838" gap={28} size={1} />
        <Controls className="!border-grave-border !bg-grave-panel !text-grave-warm" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
