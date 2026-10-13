import { ArrowUpRight, Award, Code2, Flame, Github, Sparkles } from "lucide-react";
import { formatNumber, getInitials } from "../../utils/helpers.js";

export default function PlatformDeepDive({ platform = "leetcode", students = [] }) {
  if (platform === "leetcode") {
    const totalEasy = students.reduce((sum, s) => sum + (s.stats?.leetcode?.easy || 0), 0);
    const totalMedium = students.reduce((sum, s) => sum + (s.stats?.leetcode?.medium || 0), 0);
    const totalHard = students.reduce((sum, s) => sum + (s.stats?.leetcode?.hard || 0), 0);
    const totalLC = (totalEasy + totalMedium + totalHard) || 1;

    const easyPct = Math.round((totalEasy / totalLC) * 100);
    const medPct = Math.round((totalMedium / totalLC) * 100);
    const hardPct = Math.max(0, 100 - easyPct - medPct);

    const topSolvers = [...students]
      .sort((a, b) => (b.stats?.leetcode?.total || 0) - (a.stats?.leetcode?.total || 0))
      .slice(0, 8);

    return (
      <div className="deepdive-wrap">
        {/* Summary Card */}
        <div className="deepdive-summary">
          <div className="deepdive-kpi-card deepdive-kpi-card--lc">
            <span className="eyebrow eyebrow--lc">
              <img src="/leetcode_logo.jpeg" alt="" className="deepdive-banner-logo" />
              <span>LEETCODE DIFFICULTY COMPOSITION</span>
            </span>
            <div className="difficulty-pills-row">
              <div className="diff-pill diff-pill--easy">
                <span className="diff-dot diff-dot--easy" />
                <div>
                  <strong>{formatNumber(totalEasy)}</strong>
                  <small>Easy ({easyPct}%)</small>
                </div>
              </div>
              <div className="diff-pill diff-pill--medium">
                <span className="diff-dot diff-dot--medium" />
                <div>
                  <strong>{formatNumber(totalMedium)}</strong>
                  <small>Medium ({medPct}%)</small>
                </div>
              </div>
              <div className="diff-pill diff-pill--hard">
                <span className="diff-dot diff-dot--hard" />
                <div>
                  <strong>{formatNumber(totalHard)}</strong>
                  <small>Hard ({hardPct}%)</small>
                </div>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="ratio-bar">
              <div className="ratio-slice ratio-slice--easy" style={{ width: `${easyPct}%` }} title={`Easy: ${easyPct}%`} />
              <div className="ratio-slice ratio-slice--medium" style={{ width: `${medPct}%` }} title={`Medium: ${medPct}%`} />
              <div className="ratio-slice ratio-slice--hard" style={{ width: `${hardPct}%` }} title={`Hard: ${hardPct}%`} />
            </div>
          </div>
        </div>

        {/* Top Solvers Grid */}
        <div className="top-solvers-section">
          <h4>
            <img src="/leetcode_logo.jpeg" alt="" className="deepdive-section-logo" />
            <span>Top LeetCode Problem Solvers</span>
          </h4>
          <div className="top-solvers-grid">
            {topSolvers.map((s, index) => (
              <div key={s._id || s.studentId || index} className="solver-card">
                <span className="solver-rank">#{index + 1}</span>
                <span className="avatar avatar--soft">{getInitials(s.name)}</span>
                <div className="solver-info">
                  <strong>{s.name}</strong>
                  <span>{s.branch} · {s.studentId}</span>
                </div>
                <div className="solver-metric">
                  <strong>{s.stats?.leetcode?.total || 0}</strong>
                  <small>solved</small>
                </div>
                <div className="solver-breakdown">
                  <span className="pill-e">{s.stats?.leetcode?.easy || 0}E</span>
                  <span className="pill-m">{s.stats?.leetcode?.medium || 0}M</span>
                  <span className="pill-h">{s.stats?.leetcode?.hard || 0}H</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (platform === "hackerrank") {
    const totalHR = students.reduce((sum, s) => sum + (s.stats?.hackerrank?.solved || 0), 0);
    const topHR = [...students]
      .sort((a, b) => (b.stats?.hackerrank?.solved || 0) - (a.stats?.hackerrank?.solved || 0))
      .slice(0, 8);

    return (
      <div className="deepdive-wrap">
        <div className="deepdive-summary">
          <div className="deepdive-kpi-card deepdive-kpi-card--hr">
            <span className="eyebrow eyebrow--hr">
              <img src="/hackerrank_logo.jpeg" alt="" className="deepdive-banner-logo" />
              <span>HACKERRANK PRACTICE METRICS</span>
            </span>
            <div className="hr-stats-banner">
              <div>
                <h3>{formatNumber(totalHR)}</h3>
                <small>Total Practice Challenges Cleared</small>
              </div>
              <div className="hr-stat-pill">
                <span>Avg per student: <b>{(totalHR / (students.length || 1)).toFixed(1)}</b></span>
              </div>
            </div>
          </div>
        </div>

        <div className="top-solvers-section">
          <h4>
            <img src="/hackerrank_logo.jpeg" alt="" className="deepdive-section-logo" />
            <span>Top HackerRank Achievers</span>
          </h4>
          <div className="top-solvers-grid">
            {topHR.map((s, index) => (
              <div key={s._id || s.studentId || index} className="solver-card">
                <span className="solver-rank">#{index + 1}</span>
                <span className="avatar avatar--soft">{getInitials(s.name)}</span>
                <div className="solver-info">
                  <strong>{s.name}</strong>
                  <span>{s.branch} · {s.studentId}</span>
                </div>
                <div className="solver-metric solver-metric--purple">
                  <strong>{s.stats?.hackerrank?.solved || 0}</strong>
                  <small>challenges</small>
                </div>
                {s.hackerrankUsername && (
                  <a
                    className="solver-link"
                    href={`https://www.hackerrank.com/profile/${encodeURIComponent(s.hackerrankUsername)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src="/hackerrank_logo.jpeg" alt="" className="cell-mini-logo" /> @{s.hackerrankUsername} <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (platform === "github") {
    const totalRepos = students.reduce((sum, s) => sum + (s.stats?.github?.publicRepos || 0), 0);
    const topGH = [...students]
      .sort((a, b) => (b.stats?.github?.publicRepos || 0) - (a.stats?.github?.publicRepos || 0))
      .slice(0, 8);

    return (
      <div className="deepdive-wrap">
        <div className="deepdive-summary">
          <div className="deepdive-kpi-card deepdive-kpi-card--gh">
            <span className="eyebrow eyebrow--gh">
              <img src="/github_logo.jpeg" alt="" className="deepdive-banner-logo" />
              <span>OPEN SOURCE & CODE REPOSITORIES</span>
            </span>
            <div className="hr-stats-banner">
              <div>
                <h3>{formatNumber(totalRepos)}</h3>
                <small>Total Public GitHub Repositories</small>
              </div>
              <div className="hr-stat-pill">
                <span>Avg repos / student: <b>{(totalRepos / (students.length || 1)).toFixed(2)}</b></span>
              </div>
            </div>
          </div>
        </div>

        <div className="top-solvers-section">
          <h4>
            <img src="/github_logo.jpeg" alt="" className="deepdive-section-logo" />
            <span>Top GitHub Repository Builders</span>
          </h4>
          <div className="top-solvers-grid">
            {topGH.map((s, index) => (
              <div key={s._id || s.studentId || index} className="solver-card">
                <span className="solver-rank">#{index + 1}</span>
                <span className="avatar avatar--soft">{getInitials(s.name)}</span>
                <div className="solver-info">
                  <strong>{s.name}</strong>
                  <span>{s.branch} · {s.studentId}</span>
                </div>
                <div className="solver-metric solver-metric--green">
                  <strong>{s.stats?.github?.publicRepos || 0}</strong>
                  <small>repositories</small>
                </div>
                {s.githubUsername && (
                  <a
                    className="solver-link"
                    href={`https://github.com/${encodeURIComponent(s.githubUsername)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src="/github_logo.jpeg" alt="" className="cell-mini-logo" /> @{s.githubUsername} <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (platform === "codechef") {
    const totalCC = students.reduce((sum, s) => sum + (s.stats?.codechef?.problemsSolved || 0), 0);
    const ratedStudents = students.filter((s) => (s.stats?.codechef?.rating || 0) > 0);
    const avgRating = ratedStudents.length
      ? Math.round(ratedStudents.reduce((sum, s) => sum + (s.stats?.codechef?.rating || 0), 0) / ratedStudents.length)
      : 0;

    const star4Plus = students.filter((s) => (s.stats?.codechef?.rating || 0) >= 1800).length;
    const star3 = students.filter((s) => (s.stats?.codechef?.rating || 0) >= 1600 && (s.stats?.codechef?.rating || 0) < 1800).length;
    const star2 = students.filter((s) => (s.stats?.codechef?.rating || 0) >= 1400 && (s.stats?.codechef?.rating || 0) < 1600).length;
    const star1 = students.filter((s) => (s.stats?.codechef?.rating || 0) > 0 && (s.stats?.codechef?.rating || 0) < 1400).length;
    const totalRated = (star4Plus + star3 + star2 + star1) || 1;

    const s4Pct = Math.round((star4Plus / totalRated) * 100);
    const s3Pct = Math.round((star3 / totalRated) * 100);
    const s2Pct = Math.round((star2 / totalRated) * 100);
    const s1Pct = Math.max(0, 100 - s4Pct - s3Pct - s2Pct);

    const topCC = [...students]
      .filter((s) => s.codechefUsername || (s.stats?.codechef?.problemsSolved || 0) > 0 || (s.stats?.codechef?.rating || 0) > 0)
      .sort((a, b) => (b.stats?.codechef?.rating || 0) - (a.stats?.codechef?.rating || 0) || (b.stats?.codechef?.problemsSolved || 0) - (a.stats?.codechef?.problemsSolved || 0))
      .slice(0, 8);

    return (
      <div className="deepdive-wrap">
        {/* Summary Card */}
        <div className="deepdive-summary">
          <div className="deepdive-kpi-card deepdive-kpi-card--cc">
            <span className="eyebrow eyebrow--cc">
              <img src="/codechef_logo.svg" alt="" className="deepdive-banner-logo" />
              <span>CODECHEF COMPETITIVE PROGRAMMING METRICS</span>
            </span>

            <div className="difficulty-pills-row">
              <div className="diff-pill diff-pill--hard" style={{ borderColor: "#7f1d1d" }}>
                <span className="diff-dot" style={{ background: "#7f1d1d" }} />
                <div>
                  <strong>{star4Plus}</strong>
                  <small>4★+ Expert ({s4Pct}%)</small>
                </div>
              </div>
              <div className="diff-pill diff-pill--easy" style={{ borderColor: "#b91c1c" }}>
                <span className="diff-dot" style={{ background: "#b91c1c" }} />
                <div>
                  <strong>{star3}</strong>
                  <small>3★ Lead ({s3Pct}%)</small>
                </div>
              </div>
              <div className="diff-pill diff-pill--medium" style={{ borderColor: "#dc2626" }}>
                <span className="diff-dot" style={{ background: "#dc2626" }} />
                <div>
                  <strong>{star2}</strong>
                  <small>2★ Achiever ({s2Pct}%)</small>
                </div>
              </div>
              <div className="diff-pill" style={{ borderColor: "#f87171" }}>
                <span className="diff-dot" style={{ background: "#f87171" }} />
                <div>
                  <strong>{star1}</strong>
                  <small>1★ Active ({s1Pct}%)</small>
                </div>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="ratio-bar">
              <div className="ratio-slice" style={{ width: `${s4Pct}%`, background: "#7f1d1d" }} title={`4★+: ${s4Pct}%`} />
              <div className="ratio-slice" style={{ width: `${s3Pct}%`, background: "#b91c1c" }} title={`3★: ${s3Pct}%`} />
              <div className="ratio-slice" style={{ width: `${s2Pct}%`, background: "#dc2626" }} title={`2★: ${s2Pct}%`} />
              <div className="ratio-slice" style={{ width: `${s1Pct}%`, background: "#f87171" }} title={`1★: ${s1Pct}%`} />
            </div>

            <div className="hr-stats-banner" style={{ marginTop: 14 }}>
              <div>
                <h3>{formatNumber(totalCC)}</h3>
                <small>Total Contest Problems Cleared</small>
              </div>
              <div className="hr-stat-pill">
                <span>Avg Rating of Active Coders: <b>{avgRating}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Solvers Grid */}
        <div className="top-solvers-section">
          <h4>
            <img src="/codechef_logo.svg" alt="" className="deepdive-section-logo" />
            <span>Top CodeChef Competitive Programmers</span>
          </h4>
          <div className="top-solvers-grid">
            {topCC.map((s, index) => (
              <div key={s._id || s.studentId || index} className="solver-card">
                <span className="solver-rank">#{index + 1}</span>
                <span className="avatar avatar--soft">{getInitials(s.name)}</span>
                <div className="solver-info">
                  <strong>{s.name}</strong>
                  <span>{s.branch} · {s.studentId}</span>
                </div>
                <div className="solver-metric solver-metric--cc">
                  <strong>{s.stats?.codechef?.rating || s.stats?.codechef?.problemsSolved || 0}</strong>
                  <small>{s.stats?.codechef?.rating ? "rating" : "solved"}</small>
                </div>
                <div className="solver-breakdown">
                  {s.stats?.codechef?.stars && (
                    <span className="cc-stars-badge">{s.stats.codechef.stars}</span>
                  )}
                  {s.stats?.codechef?.division && (
                    <span className="sec-tag">{s.stats.codechef.division}</span>
                  )}
                  <span className="pill-e">{s.stats?.codechef?.problemsSolved || 0} Solved</span>
                </div>
                {s.codechefUsername && (
                  <a
                    className="solver-link"
                    href={`https://www.codechef.com/users/${encodeURIComponent(s.codechefUsername)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src="/codechef_logo.svg" alt="" className="cell-mini-logo" /> @{s.codechefUsername} <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (platform === "geeksforgeeks") {
    const totalSolved = students.reduce((sum, s) => sum + (s.stats?.geeksforgeeks?.problemsSolved || 0), 0);
    const totalScore = students.reduce((sum, s) => sum + (s.stats?.geeksforgeeks?.score || 0), 0);
    const activeCoders = students.filter((s) => (s.stats?.geeksforgeeks?.problemsSolved || 0) > 0 || (s.stats?.geeksforgeeks?.score || 0) > 0);
    const avgScore = activeCoders.length
      ? Math.round(totalScore / activeCoders.length)
      : 0;

    const topGFG = [...students]
      .filter((s) => s.geeksforgeeksUsername || (s.stats?.geeksforgeeks?.problemsSolved || 0) > 0 || (s.stats?.geeksforgeeks?.score || 0) > 0)
      .sort((a, b) => (b.stats?.geeksforgeeks?.problemsSolved || 0) - (a.stats?.geeksforgeeks?.problemsSolved || 0) || (b.stats?.geeksforgeeks?.score || 0) - (a.stats?.geeksforgeeks?.score || 0))
      .slice(0, 8);

    return (
      <div className="deepdive-wrap">
        {/* Summary Card */}
        <div className="deepdive-summary">
          <div className="deepdive-kpi-card deepdive-kpi-card--gfg">
            <span className="eyebrow eyebrow--gfg">
              <img src="/gfg_logo.svg" alt="" className="deepdive-banner-logo" />
              <span>GEEKSFORGEEKS PRACTICE &amp; CODING SCORE METRICS</span>
            </span>

            <div className="difficulty-pills-row">
              <div className="diff-pill diff-pill--easy" style={{ borderColor: "#2f8d46" }}>
                <span className="diff-dot" style={{ background: "#2f8d46" }} />
                <div>
                  <strong>{formatNumber(totalSolved)}</strong>
                  <small>Total Problems Solved</small>
                </div>
              </div>
              <div className="diff-pill diff-pill--medium" style={{ borderColor: "#15803d" }}>
                <span className="diff-dot" style={{ background: "#15803d" }} />
                <div>
                  <strong>{formatNumber(totalScore)}</strong>
                  <small>Accumulated Coding Score</small>
                </div>
              </div>
              <div className="diff-pill" style={{ borderColor: "#4ade80" }}>
                <span className="diff-dot" style={{ background: "#4ade80" }} />
                <div>
                  <strong>{activeCoders.length}</strong>
                  <small>Active GFG Coders</small>
                </div>
              </div>
              <div className="diff-pill" style={{ borderColor: "#166534" }}>
                <span className="diff-dot" style={{ background: "#166534" }} />
                <div>
                  <strong>{avgScore}</strong>
                  <small>Avg Score / Active Student</small>
                </div>
              </div>
            </div>

            <div className="hr-stats-banner" style={{ marginTop: 14 }}>
              <div>
                <h3>{formatNumber(totalSolved)}</h3>
                <small>Campus Total Practice Questions Cleared</small>
              </div>
              <div className="hr-stat-pill">
                <span>Avg Coding Score: <b>{avgScore} pts</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Solvers Grid */}
        <div className="top-solvers-section">
          <h4>
            <img src="/gfg_logo.svg" alt="" className="deepdive-section-logo" />
            <span>Top GeeksforGeeks Problem Solvers</span>
          </h4>
          <div className="top-solvers-grid">
            {topGFG.map((s, index) => (
              <div key={s._id || s.studentId || index} className="solver-card">
                <span className="solver-rank">#{index + 1}</span>
                <span className="avatar avatar--soft">{getInitials(s.name)}</span>
                <div className="solver-info">
                  <strong>{s.name}</strong>
                  <span>{s.branch} · {s.studentId}</span>
                </div>
                <div className="solver-metric solver-metric--gfg">
                  <strong>{s.stats?.geeksforgeeks?.problemsSolved || s.stats?.geeksforgeeks?.score || 0}</strong>
                  <small>{s.stats?.geeksforgeeks?.problemsSolved ? "solved" : "score"}</small>
                </div>
                <div className="solver-breakdown">
                  <span className="pill-e">{s.stats?.geeksforgeeks?.problemsSolved || 0} Solved</span>
                  <span className="pill-m">{s.stats?.geeksforgeeks?.score || 0} Score</span>
                  {s.stats?.geeksforgeeks?.monthlyScore > 0 && (
                    <span className="sec-tag">{s.stats.geeksforgeeks.monthlyScore} Monthly</span>
                  )}
                </div>
                {s.geeksforgeeksUsername && (
                  <a
                    className="solver-link"
                    href={`https://www.geeksforgeeks.org/user/${encodeURIComponent(s.geeksforgeeksUsername)}/`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src="/gfg_logo.svg" alt="" className="cell-mini-logo" /> @{s.geeksforgeeksUsername} <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
