"use client";

import { useMemo, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_ITEMS, type HelpRole } from "./helpContent";
import styles from "./DashboardHelpPage.module.css";

type FaqAccordionProps = {
  activeRole: HelpRole;
  searchText: string;
};

export default function FaqAccordion({ activeRole, searchText }: FaqAccordionProps) {
  const [openQuestion, setOpenQuestion] = useState(FAQ_ITEMS[0]?.question ?? "");
  const filteredFaq = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const roleMatch = !item.role || item.role === activeRole;
      const text = `${item.question} ${item.answer}`.toLowerCase();
      return roleMatch && (!query || text.includes(query));
    });
  }, [activeRole, searchText]);

  return (
    <section className={`glass-card ${styles.sideCard}`}>
      <div className={styles.sideHeader}>
        <HelpCircle size={20} />
        <div>
          <h2>FAQ</h2>
          <p>Answers for the current role</p>
        </div>
      </div>

      <div className={styles.faqList}>
        {filteredFaq.length === 0 ? (
          <div className={styles.smallEmpty}>No FAQ entries match your search.</div>
        ) : (
          filteredFaq.map((item) => {
            const isOpen = openQuestion === item.question;
            return (
              <button
                key={item.question}
                type="button"
                className={styles.faqItem}
                onClick={() => setOpenQuestion(isOpen ? "" : item.question)}
                aria-expanded={isOpen}
              >
                <span className={styles.faqQuestion}>
                  {item.question}
                  <ChevronDown className={isOpen ? styles.chevronOpen : ""} size={16} />
                </span>
                {isOpen && <span className={styles.faqAnswer}>{item.answer}</span>}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
