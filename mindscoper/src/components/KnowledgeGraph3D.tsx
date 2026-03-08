"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import type { Entity, Edge } from "@/lib/types";

interface KnowledgeGraph3DProps {
  entities: Entity[];
  edges: Edge[];
}

const typeColors: Record<string, string> = {
  patient: "#0d9488",
  symptom: "#ef4444",
  behavior: "#f59e0b",
  emotion: "#8b5cf6",
  event: "#3b82f6",
  trigger: "#f97316",
  outcome: "#6366f1",
};

interface GraphNode {
  id: string;
  label: string;
  type: string;
  color: string;
  val: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  color: string;
}

export function KnowledgeGraph3D({ entities, edges }: KnowledgeGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
    const nodeSet = new Set(entities.map((e) => e.id));

    const nodes: GraphNode[] = entities.map((e) => ({
      id: e.id,
      label: e.label,
      type: e.type,
      color: typeColors[e.type] || "#94a3b8",
      val: e.type === "patient" ? 8 : 3,
    }));

    const links: GraphLink[] = edges
      .filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        label: e.label,
        color: "rgba(148, 163, 184, 0.4)",
      }));

    return { nodes, links };
  }, [entities, edges]);

  const nodeThreeObject = useCallback((node: GraphNode) => {
    const group = new THREE.Group();

    // Glowing sphere
    const geometry = new THREE.SphereGeometry(
      node.type === "patient" ? 6 : 4,
      32,
      32
    );
    const material = new THREE.MeshPhongMaterial({
      color: node.color,
      emissive: node.color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Outer glow ring
    const glowGeometry = new THREE.SphereGeometry(
      node.type === "patient" ? 8 : 5.5,
      32,
      32
    );
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: node.color,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Text label
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(node.label, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(20, 5, 1);
    sprite.position.set(0, node.type === "patient" ? 10 : 7, 0);
    group.add(sprite);

    return group;
  }, []);

  if (entities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No entities to visualize
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full" style={{ minHeight: 300 }}>
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        backgroundColor="#0f172a"
        nodeThreeObject={nodeThreeObject}
        nodeLabel={(node: GraphNode) => `<span style="color:${node.color};font-weight:bold">${node.label}</span> <span style="color:#94a3b8">(${node.type})</span>`}
        linkColor={(link: GraphLink) => link.color}
        linkWidth={1}
        linkOpacity={0.5}
        linkDirectionalParticles={4}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={(link: GraphLink) => {
          const srcId = typeof link.source === "object" ? link.source.id : link.source;
          const sourceNode = data.nodes.find((n) => n.id === srcId);
          return sourceNode?.color || "#94a3b8";
        }}
        linkLabel={(link: GraphLink) => `<span style="color:#e2e8f0">${link.label}</span>`}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />
    </div>
  );
}
