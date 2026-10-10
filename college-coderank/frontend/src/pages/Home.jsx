import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Award, Flame, Github, GraduationCap, Medal, Sparkles, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api.js";
import { formatNumber, getInitials } from "../utils/helpers.js";
import RankBadge from "../components/RankBadge.jsx";
import StatCard from "../components/StatCard.jsx";
import Loader from "../components/Loader.jsx";

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/leaderboard")
      .then(({ data: response }) => setData(response))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  if (!data && !error) return <Loader />;
  const students = data?.students ?? [];
  const topStudents = students.slice(0, 5);

  return (
    <>
      <section className="welcome-card">
        <div className="welcome-card__copy">
          <span className="eyebrow eyebrow--light">
            <img src="/college_logo.png" alt="Rungta University" className="eyebrow-logo" />
            RUNGTA INTERNATIONAL SKILLS UNIVERSITY · CODING HUB
          </span>
          <h1>Small commits.<br /><span>Big campus energy.</span></h1>
          <p>See who's building, solving and showing up at Rungta University. Your next streak starts right here.</p>
          <div className="welcome-card__btn-row">
            <Link className="button button--white" to="/leaderboard">Explore leaderboard <ArrowRight size={16} /></Link>
            <Link className="button button--campus-intro" to="/welcome"><GraduationCap size={16} /> Campus Intro</Link>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="welcome-orbit welcome-orbit--one" />
          <div className="welcome-orbit welcome-orbit--two" />
          <div className="welcome-code-card"><span>01</span><code>while (learning) &#123;<br />&nbsp; buildSomething();<br />&#125;</code><i><span /><span /><span /></i></div>
          <span className="welcome-float welcome-float--zap"><Zap size={21} fill="currentColor" /></span>
          <span className="welcome-float welcome-float--medal"><Medal size={21} /></span>
        </div>
        <span className="welcome-glow" aria-hidden="true" />
      </section>

      {/* Rungta International Skills University Showcase Section */}
      <section className="section-card campus-showcase-card">
        <div className="campus-showcase-card__inner">
          <div className="campus-showcase-card__media">
            <img src="/college_photo.jpeg" alt="Rungta University Campus Building" className="campus-showcase-card__img" />
            <div className="campus-showcase-card__badge">
              <img src="/college_logo.png" alt="Rungta Logo" className="campus-badge-logo" /> Rungta University Main Campus
            </div>
          </div>
          <div className="campus-showcase-card__content">
            <div className="campus-showcase-brand-header">
              <img src="/college_logo.png" alt="Rungta University Official Logo" className="campus-showcase-brand-logo" />
              <div>
                <span className="eyebrow"><Sparkles size={13} /> OFFICIAL UNIVERSITY PORTAL</span>
                <h2>Rungta International Skills University</h2>
              </div>
            </div>
            <p>
              Welcome to the competitive coding and skills intelligence portal of Rungta International Skills University. 
              Our campus connects students' real-time achievements across LeetCode, CodeChef, GitHub, and HackerRank to celebrate consistency and build technical leadership.
            </p>
            <div className="campus-badges-grid">
              <div className="campus-badge-item">
                <span className="campus-badge-item__icon"><Award size={16} /></span>
                <div>
                  <strong>Premier Tech Campus</strong>
                  <span>Central India · Bhilai & Raipur</span>
                </div>
              </div>
              <div className="campus-badge-item">
                <span className="campus-badge-item__icon"><Zap size={16} /></span>
                <div>
                  <strong>Live Multi-Platform Sync</strong>
                  <span>LeetCode · CodeChef · GitHub · HackerRank</span>
                </div>
              </div>
              <div className="campus-badge-item">
                <span className="campus-badge-item__icon"><Users size={16} /></span>
                <div>
                  <strong>Engineering Departments</strong>
                  <span>CSE, AI, Data Science & IT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="inline-error" role="alert">{error}</div>}

      <div className="stats-grid">
        <StatCard icon={Users} label="Students on the board" value={formatNumber(data?.summary.totalStudents)} note="Across campus" />
        <StatCard icon={Zap} label="Points earned" value={formatNumber(data?.summary.totalPoints)} note="And counting" tone="orange" />
        <StatCard icon={Flame} label="Problems solved" value={formatNumber(students.reduce((sum, student) => sum + (student.stats?.leetcode?.total ?? 0), 0))} note="LeetCode total" tone="peach" />
      </div>

      <section className="section-card leaderboard-preview">
        <div className="section-heading">
          <div><span className="eyebrow">CAMPUS PULSE</span><h2>Leaderboard <span className="live-dot" /> <span className="live-label">LIVE</span></h2></div>
          <Link className="text-link" to="/leaderboard">See all <ArrowUpRight size={16} /></Link>
        </div>
        {error ? (
          <div className="empty-state"><span className="empty-state__icon"><Users size={22} /></span><strong>Leaderboard is getting ready</strong><p>{error}</p></div>
        ) : topStudents.length ? (
          <div className="leaderboard-list">
            {topStudents.map((student) => (
              <div className="leaderboard-row" key={student._id}>
                <RankBadge rank={student.rank} />
                <span className="avatar avatar--soft">{getInitials(student.name)}</span>
                <div className="student-summary"><strong>{student.name}</strong><span>{student.branch} · Section {student.section}</span></div>
                <div className="student-platform"><Github size={15} /> <span>{student.stats?.github?.publicRepos ?? 0} repos</span></div>
                <strong className="student-score">{formatNumber(student.score)} <small>pts</small></strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><span className="empty-state__icon"><Medal size={22} /></span><strong>No rankings just yet</strong><p>Once students join the board, the campus race begins.</p></div>
        )}
      </section>

      <div className="bottom-callout">
        <div className="bottom-callout__icon"><Flame size={20} /></div>
        <div><strong>Every streak starts with one problem.</strong><span>Show up today. Future you will be glad you did.</span></div>
        <Link to="/leaderboard" aria-label="Open leaderboard"><ArrowRight size={19} /></Link>
      </div>
    </>
  );
}