"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Zap, Shield, Star, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./LandingPage.module.css";

const HERO_SLIDES = [
  "/images/hero_banner.png",
  "/images/hero_slide_2.jpg",
  "/images/hero_slide_3.jpg",
  "/images/hero_slide_4.jpg",
];

export default function HeroSection() {
  // Hero image carousel: auto-advances every 3s, with manual arrow controls.
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (dir: number) =>
    setHeroIndex((i) => (i + dir + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div className={styles.heroWrapper}>
      <div className={styles.heroBg}>
        <div className={styles.cyberGrid} />
        <div className={styles.auroraLayer} />
        <div className={styles.scanline} />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={styles.heroContentWrapper}
      >
        {/* Hero Text */}
        <div style={{ flex: "1 1 500px" }}>
          <motion.div
            className={styles.heroTag}
            style={{ marginBottom: "1.5rem" }}
            animate={{ boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 15px rgba(99,102,241,0.4)", "0 0 0px rgba(99,102,241,0)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Rocket size={16} />
            <span>Unleash Your Creative Potential</span>
          </motion.div>

          <h1 className={`${styles.heroTitle} ${styles.heroTitleGradient}`} style={{ textAlign: "left", marginTop: 0, lineHeight: 1.1, letterSpacing: "-0.02em", fontWeight: 900 }}>
            Explore & Compete in <br />
            <span>World-Class Hackathons</span>
          </h1>
          <p className={styles.heroDesc} style={{ textAlign: "left", marginBottom: "2.5rem" }}>
            Connect with top talent, showcase your skills, and build outstanding software solutions in globally recognized Hackathon competitions.
          </p>

          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            <Link href="/auth/register" className="btn btn-primary" style={{ padding: "0.9rem 1.8rem", fontSize: "1.1rem", borderRadius: "99px", boxShadow: "0 8px 25px rgba(99,102,241,0.4)" }}>
              Get Started
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("featured-events")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn btn-ghost"
              style={{ padding: "0.9rem 1.8rem", fontSize: "1.1rem", borderRadius: "99px", border: "1px solid var(--color-border)", backdropFilter: "blur(10px)", cursor: "pointer" }}
            >
              View Events
            </button>
          </div>
        </div>

        {/* Cinematic Hero Image */}
        <div style={{ flex: "1 1 500px", display: "flex", justifyContent: "center" }}>
          <div className={styles.posterFrame}>
            <div className={styles.posterImageContainer}>
              <AnimatePresence initial={false}>
                <motion.div
                  key={heroIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <Image src={HERO_SLIDES[heroIndex]} alt={`Hero slide ${heroIndex + 1}`} fill style={{ objectFit: "cover" }} priority />
                </motion.div>
              </AnimatePresence>
              <div className={styles.hologramSweep} />

              <div className={styles.carouselDots}>
                {HERO_SLIDES.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`${styles.carouselDot} ${i === heroIndex ? styles.carouselDotActive : ""}`}
                    onClick={() => setHeroIndex(i)}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Carousel arrows — outside the clipped image container so their glow isn't cut */}
            <button type="button" className={`${styles.carouselArrow} ${styles.carouselPrev}`} onClick={() => goToSlide(-1)} aria-label="Previous image">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className={`${styles.carouselArrow} ${styles.carouselNext}`} onClick={() => goToSlide(1)} aria-label="Next image">
              <ChevronRight size={22} />
            </button>

            {/* Floating Badges */}
            <div className={`${styles.floatingBadge} ${styles.badge1}`}>
              <Zap size={16} style={{ color: "var(--color-cyan)" }} /> Live Coding
            </div>
            <div className={`${styles.floatingBadge} ${styles.badge2}`}>
              <Shield style={{ color: "var(--color-emerald)" }} /> Team Battle
            </div>
            <div className={`${styles.floatingBadge} ${styles.badge3}`}>
              <Star size={16} style={{ color: "var(--color-amber)" }} /> AI Challenge
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
