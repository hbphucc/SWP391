"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { BarChart3, Download, FileDown, Info, TrendingUp } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./DashboardAnalyticsPage.module.css";

const CriterionRadarChart = dynamic(() => import("./analyticsCharts").then(m => m.CriterionRadarChart), { ssr: false });
const JudgeVarianceChart = dynamic(() => import("./analyticsCharts").then(m => m.JudgeVarianceChart), { ssr: false });

type AnalyticsAudience = "admin" | "judge";

interface EventOption {
  eventId: string;
  eventName: string;
  status: string;
}

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

interface AnonymousScoreRow {
  event: string;
  round: string;
  submissionCode: string;
  judgeCode: string;
  judgeType: string;
  criterion: string;
  score: number;
  maxScore: number;
  weight: number;
}

interface InterRaterAnalytics {
  overallIcc: number | null;
  judgeCount: number;
  submissionCount: number;
  criteriaCount: number;
  byCriterion: CriterionReliability[];
  variance: TeamVariance[];
  criterionAverages: CriterionAverage[];
  anonymousScores?: AnonymousScoreRow[];
}

function csvCell(cell: string | number) {
  let value = String(cell);
  if (/^[=+\-@]/.test(value)) value = `'${value}`;
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage({ audience = "judge" }: { audience?: AnalyticsAudience }) {
  const { message } = App.useApp();
  const [data, setData] = useState<InterRaterAnalytics | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  const isAdminView = audience === "admin";

  useEffect(() => {
    let active = true;

    apiRequest<EventOption[]>("/Events")
      .then((result) => {
        if (!active) return;
        setEvents(result);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err instanceof Error ? err.message : "Could not load events.");
        setEvents([]);
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [message]);

  useEffect(() => {
    let active = true;
    const query = selectedEventId === "all" ? "" : `?eventId=${selectedEventId}`;

    apiRequest<InterRaterAnalytics>(`/Analytics/inter-rater${query}`)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err instanceof Error ? err.message : "Could not load analytics.");
        setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [message, selectedEventId]);

  const selectedEventName = useMemo(() => {
    if (selectedEventId === "all") return "All events";
    return events.find((event) => event.eventId === selectedEventId)?.eventName ?? "Selected event";
  }, [events, selectedEventId]);

  const judgeNames = useMemo(
    () => Array.from(new Set(data?.variance.flatMap(v => v.judges.map(j => j.judge)) ?? [])),
    [data]
  );

  const varianceRows = useMemo(() => (data?.variance ?? []).map(v => {
    const shortName = v.team.length > 22 ? `${v.team.slice(0, 22)}...` : v.team;
    const row: Record<string, string | number> = { name: v.team, shortName };
    for (const j of v.judges) row[j.judge] = j.avgScore;
    return row;
  }), [data]);

  const radarData = useMemo(() => (data?.criterionAverages ?? []).map(c => ({
    criterion: c.criterion.includes("(") ? c.criterion.split("(")[1].split(")")[0] : c.criterion.length > 15 ? `${c.criterion.substring(0, 15)}...` : c.criterion,
    avgScore: c.avgScore
  })), [data]);

  const canExport = isAdminView && data && data.submissionCount > 0;
  const anonymousScores = data?.anonymousScores ?? [];
  const anonymousExportDisabledReason = !canExport
    ? "Analytics export is available after this event has scoring data."
    : anonymousScores.length === 0
      ? "Restart the backend or choose an event with finalized scoring data to export the anonymized dataset."
      : "Export anonymized per-score rows for RBL analysis.";

  const exportSummaryCSV = () => {
    if (!data) return;
    downloadCsv(
      `analytics-summary-${selectedEventName.replaceAll(" ", "-").toLowerCase()}.csv`,
      ["Event Scope", "Criterion", "ICC", "Agreement", "AvgScore"],
      data.byCriterion.map((item) => [selectedEventName, item.criterion, item.icc ?? "N/A", item.agreement, item.avgScore])
    );
  };

  const exportAnonymousDataset = () => {
    if (!data) return;
    downloadCsv(
      `anonymous-score-dataset-${selectedEventName.replaceAll(" ", "-").toLowerCase()}.csv`,
      ["Event", "Round", "SubmissionCode", "JudgeCode", "JudgeType", "Criterion", "Score", "MaxScore", "Weight"],
      anonymousScores.map((row) => [
        row.event,
        row.round,
        row.submissionCode,
        row.judgeCode,
        row.judgeType,
        row.criterion,
        row.score,
        row.maxScore,
        row.weight,
      ])
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>{isAdminView ? "Admin research workspace" : "Judge read-only insight"}</div>
          <h1 className="page-title">Research Analytics</h1>
          <p className={styles.subtitle}>
            {isAdminView
              ? "Review inter-rater reliability by event and export anonymized scoring data for RBL analysis."
              : "Review scoring consistency for event judging data. Dataset export is reserved for administrators."}
          </p>
        </div>

        <div className={styles.controls}>
          <select
            className={`form-input ${styles.eventSelect}`}
            value={selectedEventId}
            onChange={(event) => {
              setLoading(true);
              setSelectedEventId(event.target.value);
            }}
            disabled={eventsLoading}
            aria-label="Select analytics event"
          >
            <option value="all">All events</option>
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId}>
                {event.eventName} ({event.status})
              </option>
            ))}
          </select>
          {isAdminView && (
            <>
              <button className="btn btn-secondary" onClick={exportSummaryCSV} disabled={!canExport}>
                <Download size={15} /> Summary CSV
              </button>
              <button
                className="btn btn-primary"
                onClick={exportAnonymousDataset}
                disabled={!canExport || anonymousScores.length === 0}
                title={anonymousExportDisabledReason}
              >
                <FileDown size={15} /> Anonymous Dataset
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.rqBanner}>
        <Info size={18} className={styles.rqIcon} />
        <div>
          <div className={styles.rqTitle}>Research Question</div>
          <p className={styles.rqText}>
            How consistent are hackathon evaluation scores across different judges evaluating the same submission?
          </p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <TrendingUp size={48} className="empty-icon" />
          <div className="empty-title">Loading analytics</div>
        </div>
      ) : !data || data.submissionCount === 0 ? (
        <div className="empty-state">
          <TrendingUp size={48} className="empty-icon" />
          <div className="empty-title">No scoring data yet</div>
          <p className={styles.emptyHint}>Choose another event or wait until judges have finalized scores.</p>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.summaryGrid}>
            {[
              { label: "Overall ICC", val: data.overallIcc != null ? data.overallIcc.toFixed(3) : "N/A", color: "#10b981", sub: "Inter-rater reliability" },
              { label: "Judges", val: String(data.judgeCount), color: "#6366f1", sub: "Scored submissions" },
              { label: "Submissions", val: String(data.submissionCount), color: "#f59e0b", sub: "With scores" },
              { label: "Criteria", val: String(data.criteriaCount), color: "#06b6d4", sub: "Scored criteria" },
            ].map((item) => (
              <div key={item.label} className={`glass-card ${styles.summaryCard}`}>
                <div className={styles.summaryValue} style={{ "--metric-color": item.color } as CSSProperties}>{item.val}</div>
                <div className={styles.summaryLabel}>{item.label}</div>
                <div className={styles.summarySub}>{item.sub}</div>
              </div>
            ))}
          </div>

          <div className={styles.chartGrid}>
            <div className="glass-card">
              <h4 className={styles.chartTitle}>
                <BarChart3 size={16} /> ICC by Criterion
              </h4>
              <div className={styles.criteriaStack}>
                {data.byCriterion.map((item) => {
                  const averageScorePercent = Math.max(0, Math.min(100, item.avgScore));
                  return (
                    <div key={item.criteriaId} className={styles.criterionRow}>
                      <div className={styles.criteriaHeader}>
                        <span className={styles.criterionName}>{item.criterion}</span>
                        <div className={styles.agreementGroup}>
                          <span className={`glass-badge ${item.agreement === "Very High" ? "success" : item.agreement === "High" ? "primary" : item.agreement === "Moderate" ? "warning" : "danger"}`}>{item.agreement}</span>
                          <strong className={styles.scoreValue}>{item.icc ?? "N/A"}</strong>
                        </div>
                      </div>
                      <div className={`progress ${styles.criterionProgress}`}>
                        <div
                          className={`progress-fill ${styles.criterionProgressFill}`}
                          style={{
                            "--progress-width": `${averageScorePercent}%`,
                            "--progress-bg": averageScorePercent >= 90 ? "linear-gradient(90deg,#10b981,#34d399)" : averageScorePercent >= 75 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "linear-gradient(90deg,#f59e0b,#fbbf24)",
                          } as CSSProperties}
                        />
                      </div>
                      <div className={styles.avgScore}>Average score: {item.avgScore}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card">
              <h4 className={styles.chartTitle}>
                <TrendingUp size={16} /> Average Score by Criterion
              </h4>
              <CriterionRadarChart radarData={radarData} />
            </div>
          </div>

          <div className={`glass-card ${styles.varianceCard}`}>
            <h4 className={styles.chartTitle}>Score Variance Across Judges</h4>
            {varianceRows.length === 0 ? (
              <div className={styles.smallMuted}>No team scores yet.</div>
            ) : (
              <JudgeVarianceChart varianceRows={varianceRows} judgeNames={judgeNames} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
