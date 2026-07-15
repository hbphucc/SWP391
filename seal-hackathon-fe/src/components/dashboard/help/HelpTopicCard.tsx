import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { HelpTopic } from "./helpContent";
import styles from "./DashboardHelpPage.module.css";

type HelpTopicCardProps = {
  topic: HelpTopic;
};

export default function HelpTopicCard({ topic }: HelpTopicCardProps) {
  const Icon = topic.icon;

  return (
    <article className={`glass-card ${styles.topicCard}`}>
      <div className={styles.topicHeader}>
        <div className={styles.topicIcon}>
          <Icon size={22} />
        </div>
        <div className={styles.topicIntro}>
          <div className={styles.topicMeta}>{topic.role}</div>
          <h2>{topic.title}</h2>
          <p>{topic.summary}</p>
        </div>
      </div>

      <ol className={styles.stepList}>
        {topic.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className={styles.tipList}>
        {topic.tips.map((tip) => (
          <div key={tip} className={styles.tipItem}>
            <CheckCircle2 size={15} />
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <div className={styles.quickLinks}>
        {topic.links.map((link) => (
          <Link key={link.href} href={link.href} className="btn btn-secondary btn-sm">
            {link.label}
          </Link>
        ))}
      </div>
    </article>
  );
}
