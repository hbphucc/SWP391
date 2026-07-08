"use client";
// Recharts pulls in ~430KB of d3 code. Isolating the chart here lets the
// judging pages load it lazily (via next/dynamic) instead of shipping it in
// the route's initial bundle. Keep this file's only heavy dep = recharts.
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type ChartCriterion = {
  criteriaId: string;
  criteriaName: string;
  maxScore: number;
};

interface ScoreDistributionChartProps {
  criteria: ChartCriterion[];
  scores: Record<string, number>;
  radarMax: number;
}

const shortLabel = (name: string) =>
  name.includes("(") ? name.split("(")[1].split(")")[0] : name.length > 15 ? name.substring(0, 15) + "..." : name;

export default function ScoreDistributionChart({ criteria, scores, radarMax }: ScoreDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {criteria.length <= 2 ? (
        <BarChart data={criteria.map(c => ({
          subject: shortLabel(c.criteriaName),
          Score: scores[c.criteriaId] ?? 0,
          fullMark: Number(c.maxScore)
        }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis dataKey="subject" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--color-text-3)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, radarMax]} />
          <Tooltip
            contentStyle={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}
            itemStyle={{ color: "var(--color-primary)", fontWeight: 600 }}
            labelStyle={{ color: "var(--color-text-2)" }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey="Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      ) : (
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={criteria.map(c => ({
          subject: shortLabel(c.criteriaName),
          A: scores[c.criteriaId] ?? 0,
          fullMark: Number(c.maxScore)
        }))}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, radarMax]} tick={false} axisLine={false} />
          <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
        </RadarChart>
      )}
    </ResponsiveContainer>
  );
}
