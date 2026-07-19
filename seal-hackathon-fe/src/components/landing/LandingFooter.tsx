"use client";

import Link from "next/link";
import { Zap, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";
import styles from "./LandingPage.module.css";

export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <div className={styles.footerLogoRow}>
            <div className={styles.logoIcon}>
              <Zap className={styles.logoIconGlyph} size={18} />
            </div>
            <div>
              <div className={styles.footerTitle}>SEAL Hackathons</div>
              <p className={styles.footerText}>Software Engineering Hackathon Hub</p>
            </div>
          </div>

          <p className={styles.footerIntro}>
            Connect students, teams, mentors, judges, and organizers in one modern competition platform.
          </p>

          <div className={styles.footerContactList}>
            <a href="mailto:admin@seal.com"><Mail size={16} /> admin@seal.com</a>
            <a href="mailto:foxmiinaaa@gmail.com"><Mail size={16} /> foxmiinaaa@gmail.com</a>
            <a href="tel:0395105358"><Phone size={16} /> 0395105358</a>
            <span><MapPin size={16} /> SEAL Hackathon Hub</span>
          </div>
        </div>

        <div className={styles.footerColumn}>
          <h3>Explore</h3>
          <Link href="/">Featured Events</Link>
          <Link href="/auth/register">Register an Account</Link>
          <Link href="/auth/login">Sign In</Link>
          <Link href="/dashboard/events">Browse Events</Link>
        </div>

        <div className={styles.footerColumn}>
          <h3>For Participants</h3>
          <span>Build your team</span>
          <span>Submit project work</span>
          <span>Follow rankings</span>
          <span>Join active rounds</span>
        </div>

        <div className={styles.footerColumn}>
          <h3>Support</h3>
          <a href="mailto:admin@seal.com">Admin Support</a>
          <a href="mailto:foxmiinaaa@gmail.com">Technical Contact</a>
          <a href="tel:0395105358">Call Organizer</a>
          <span><ShieldCheck size={14} /> Fair judging policy</span>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© 2026 SEAL Hackathons. All rights reserved.</span>
        <span>Built for transparent scoring, team management, and event operations.</span>
      </div>
    </footer>
  );
}
