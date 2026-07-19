"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import styles from "./LandingPage.module.css";

export default function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={styles.header}
    >
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Zap className={styles.logoIconGlyph} size={20} />
        </div>
        <span className={styles.logoText}>
          SEAL <span className={styles.logoAccent}>Hackathons</span>
        </span>
      </div>

      <div className={styles.navLinks}>
        <Link href="/auth/login" className="btn btn-ghost">
          Sign In
        </Link>
        <Link href="/auth/register" className="btn btn-primary">
          Register
        </Link>
      </div>
    </motion.header>
  );
}
