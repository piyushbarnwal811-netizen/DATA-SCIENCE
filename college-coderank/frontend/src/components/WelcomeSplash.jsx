import { useEffect, useState } from "react";
import { ArrowRight, Award, Compass, GraduationCap, LogIn, Sparkles, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function WelcomeSplash() {
  const navigate = useNavigate();
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
          <span>RUNGTA INTERNATIONAL SKILLS UNIVERSITY</span>
        </div>
        <div className="welcome-splash__top-links">
          <Link to="/login" className="welcome-splash__top-link welcome-splash__top-link--red">
            <LogIn size={14} /> Student Login
          </Link>
          <Link to="/register" className="welcome-splash__top-link welcome-splash__top-link--outline">
            <UserPlus size={14} /> Register
          </Link>
          <Link to="/leaderboard" className="welcome-splash__top-link welcome-splash__top-link--ghost">
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
          <span className="welcome-splash__pretitle">
            <Sparkles size={14} /> OFFICIAL CAMPUS CODING PORTAL
          </span>
          <h1 className="welcome-splash__headline">
            {typedText}
            <span className={`welcome-splash__cursor ${isTypingComplete ? "welcome-splash__cursor--done" : ""}`}>|</span>
          </h1>
          <p className={`welcome-splash__sub ${isTypingComplete ? "is-visible" : ""}`}>
            Rungta International Skills University · Department of Computer Science & Engineering
          </p>
          <p className={`welcome-splash__motto ${isTypingComplete ? "is-visible" : ""}`}>
            Live algorithmic intelligence tracking across LeetCode, CodeChef, GitHub & HackerRank
          </p>
        </div>

        {/* Action options remain right here on screen once text finishes */}
        <div className={`welcome-splash__actions welcome-splash__actions--permanent ${isTypingComplete ? "is-visible" : ""}`}>
          <div className="welcome-splash__btn-group">
            <button
              type="button"
              className="welcome-splash__primary-btn"
              onClick={() => navigate("/login")}
            >
              <LogIn size={16} /> Student / Admin Login <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="welcome-splash__secondary-btn"
              onClick={() => navigate("/register")}
            >
              <UserPlus size={16} /> New Registration
            </button>
            <button
              type="button"
              className="welcome-splash__tertiary-btn"
              onClick={() => navigate("/leaderboard")}
            >
              <Compass size={16} /> View Leaderboard
            </button>
          </div>
        </div>
      </div>

      <footer className="welcome-splash__footer">
        <span>Rungta Educational Complex · Central India Premier Technical Institution (Bhilai / Raipur)</span>
      </footer>
    </div>
  );
}
