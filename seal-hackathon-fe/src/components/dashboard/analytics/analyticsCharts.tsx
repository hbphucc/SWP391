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

type TooltipPayload = {
  name?: string;
  value?: number;
  color?: string;
  payload?: Record<string, string | number>;
};

interface CriterionRadarChartProps {
  radarData: { criterion: string; avgScore: number }[];
}

export function CriterionRadarChart({ radarData }: CriterionRadarChartProps) {
  if (radarData.length < 3) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={radarData} margin={{ top: 12, right: 24, bottom: 12, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="criterion" tick={{ fill: "var(--color-text-2)", fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
          <Bar name="Average Score" dataKey="avgScore" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={44} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

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

function JudgeVarianceTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;
  const values = payload.filter((item) => typeof item.value === "number");

  return (
    <div style={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)", padding: "0.75rem", boxShadow: "var(--shadow-md)" }}>
      <div style={{ color: "var(--color-text-2)", fontWeight: 700, marginBottom: "0.45rem", maxWidth: 260 }}>
        {row?.name}
      </div>
      {values.map((item) => (
        <div key={item.name} style={{ color: item.color, fontWeight: 700, marginTop: 4 }}>
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  );
}

export function JudgeVarianceChart({ varianceRows, judgeNames }: JudgeVarianceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={varianceRows} barGap={4} margin={{ top: 8, right: 24, bottom: 16, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
        <XAxis
          dataKey="shortName"
          height={8}
          tick={false}
        />
        <YAxis tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
        <Tooltip content={<JudgeVarianceTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
        {judgeNames.map((j, i) => (
          <Bar key={j} dataKey={j} name={j} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
