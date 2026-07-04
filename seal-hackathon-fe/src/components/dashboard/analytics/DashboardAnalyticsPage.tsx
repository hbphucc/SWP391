"use client";
import { useState, useEffect, type CSSProperties } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";
import { Download, Info, TrendingUp } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./DashboardAnalyticsPage.module.css";

interface CriterionReliability {
  criteriaId: string;
  criterion: string;
  icc: number | null;
  agreement: string;
  avgScore: number;
}

interface JudgeAverage {
  judge: string;
  avgScore: number;
}

interface TeamVariance {
  team: string;
  judges: JudgeAverage[];
}

interface CriterionAverage {
  criterion: string;
  avgScore: number;
}

interface InterRaterAnalytics {
  overallIcc: number | null;
  judgeCount: number;
  submissionCount: number;
  criteriaCount: number;
  byCriterion: CriterionReliability[];
  variance: TeamVariance[];
  criterionAverages: CriterionAverage[];
}

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

export default function AnalyticsPage() {
  const { message } = App.useApp();
  const [data, setData] = useState<InterRaterAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest<InterRaterAnalytics>("/Analytics/inter-rater");
        setData(res);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load analytics.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [message]);

  const exportAnalyticsCSV = () => {
    if (!data) return;
    // Quote + escape cells, and neutralize leading formula characters (CSV injection).
    const csvCell = (cell: string | number) => {
      let value = String(cell);
      if (/^[=+\-@]/.test(value)) value = `'${value}`;
      return `"${value.replace(/"/g, '""')}"`;
    };
    const header = "Criterion,ICC,Agreement,AvgScore\n";
    const rows = data.byCriterion.map(d => [d.criterion, d.icc ?? "N/A", d.agreement, d.avgScore].map(csvCell).join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics_export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="empty-state"><TrendingUp size={48} className="empty-icon" /><div className="empty-title">Loading analytics…</div></div>;
  }

  if (!data || data.submissionCount === 0) {
    return (
      <div className="empty-state">
        <TrendingUp size={48} className="empty-icon" />
        <div className="empty-title">No scoring data yet</div>
        <p className={styles.emptyHint}>Inter-rater analytics appear once judges have scored submissions.</p>
      </div>
    );
  }

  // Build dynamic judge bars for the variance chart
  const judgeNames = Array.from(new Set(data.variance.flatMap(v => v.judges.map(j => j.judge))));
  const varianceRows = data.variance.map(v => {
    const row: Record<string, string | number> = { name: v.team };
    for (const j of v.judges) row[j.judge] = j.avgScore;
    return row;
  });

  const radarData = data.criterionAverages.map(c => ({
    criterion: c.criterion.includes("(") ? c.criterion.split("(")[1].split(")")[0] : c.criterion.length > 15 ? c.criterion.substring(0, 15) + "..." : c.criterion,
    avgScore: c.avgScore
  }));

  return (
    <div className={styles.root}>
      <div className={`page-header ${styles.header}`}>
        <div>
          <h1 className="page-title">Research & Analytics</h1>
        </div>
        <button className="btn btn-secondary" onClick={exportAnalyticsCSV}><Download size={15} className={styles.buttonIcon} /> Export CSV</button>
      </div>

      <div className={styles.scrollArea}>
        {/* RQ Banner */}
        <div className={styles.rqBanner}>
          <div className={styles.rqLayout}>
            <Info size={18} className={styles.rqIcon} />
            <div>
              <div className={styles.rqTitle}>Research Question</div>
              <p className={styles.rqText}>
                <strong className={styles.rqPrefix}>RQ:</strong> How consistent are hackathon evaluation scores across different judges evaluating the same submission in academic software engineering competitions?
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className={`glass-grid ${styles.summaryGrid}`}>
          {[
            { label: "Overall ICC",     val: data.overallIcc != null ? data.overallIcc.toFixed(3) : "N/A", color: "#10b981", sub: "Intraclass Correlation" },
            { label: "Judges Analyzed", val: String(data.judgeCount),      color: "#6366f1", sub: "Scored submissions" },
            { label: "Submissions",     val: String(data.submissionCount), color: "#f59e0b", sub: "With scores" },
            { label: "Criteria",        val: String(data.criteriaCount),   color: "#06b6d4", sub: "Scored criteria" },
          ].map(s => (
            <div key={s.label} className={`glass-card ${styles.summaryCard}`}>
              <div className={styles.summaryValue} style={{ "--metric-color": s.color } as CSSProperties}>{s.val}</div>
              <div className={styles.summaryLabel}>{s.label}</div>
              <div className={styles.summarySub}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className={`glass-grid ${styles.chartGrid}`}>
          {/* ICC by Criterion */}
          <div className="glass-card">
            <h4 className={`${styles.chartTitle} ${styles.iconTitle}`}>
              <TrendingUp size={16} className={styles.primaryIcon} /> ICC by Criterion
            </h4>
            {data.byCriterion.length === 0 && <div className={styles.smallMuted}>No criteria scored yet.</div>}
            <div className={styles.criteriaStack}>
              {data.byCriterion.map(d => {
                const icc = d.icc ?? 0;
                return (
                  <div key={d.criteriaId}>
                    <div className={styles.criteriaHeader}>
                      <span className={styles.criterionName}>{d.criterion}</span>
                      <div className={styles.agreementGroup}>
                        <span className={`glass-badge ${d.agreement === "Very High" ? "success" : d.agreement === "High" ? "primary" : d.agreement === "Moderate" ? "warning" : "danger"}`}>{d.agreement}</span>
                        <strong className={styles.scoreValue}>{d.icc ?? "N/A"}</strong>
                      </div>
                    </div>
                    <div className={`progress ${styles.criterionProgress}`}>
                      <div className={`progress-fill ${styles.criterionProgressFill}`} style={{
                        "--progress-width": `${icc * 100}%`,
                        "--progress-bg": icc >= 0.8 ? "linear-gradient(90deg,#10b981,#34d399)" : icc >= 0.65 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "linear-gradient(90deg,#f59e0b,#fbbf24)",
                      } as CSSProperties} />
                    </div>
                    <div className={styles.avgScore}>
                      Avg score: {d.avgScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar: Average score by criterion */}
          <div className="glass-card">
            <h4 className={styles.chartTitle}>Average Score by Criterion</h4>
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
          </div>
        </div>

        {/* Score Variance Chart */}
        <div className={`glass-card ${styles.varianceCard}`}>
          <h4 className={styles.chartTitle}>Score Variance Across Judges (per Team)</h4>
          {varianceRows.length === 0 ? (
            <div className={styles.smallMuted}>No team scores yet.</div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
