"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import { SUBMISSION_CHECKLIST } from "./helpContent";
import styles from "./DashboardHelpPage.module.css";

const STORAGE_KEY = "seal_help_submission_checklist";

function loadSavedChecklist() {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as Record<string, boolean> : {};
  } catch {
    return {};
  }
}

export default function ReadinessChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadSavedChecklist);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const completeCount = useMemo(
    () => SUBMISSION_CHECKLIST.filter((item) => checked[item]).length,
    [checked],
  );
  const progress = Math.round((completeCount / SUBMISSION_CHECKLIST.length) * 100);

  return (
    <section className={`glass-card ${styles.sideCard}`}>
      <div className={styles.sideHeader}>
        <ClipboardCheck size={20} />
        <div>
          <h2>Submission readiness</h2>
          <p>{completeCount}/{SUBMISSION_CHECKLIST.length} items complete</p>
        </div>
      </div>

      <div className={styles.progressTrack} aria-label={`Submission checklist ${progress}% complete`}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.checklist}>
        {SUBMISSION_CHECKLIST.map((item) => (
          <label key={item} className={styles.checkItem}>
            <input
              type="checkbox"
              checked={Boolean(checked[item])}
              onChange={(event) => setChecked((current) => ({ ...current, [item]: event.target.checked }))}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

      <button type="button" className={styles.resetButton} onClick={() => setChecked({})}>
        <RotateCcw size={14} />
        Reset checklist
      </button>
    </section>
  );
}
