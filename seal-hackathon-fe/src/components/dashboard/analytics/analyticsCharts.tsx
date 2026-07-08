"use client";
// Both analytics charts live in ONE module so their shared recharts/d3
// dependency (~400KB) is emitted as a single lazy chunk. The page loads each
// via next/dynamic against this same path, so recharts is fetched once — not
// once per chart. Keeping them in separate files duplicated recharts.
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

interface CriterionRadarChartProps {
  radarData: { criterion: string; avgScore: number }[];
}

export function CriterionRadarChart({ radarData }: CriterionRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={radarData}>
        <PolarGrid stroke="rgba(148,163,184,0.1)" />
        <PolarAngleAxis dataKey="criterion" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
        <PolarRadiusAxis tick={{ fill: "var(--color-text-3)", fontSize: 10 }} />
        <Radar name="Average Score" dataKey="avgScore" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
        <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

interface JudgeVarianceChartProps {
  varianceRows: Record<string, string | number>[];
  judgeNames: string[];
}

export function JudgeVarianceChart({ varianceRows, judgeNames }: JudgeVarianceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={varianceRows} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis dataKey="name" tick={{ fill: "var(--color-text-2)", fontSize: 12 }} />
        <YAxis tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
        {judgeNames.map((j, i) => (
          <Bar key={j} dataKey={j} name={j} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
