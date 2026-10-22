"use client";

import { useMemo } from "react";
import { ArrowUpRight, Award, Flame, Medal, Sparkles, Trophy } from "lucide-react";
import { computeStudentPlatformPositions } from "../utils/dashboardData.js";
import { formatNumber } from "../utils/helpers.js";

export default function StudentPlatformStandings({ student, positions: initialPositions, allStudents = [] }) {
  const positions = useMemo(() => {
    if (initialPositions && typeof initialPositions.overall === "number") {
      return initialPositions;
    }
    return computeStudentPlatformPositions(student, allStudents);
  }, [student, initialPositions, allStudents]);

  if (!student || !positions) return null;

  const stats = student.stats || {};
  const lcTotal = stats.leetcode?.total ?? ((stats.leetcode?.easy || 0) + (stats.leetcode?.medium || 0) + (stats.leetcode?.hard || 0));
  const ccRating = stats.codechef?.rating || 0;
  const ccSolved = stats.codechef?.problemsSolved || 0;
  const gfgSolved = stats.geeksforgeeks?.problemsSolved || 0;
  const gfgScore = stats.geeksforgeeks?.score || 0;
  const hrSolved = stats.hackerrank?.solved ?? (stats.hackerrank?.points ? Math.round(stats.hackerrank.points / 10) : 0);
  const hrPoints = stats.hackerrank?.points || 0;
  const ghRepos = stats.github?.publicRepos || 0;

  const cards = [
    {
      id: "overall",
      title: "Overall Campus Rank",
      platform: "Overall Leaderboard",
      icon: <Trophy size={18} className="standing-icon standing-icon--trophy" />,
      rank: positions.overall,
      total: positions.totalStudents,
      metricVal: `${formatNumber(student.score)} pts`,
      metricSub: `#${positions.branch} in ${student.branch}`,
      tag: positions.overall === 1 ? "Campus Topper 🏆" : positions.overall <= 3 ? "Podium Finisher 🎖️" : `Top ${Math.max(1, Math.round((positions.overall / positions.totalStudents) * 100))}%`,
      isTop: positions.overall <= 3,
      tone: "crimson"
    },
    {
      id: "leetcode",
      title: "LeetCode Position",
      platform: "LeetCode",
      logo: "/leetcode_logo.jpeg",
      rank: positions.leetcode,
      total: positions.totalStudents,
      metricVal: `${formatNumber(lcTotal)} Solved`,
      metricSub: `${stats.leetcode?.easy || 0}E · ${stats.leetcode?.medium || 0}M · ${stats.leetcode?.hard || 0}H`,
      username: student.leetcodeUsername,
      url: student.leetcodeUsername ? `https://leetcode.com/u/${encodeURIComponent(student.leetcodeUsername)}/` : null,
      isTop: positions.leetcode <= 3,
      tone: "red"
    },
    {
      id: "codechef",
      title: "CodeChef Position",
      platform: "CodeChef",
      logo: "/codechef_logo.svg",
      rank: positions.codechef,
      total: positions.totalStudents,
      metricVal: ccRating ? `${formatNumber(ccRating)} Rating` : (ccSolved ? `${formatNumber(ccSolved)} Solved` : "Unrated"),
      metricSub: stats.codechef?.stars ? `${stats.codechef.stars} · ${ccSolved} solved` : "Practice tier",
      username: student.codechefUsername,
      url: student.codechefUsername ? `https://www.codechef.com/users/${encodeURIComponent(student.codechefUsername)}` : null,
      isTop: positions.codechef <= 3,
      tone: "red"
    },
    {
      id: "geeksforgeeks",
      title: "GeeksforGeeks Position",
      platform: "GeeksforGeeks",
      logo: "/gfg_logo.svg",
      rank: positions.geeksforgeeks,
      total: positions.totalStudents,
      metricVal: `${formatNumber(gfgSolved)} Solved`,
      metricSub: `Coding Score: ${formatNumber(gfgScore)} pts`,
      username: student.geeksforgeeksUsername,
      url: student.geeksforgeeksUsername ? `https://www.geeksforgeeks.org/user/${encodeURIComponent(student.geeksforgeeksUsername)}/` : null,
      isTop: positions.geeksforgeeks <= 3,
      tone: "red"
    },
    {
      id: "hackerrank",
      title: "HackerRank Position",
      platform: "HackerRank",
      logo: "/hackerrank_logo.jpeg",
      rank: positions.hackerrank,
      total: positions.totalStudents,
      metricVal: `${formatNumber(hrSolved)} Solved`,
      metricSub: `${formatNumber(hrPoints)} pts · ${stats.hackerrank?.badges || 0} badges`,
      username: student.hackerrankUsername,
      url: student.hackerrankUsername ? `https://www.hackerrank.com/profile/${encodeURIComponent(student.hackerrankUsername)}` : null,
      isTop: positions.hackerrank <= 3,
      tone: "red"
    },
    {
      id: "github",
      title: "GitHub Position",
      platform: "GitHub Repositories",
      logo: "/github_logo.jpeg",
      rank: positions.github,
      total: positions.totalStudents,
      metricVal: `${formatNumber(ghRepos)} Repos`,
      metricSub: `${formatNumber(stats.github?.followers || 0)} followers`,
      username: student.githubUsername,
      url: student.githubUsername ? `https://github.com/${encodeURIComponent(student.githubUsername)}` : null,
      isTop: positions.github <= 3,
      tone: "red"
    }
  ];

  return (
    <section className="section-card platform-standings-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            <Flame size={12} /> CAMPUS PLATFORM STANDINGS
          </span>
          <h2>
            Position Across Every Coding Platform{" "}
            <span className="count-pill">Out of {positions.totalStudents} students</span>
          </h2>
        </div>
        <div className="heading-actions">
          <span className="table-caption">
            Real-time live campus rank comparison
          </span>
        </div>
      </div>

      <div className="standings-grid">
        {cards.map((card) => {
          const isPodium = card.rank <= 3;
          return (
            <div
              key={card.id}
              className={`standing-item ${isPodium ? "standing-item--podium" : ""}`}
            >
              <div className="standing-item__top">
                <div className="standing-platform-brand">
                  {card.logo ? (
                    <img src={card.logo} alt={card.platform} className="standing-logo" />
                  ) : (
                    card.icon
                  )}
                  <span className="standing-platform-name">{card.platform}</span>
                </div>
                {card.tag && <span className="standing-tag">{card.tag}</span>}
              </div>

              <div className="standing-item__rank-row">
                <div className="standing-rank-badge">
                  <span className="standing-hash">#</span>
                  <span className="standing-rank-number">{card.rank}</span>
                </div>
                <div className="standing-rank-meta">
                  <span className="standing-label">{card.title}</span>
                  <small className="standing-cohort">of {card.total} campus coders</small>
                </div>
              </div>

              <div className="standing-item__stats">
                <strong className="standing-metric-value">{card.metricVal}</strong>
                <span className="standing-metric-sub">{card.metricSub}</span>
              </div>

              {card.username ? (
                <div className="standing-item__footer">
                  <a
                    href={card.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="standing-handle-link"
                    title={`Open ${card.platform} profile`}
                  >
                    <span>@{card.username}</span>
                    <ArrowUpRight size={11} />
                  </a>
                </div>
              ) : card.id !== "overall" ? (
                <div className="standing-item__footer">
                  <span className="standing-handle-unlinked">Handle not linked</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
