"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import HelpTopicCard from "./HelpTopicCard";
import ReadinessChecklist from "./ReadinessChecklist";
import FaqAccordion from "./FaqAccordion";
import GlossaryPanel from "./GlossaryPanel";
import { HELP_ROLES, HELP_TOPICS, type HelpRole } from "./helpContent";
import styles from "./DashboardHelpPage.module.css";

export default function DashboardHelpPage() {
  const [activeRole, setActiveRole] = useState<HelpRole>("Participant");
  const [searchText, setSearchText] = useState("");

  const filteredTopics = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return HELP_TOPICS.filter((topic) => {
      const roleMatch = topic.role === activeRole;
      const content = [
        topic.title,
        topic.summary,
        topic.role,
        ...topic.steps,
        ...topic.tips,
        ...topic.links.map((link) => link.label),
      ].join(" ").toLowerCase();

      return roleMatch && (!query || content.includes(query));
    });
  }, [activeRole, searchText]);

  return (
    <div className={styles.root}>
      <div className={`page-header ${styles.header}`}>
        <div>
          <h1 className={`page-title ${styles.title}`}>
            <BookOpen size={28} />
            Hackathon Guide
          </h1>
          <p className={styles.subtitle}>
            A role-based help center for event registration, team workflow, submissions, judging, mentoring, and administration.
          </p>
        </div>

        <label className={styles.searchBox}>
          <Search size={16} />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search guide, FAQ, or workflow..."
          />
        </label>
      </div>

      <div className={styles.roleTabs} aria-label="Guide roles">
        {HELP_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            className={`${styles.roleTab} ${activeRole === role ? styles.roleTabActive : ""}`}
            onClick={() => setActiveRole(role)}
          >
            {role}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <main className={styles.topicColumn}>
          {filteredTopics.length === 0 ? (
            <div className={styles.emptyState}>
              No guide topics match this search for {activeRole}.
            </div>
          ) : (
            filteredTopics.map((topic) => <HelpTopicCard key={topic.id} topic={topic} />)
          )}
        </main>

        <aside className={styles.sideColumn}>
          <ReadinessChecklist />
          <FaqAccordion activeRole={activeRole} searchText={searchText} />
          <GlossaryPanel />
        </aside>
      </div>
    </div>
  );
}
