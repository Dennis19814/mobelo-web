"use client";

import React, { useMemo, useState, useCallback } from "react";

interface Point {
  x: string | number;
  y: number;
}

interface Series {
  name?: string;
  color?: string;
  data: Point[];
}

interface SimpleLineChartProps {
  series: Series[]; // 1..2 series supported
  height?: number;
  yLabelFormatter?: (v: number) => string;
}

/**
 * Lightweight, dependency-free SVG line chart for small dashboards.
 * - Draws up to 2 series (current + previous)
 * - Evenly spaced x positions; scales y to min..max with padding
 * - Minimal axes and grid for readability
 */
export default function SimpleLineChart({
  series,
  height = 220,
  yLabelFormatter = (v) => String(Math.round(v)),
}: SimpleLineChartProps) {
  const padding = { top: 10, right: 16, bottom: 26, left: 48 };
  const width = 800; // viewBox width; svg responsive via CSS

  // All hooks must be called before any conditional returns
  const allPoints = useMemo(() => series.flatMap((s) => s.data), [series]);
  const total = useMemo(() => Math.max(...series.map((s) => s.data.length)), [series]);
  const values = useMemo(() => allPoints.map((p) => p.y), [allPoints]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const xStep = plotW / (total > 1 ? total - 1 : 1);

  const handleMouseMove = useCallback((evt: React.MouseEvent<SVGSVGElement>) => {
    const rect = (evt.target as SVGElement).closest('svg')!.getBoundingClientRect();
    const clientX = evt.clientX - rect.left;
    const relX = Math.max(padding.left, Math.min(clientX, width - padding.right));
    const idx = Math.round((relX - padding.left) / xStep);
    const clamped = Math.max(0, Math.min(total - 1, idx));
    setHoverIndex(clamped);
  }, [padding.left, padding.right, width, xStep, total]);

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  // Guard: if not enough points
  if (!allPoints.length || total < 2) {
    return (
      <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
        Not enough data to render chart
      </div>
    );
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const yPad = (maxVal - minVal) * 0.1 || 1; // avoid zero range
  const yMin = minVal - yPad;
  const yMax = maxVal + yPad;

  const xAt = (i: number) => padding.left + i * xStep;
  const yAt = (v: number) => padding.top + (yMax - v) * (plotH / (yMax - yMin));

  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));

  const colors = ["#2563eb", "#94a3b8"]; // blue, slate

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[220px] bg-white rounded-lg border border-gray-200"
        role="img"
        aria-label="Time series chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {gridY.map((gy, idx) => (
          <g key={`grid-${idx}`}>
            <line
              x1={padding.left}
              y1={yAt(gy)}
              x2={width - padding.right}
              y2={yAt(gy)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={yAt(gy)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {yLabelFormatter(gy)}
            </text>
          </g>
        ))}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#e5e7eb"
        />

        {/* Series polylines */}
        {series.map((s, sIdx) => {
          const path = s.data
            .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(p.y)}`)
            .join(" ");
          const color = s.color || colors[sIdx % colors.length];
          return (
            <g key={`series-${sIdx}`}>
              <path d={path} fill="none" stroke={color} strokeWidth={2} />
              {/* subtle area fill */}
              <path
                d={`${path} L ${xAt(s.data.length - 1)},${yAt(yMin)} L ${xAt(0)},${yAt(yMin)} Z`}
                fill={color}
                opacity={0.06}
              />
            </g>
          );
        })}

        {/* Hover crosshair and points */}
        {hoverIndex !== null && (
          <g pointerEvents="none">
            {/* crosshair */}
            <line
              x1={xAt(hoverIndex)}
              y1={padding.top}
              x2={xAt(hoverIndex)}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeDasharray="4 3"
            />
            {/* point markers */}
            {series.map((s, sIdx) => {
              const p = s.data[hoverIndex!];
              if (!p) return null;
              const color = s.color || colors[sIdx % colors.length];
              return (
                <circle
                  key={`pt-${sIdx}`}
                  cx={xAt(hoverIndex!)}
                  cy={yAt(p.y)}
                  r={3.5}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              );
            })}

            {/* tooltip */}
            {(() => {
              const primary = series[0]?.data[hoverIndex!];
              if (!primary) return null;
              const tipW = 160;
              const tipH = 44;
              const anchorX = xAt(hoverIndex!);
              const tipX = Math.min(Math.max(anchorX + 8, padding.left + 4), width - padding.right - tipW);
              const tipY = padding.top + 8;
              const val = yLabelFormatter(primary.y);
              const dateLabel = String(primary.x);
              return (
                <g>
                  <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={8} fill="#ffffff" stroke="#e5e7eb" />
                  <text x={tipX + 10} y={tipY + 18} fontSize={11} fill="#111827" fontWeight={600}>
                    {val}
                  </text>
                  <text x={tipX + 10} y={tipY + 34} fontSize={10} fill="#6b7280">
                    {dateLabel}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}
