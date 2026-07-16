import { BookMarked } from "lucide-react";
import { GLOSSARY_ITEMS } from "./helpContent";
import styles from "./DashboardHelpPage.module.css";

export default function GlossaryPanel() {
  return (
    <section className={`glass-card ${styles.sideCard}`}>
      <div className={styles.sideHeader}>
        <BookMarked size={20} />
        <div>
          <h2>Glossary</h2>
          <p>Terms used across SEAL</p>
        </div>
      </div>

      <dl className={styles.glossaryList}>
        {GLOSSARY_ITEMS.map((item) => (
          <div key={item.term} className={styles.glossaryItem}>
            <dt>{item.term}</dt>
            <dd>{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
