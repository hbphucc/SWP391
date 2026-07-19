"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ClipboardCheck, MessageSquare, UserPlus, UploadCloud, Sparkles, Trophy, ShieldCheck, ArrowRight } from "lucide-react";
import styles from "./LandingPage.module.css";

/** Static marketing blocks below the events grid: value props, 3-step flow, CTA. */
export default function LandingStorySections() {
  return (
    <>
      <motion.section
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className={styles.valueSection}
      >
        <div className={styles.sectionIntro}>
          <span className={styles.sectionKicker}>One platform for every hackathon role</span>
          <h2>Everything you need to run and join events</h2>
          <p>SEAL brings participants, organizers, mentors, and judges into one clear workflow — from registration to final ranking.</p>
        </div>

        <div className={styles.valueGrid}>
          <Link href="/auth/register" className={styles.valueCard}>
            <div className={`${styles.valueIcon} ${styles.valueIconBlue}`}><Users size={24} /></div>
            <h3>Team & event management</h3>
            <p>Create teams, manage members, join tracks, and follow each round from a single participant dashboard.</p>
            <div className={styles.valueTags}><span>Team members</span><span>Tracks</span><span>Rounds</span></div>
          </Link>

          <Link href="/auth/register" className={styles.valueCard}>
            <div className={`${styles.valueIcon} ${styles.valueIconPurple}`}><ClipboardCheck size={24} /></div>
            <h3>Transparent judging</h3>
            <p>Assign judges by event and round, configure criteria, and keep scoring queues organized for fair evaluation.</p>
            <div className={styles.valueTags}><span>Criteria</span><span>Scoring</span><span>Rankings</span></div>
          </Link>

          <Link href="/auth/register" className={`${styles.valueCard} ${styles.valueCardHighlight}`}>
            <div className={`${styles.valueIcon} ${styles.valueIconGreen}`}><MessageSquare size={24} /></div>
            <h3>Mentor & support flow</h3>
            <p>Keep communication structured with mentor visibility, judge approval flows, and helpful event information.</p>
            <div className={styles.valueTags}><span>Mentors</span><span>Support</span><span>Requests</span></div>
          </Link>
        </div>
      </motion.section>

      <motion.section
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5 }}
        className={styles.stepsSection}
      >
        <div className={styles.sectionIntro}>
          <span className={styles.sectionKicker}>Start in 3 steps</span>
          <h2>From account to submission, without the chaos</h2>
          <p>Register, join an event, then submit your project when the round opens.</p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepItem}>
            <div className={styles.stepIcon}><UserPlus size={22} /><span>1</span></div>
            <h3>Create your account</h3>
            <p>Sign up as a participant and get access to your personal dashboard.</p>
          </div>
          <div className={styles.stepLine}></div>
          <div className={styles.stepItem}>
            <div className={styles.stepIcon}><Users size={22} /><span>2</span></div>
            <h3>Join or build a team</h3>
            <p>Pick an event track, invite members, and prepare for each competition round.</p>
          </div>
          <div className={styles.stepLine}></div>
          <div className={styles.stepItem}>
            <div className={styles.stepIcon}><UploadCloud size={22} /><span>3</span></div>
            <h3>Submit and compete</h3>
            <p>Upload your project, receive judging, and follow rankings after scores are published.</p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.5 }}
        className={styles.ctaSection}
      >
        <div className={styles.ctaContent}>
          <div className={styles.ctaBadge}><Sparkles size={16} /> Ready for the next round?</div>
          <h2 className={styles.ctaTitle}>Build your team. Submit your idea. Compete with confidence.</h2>
          <p className={styles.ctaDesc}>Create an account to register for events, form a team, submit your project, and follow judging results in one place.</p>
          <div className={styles.ctaStats}>
            <span><Trophy size={15} /> Live events</span>
            <span><ShieldCheck size={15} /> Fair scoring</span>
            <span><Users size={15} /> Team workflow</span>
          </div>
        </div>
        <div className={styles.ctaActions}>
          <Link href="/auth/register" className="btn btn-primary">Register Now <ArrowRight size={16} /></Link>
          <Link href="/auth/login" className="btn btn-secondary">Sign In</Link>
        </div>
      </motion.section>
    </>
  );
}
