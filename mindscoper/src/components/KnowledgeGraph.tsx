"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Network } from "lucide-react";
import type { Entity, Edge } from "@/lib/types";

interface KnowledgeGraphProps {
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

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  label: string;
}

export function KnowledgeGraph({ entities, edges }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || entities.length === 0)
      return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const nodes: SimNode[] = entities.map((e) => ({
      id: e.id,
      label: e.label,
      type: e.type,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        label: e.label,
      }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Draw edges
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6);

    // Edge labels
    const linkLabel = g
      .append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#94a3b8")
      .text((d) => d.label);

    // Draw nodes
    const node = g
      .append("g")
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes)
      .join("g")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("circle")
      .attr("r", (d) => (d.type === "patient" ? 24 : 16))
      .attr("fill", (d) => typeColors[d.type] || "#94a3b8")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.9);

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.type === "patient" ? 36 : 28))
      .attr("font-size", (d) => (d.type === "patient" ? "12px" : "10px"))
      .attr("font-weight", (d) => (d.type === "patient" ? "bold" : "normal"))
      .attr("fill", "#334155")
      .text((d) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      linkLabel
        .attr(
          "x",
          (d) => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2
        )
        .attr(
          "y",
          (d) => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2
        );

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [entities, edges]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">
            Knowledge Relation Map
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] capitalize text-muted-foreground">
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="relative flex-1 min-h-75">
        <svg ref={svgRef} className="h-full w-full" />
      </div>
    </div>
  );
}
