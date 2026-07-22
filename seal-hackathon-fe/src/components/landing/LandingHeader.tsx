"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
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
        <div className={styles.logoIcon} style={{ background: "transparent", boxShadow: "none" }}>
          <Image src="/images/logo.svg" alt="SEAL Logo" width={40} height={40} style={{ borderRadius: "var(--radius-md)" }} />
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
