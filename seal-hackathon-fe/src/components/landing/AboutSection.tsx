"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import styles from "./LandingPage.module.css";

export default function AboutSection() {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={styles.aboutSection}
    >
      <div className={styles.aboutImageCol}>
        <Image src="/images/about_us_image_v2.jpg" alt="About SEAL Hackathon" fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: "cover" }} />
      </div>
      <div className={styles.aboutTextCol}>
        <h2 className={styles.aboutHeading}>Why Join <span className="gradient-text">SEAL?</span></h2>
        <p className={styles.aboutParagraph}>
          SEAL is the ultimate platform for aspiring software engineers to collaborate, build, and showcase their talents. We bring together university students and tech enthusiasts from across the globe to solve real-world problems.
        </p>
        <ul className={styles.aboutList}>
          <li className={styles.aboutListItem}><CheckCircle2 className={styles.aboutListIcon} size={20} /> Connect with top tech companies and mentors</li>
          <li className={styles.aboutListItem}><CheckCircle2 className={styles.aboutListIcon} size={20} /> Build your portfolio with real-world projects</li>
          <li className={styles.aboutListItem}><CheckCircle2 className={styles.aboutListIcon} size={20} /> Win massive prizes and recognition</li>
        </ul>
      </div>
    </motion.div>
  );
}
