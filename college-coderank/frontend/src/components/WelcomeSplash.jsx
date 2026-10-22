"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Award, Compass, GraduationCap, LogIn, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WelcomeSplash() {
  const router = useRouter();
  const targetText = "Welcome to Rungta University";
  const [typedText, setTypedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Auto-start typewriter effect on page load
  useEffect(() => {
    if (charIndex < targetText.length) {
      const timeout = setTimeout(() => {
        setTypedText(targetText.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setIsTypingComplete(true);
    }
  }, [charIndex, targetText]);

  return (
    <div className="welcome-splash" role="region" aria-label="Welcome to Rungta University">
      <div className="welcome-splash__bg" aria-hidden="true" />
      <div className="welcome-splash__overlay" aria-hidden="true" />

      <header className="welcome-splash__topbar">
        <div className="welcome-splash__crest">
          <img src="/college_logo.png" alt="Rungta University Logo" className="welcome-splash__logo-img" />
          <div className="welcome-splash__crest-text">
            <span>RUNGTA INTERNATIONAL SKILLS UNIVERSITY</span>
            <small className="welcome-splash__crest-presenter">Presented by <strong>DATA SCIENCE CLUB</strong></small>
          </div>
        </div>
        <div className="welcome-splash__top-links">
          <Link href="/login" className="welcome-splash__top-link welcome-splash__top-link--red">
            <LogIn size={14} /> Student Login
          </Link>
          <Link href="/register" className="welcome-splash__top-link welcome-splash__top-link--outline">
            <UserPlus size={14} /> Register
          </Link>
          <Link href="/leaderboard" className="welcome-splash__top-link welcome-splash__top-link--ghost">
            <Compass size={14} /> Leaderboard
          </Link>
        </div>
      </header>

      <div className="welcome-splash__center">
        <div className="welcome-splash__emblem">
          <span className="welcome-splash__emblem-icon welcome-splash__emblem-icon--logo">
            <img src="/college_logo.png" alt="Rungta University Official Emblem" />
          </span>
          <span className="welcome-splash__emblem-tag">
            ESTABLISHED CAMPUS OF EXCELLENCE · RISU
          </span>
        </div>

        <div className="welcome-splash__headline-box">
          <div className="welcome-splash__presenter-pill">
            <Sparkles size={13} />
            <span>Presented by <strong>DATA SCIENCE CLUB</strong></span>
          </div>
          <span className="welcome-splash__pretitle">
            <Sparkles size={14} /> OFFICIAL CAMPUS CODING PORTAL
          </span>
          <h1 className="welcome-splash__headline">
            {typedText}
            <span className={`welcome-splash__cursor ${isTypingComplete ? "welcome-splash__cursor--done" : ""}`}>|</span>
          </h1>
          <p className={`welcome-splash__sub ${isTypingComplete ? "is-visible" : ""}`}>
            Rungta International Skills University · Department of Computer Science &amp; Engineering
          </p>
          <p className={`welcome-splash__motto ${isTypingComplete ? "is-visible" : ""}`}>
            An official initiative presented by the <strong>Data Science Club</strong> · Real-time algorithmic intelligence tracking across LeetCode, CodeChef, GeeksforGeeks, GitHub &amp; HackerRank
          </p>
        </div>

        {/* Action options remain right here on screen once text finishes */}
        <div className={`welcome-splash__actions welcome-splash__actions--permanent ${isTypingComplete ? "is-visible" : ""}`}>
          <div className="welcome-splash__btn-group">
            <button
              type="button"
              className="welcome-splash__primary-btn"
              onClick={() => router.push("/login")}
            >
              <LogIn size={16} /> Student / Admin Login <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="welcome-splash__secondary-btn"
              onClick={() => router.push("/register")}
            >
              <UserPlus size={16} /> New Registration
            </button>
            <button
              type="button"
              className="welcome-splash__tertiary-btn"
              onClick={() => router.push("/leaderboard")}
            >
              <Compass size={16} /> View Leaderboard
            </button>
          </div>
        </div>
      </div>

      <footer className="welcome-splash__footer">
        <span>Rungta Educational Complex · Central India Premier Technical Institution (Bhilai / Raipur)</span>
        <span className="welcome-splash__footer-dsc">An Initiative Presented by <strong>DATA SCIENCE CLUB</strong></span>
      </footer>
    </div>
  );
}
