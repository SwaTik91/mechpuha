"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  collectTreeLinks,
  layoutTreeConnectors,
  type ConnectorPath,
  type PersonBox,
} from "../domain/tree-links";
import type { FamilyGraph } from "../domain/types";

type TreeCanvasProps = {
  graph: FamilyGraph;
  layoutKey?: string;
  children: ReactNode;
};

function measureBoxes(host: HTMLElement): PersonBox[] {
  const origin = host.getBoundingClientRect();
  return [...host.querySelectorAll<HTMLElement>("[data-person-id]")].map((node) => {
    const rect = node.getBoundingClientRect();
    return {
      id: node.dataset.personId ?? "",
      x: rect.left - origin.left + host.scrollLeft,
      y: rect.top - origin.top + host.scrollTop,
      width: rect.width,
      height: rect.height,
    };
  });
}

function labelBoxWidth(text: string): number {
  return text.length * 7.4 + 12;
}

export function TreeCanvas({ graph, layoutKey, children }: TreeCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const paint = () => {
      const next = layoutTreeConnectors(collectTreeLinks(graph), measureBoxes(host));
      setPaths(next);
      setSize({ width: host.scrollWidth, height: host.scrollHeight });
    };

    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(host);
    for (const node of host.querySelectorAll("[data-person-id]")) {
      observer.observe(node);
    }
    host.addEventListener("scroll", paint);
    window.addEventListener("resize", paint);
    return () => {
      observer.disconnect();
      host.removeEventListener("scroll", paint);
      window.removeEventListener("resize", paint);
    };
  }, [graph, layoutKey]);

  return (
    <div className="tree-canvas" ref={hostRef}>
      <svg
        className="tree-connectors"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-hidden="true"
      >
        {paths.map((path, index) => {
          const width = labelBoxWidth(path.label.text);
          return (
            <g key={`${path.d}-${path.label.text}-${index}`}>
              <path className="tree-connectors__line" d={path.d} />
              <rect
                className="tree-connectors__label-bg"
                x={path.label.x - width / 2}
                y={path.label.y - 8}
                width={width}
                height={16}
              />
              <text
                className="tree-connectors__label"
                x={path.label.x}
                y={path.label.y}
                data-testid="tree-link-label"
              >
                {path.label.text.toLocaleUpperCase("ru-RU")}
              </text>
            </g>
          );
        })}
      </svg>
      {children}
    </div>
  );
}
