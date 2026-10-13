import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, ArrowUpRight, Flame, Trophy, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import RankBadge from "../RankBadge.jsx";
import { formatNumber, getInitials } from "../../utils/helpers.js";

const platformTitles = {
  leetcode: "LeetCode Campus Leaderboard",
  codechef: "CodeChef Competitive Leaderboard",
  geeksforgeeks: "GeeksforGeeks Campus Leaderboard",
  hackerrank: "HackerRank Practice Leaderboard",
  github: "GitHub Repositories Leaderboard"
};

const platformMetricDescriptions = {
  leetcode: "total accepted problems solved (Hard · Medium · Easy)",
  codechef: "official contest rating and problems cleared",
  geeksforgeeks: "total problems solved and overall coding score",
  hackerrank: "problems solved and earned contest points",
  github: "public open-source repositories and stars"
};

export default function InteractiveRankingsTable({
  students = [],
  isAdmin = false,
  emptyMessage = "No students found matching current filters.",
  selectedPlatform = "all",
  onSelectPlatform
}) {
  const [activePlatform, setActivePlatform] = useState(selectedPlatform || "all");
  const [sortField, setSortField] = useState("score");
  const [sortDir, setSortDir] = useState("desc");

  // Keep activePlatform in sync when changed by parent (e.g. top tabs)
  useEffect(() => {
    if (selectedPlatform && selectedPlatform !== activePlatform) {
      setActivePlatform(selectedPlatform);
      if (selectedPlatform === "all") {
        setSortField("score");
        setSortDir("desc");
      } else {
        setSortField(selectedPlatform);
        setSortDir("desc");
      }
    }
  }, [selectedPlatform]);

  const handlePlatformChange = (p) => {
    setActivePlatform(p);
    if (onSelectPlatform) onSelectPlatform(p);
    if (p === "all") {
      setSortField("score");
      setSortDir("desc");
    } else {
      setSortField(p);
      setSortDir("desc");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let valA, valB;

      switch (sortField) {
        case "rank":
          valA = a.rank ?? 0;
          valB = b.rank ?? 0;
          break;
        case "studentId":
          valA = (a.studentId || "").toLowerCase();
          valB = (b.studentId || "").toLowerCase();
          break;
        case "name":
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
          break;
        case "branch":
          valA = (a.branch || "").toLowerCase();
          valB = (b.branch || "").toLowerCase();
          break;
        case "hackerrank":
          valA = a.stats?.hackerrank?.solved ?? (a.stats?.hackerrank?.points ? Math.round(a.stats.hackerrank.points / 10) : 0);
          valB = b.stats?.hackerrank?.solved ?? (b.stats?.hackerrank?.points ? Math.round(b.stats.hackerrank.points / 10) : 0);
          break;
        case "leetcode": {
          const totalA = a.stats?.leetcode?.total ?? ((a.stats?.leetcode?.easy || 0) + (a.stats?.leetcode?.medium || 0) + (a.stats?.leetcode?.hard || 0));
          const totalB = b.stats?.leetcode?.total ?? ((b.stats?.leetcode?.easy || 0) + (b.stats?.leetcode?.medium || 0) + (b.stats?.leetcode?.hard || 0));
          valA = totalA * 1000 + (a.stats?.leetcode?.hard || 0) * 10 + (a.stats?.leetcode?.medium || 0);
          valB = totalB * 1000 + (b.stats?.leetcode?.hard || 0) * 10 + (b.stats?.leetcode?.medium || 0);
          break;
        }
        case "codechef": {
          const rateA = a.stats?.codechef?.rating || 0;
          const rateB = b.stats?.codechef?.rating || 0;
          valA = rateA * 10000 + (a.stats?.codechef?.problemsSolved || 0);
          valB = rateB * 10000 + (b.stats?.codechef?.problemsSolved || 0);
          break;
        }
        case "geeksforgeeks": {
          const solA = a.stats?.geeksforgeeks?.problemsSolved || 0;
          const solB = b.stats?.geeksforgeeks?.problemsSolved || 0;
          valA = solA * 10000 + (a.stats?.geeksforgeeks?.score || 0);
          valB = solB * 10000 + (b.stats?.geeksforgeeks?.score || 0);
          break;
        }
        case "github": {
          const reposA = a.stats?.github?.publicRepos || 0;
          const reposB = b.stats?.github?.publicRepos || 0;
          valA = reposA * 1000 + (a.stats?.github?.followers || 0);
          valB = reposB * 1000 + (b.stats?.github?.followers || 0);
          break;
        }
        case "score":
        default:
          valA = Number(a.score) || 0;
          valB = Number(b.score) || 0;
          break;
      }

      if (typeof valA === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
  }, [students, sortField, sortDir]);

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={11} className="sort-icon sort-icon--idle" />;
    }
    return <span className="sort-icon sort-icon--active">{sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div className="table-wrapper-outer">
      {/* Platform Leaderboard Selector Bar */}
      <div className="platform-leaderboard-bar">
        <div className="platform-selector-tabs" role="tablist" aria-label="Select Platform Leaderboard">
          <button
            type="button"
            className={`platform-selector-btn ${activePlatform === "all" ? "is-active" : ""}`}
            onClick={() => handlePlatformChange("all")}
          >
            <Trophy size={14} />
            <span>Overall Leaderboard</span>
          </button>
          <button
            type="button"
            className={`platform-selector-btn ${activePlatform === "leetcode" ? "is-active" : ""}`}
            onClick={() => handlePlatformChange("leetcode")}
          >
            <img src="/leetcode_logo.jpeg" alt="" className="platform-selector-logo" />
            <span>LeetCode Leaderboard</span>
          </button>
          <button
            type="button"
            className={`platform-selector-btn ${activePlatform === "codechef" ? "is-active" : ""}`}
            onClick={() => handlePlatformChange("codechef")}
          >
            <img src="/codechef_logo.svg" alt="" className="platform-selector-logo" />
            <span>CodeChef Leaderboard</span>
          </button>
          <button
            type="button"
            className={`platform-selector-btn ${activePlatform === "geeksforgeeks" ? "is-active" : ""}`}
            onClick={() => handlePlatformChange("geeksforgeeks")}
          >
            <img src="/gfg_logo.svg" alt="" className="platform-selector-logo" />
            <span>GeeksforGeeks Leaderboard</span>
          </button>
          <button
            type="button"
            className={`platform-selector-btn ${activePlatform === "hackerrank" ? "is-active" : ""}`}
            onClick={() => handlePlatformChange("hackerrank")}
          >
            <img src="/hackerrank_logo.jpeg" alt="" className="platform-selector-logo" />
            <span>HackerRank Leaderboard</span>
          </button>
          <button
            type="button"
            className={`platform-selector-btn ${activePlatform === "github" ? "is-active" : ""}`}
            onClick={() => handlePlatformChange("github")}
          >
            <img src="/github_logo.jpeg" alt="" className="platform-selector-logo" />
            <span>GitHub Leaderboard</span>
          </button>
        </div>

        {activePlatform !== "all" && (
          <div className="platform-active-banner">
            <span className="platform-active-banner-info">
              <Flame size={14} />
              <span>
                Viewing dedicated <strong>{platformTitles[activePlatform]}</strong> · Students ranked #1 to #{sortedStudents.length} based on {platformMetricDescriptions[activePlatform]}
              </span>
            </span>
            <button
              type="button"
              className="platform-reset-btn"
              onClick={() => handlePlatformChange("all")}
            >
              Reset to Overall Leaderboard
            </button>
          </div>
        )}
      </div>

      <div className="table-scroll">
        <table className="ranking-table ranking-table--modern">
          <thead>
            <tr>
              <th onClick={() => handleSort("rank")} className="th-clickable" style={{ width: 55 }}>
                <span>#</span> {renderSortIndicator("rank")}
              </th>
              <th onClick={() => handleSort("studentId")} className="th-clickable">
                <span>Student_ID</span> {renderSortIndicator("studentId")}
              </th>
              <th onClick={() => handleSort("name")} className="th-clickable">
                <span>Student_Name</span> {renderSortIndicator("name")}
              </th>
              <th onClick={() => handleSort("branch")} className="th-clickable">
                <span>Department</span> {renderSortIndicator("branch")}
              </th>
              <th
                onClick={() => handleSort("hackerrank")}
                className={`th-clickable th-platform th-platform--hr ${activePlatform === "hackerrank" ? "is-platform-focused" : ""}`}
              >
                <span className="th-with-logo">
                  <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="th-logo" />
                  <span>HackerRank_Solved</span>
                  {activePlatform === "hackerrank" && <span className="platform-active-chip">RANKING</span>}
                </span>
                {renderSortIndicator("hackerrank")}
              </th>
              <th
                onClick={() => handleSort("leetcode")}
                className={`th-clickable th-platform th-platform--lc ${activePlatform === "leetcode" ? "is-platform-focused" : ""}`}
              >
                <span className="th-with-logo">
                  <img src="/leetcode_logo.jpeg" alt="LeetCode" className="th-logo" />
                  <span>LeetCode_Solved</span>
                  {activePlatform === "leetcode" && <span className="platform-active-chip">RANKING</span>}
                </span>
                {renderSortIndicator("leetcode")}
              </th>
              <th
                onClick={() => handleSort("codechef")}
                className={`th-clickable th-platform th-platform--cc ${activePlatform === "codechef" ? "is-platform-focused" : ""}`}
              >
                <span className="th-with-logo">
                  <img src="/codechef_logo.svg" alt="CodeChef" className="th-logo" />
                  <span>CodeChef_Rating</span>
                  {activePlatform === "codechef" && <span className="platform-active-chip">RANKING</span>}
                </span>
                {renderSortIndicator("codechef")}
              </th>
              <th
                onClick={() => handleSort("geeksforgeeks")}
                className={`th-clickable th-platform th-platform--gfg ${activePlatform === "geeksforgeeks" ? "is-platform-focused" : ""}`}
              >
                <span className="th-with-logo">
                  <img src="/gfg_logo.svg" alt="GeeksforGeeks" className="th-logo" />
                  <span>GeeksforGeeks_Solved</span>
                  {activePlatform === "geeksforgeeks" && <span className="platform-active-chip">RANKING</span>}
                </span>
                {renderSortIndicator("geeksforgeeks")}
              </th>
              <th
                onClick={() => handleSort("github")}
                className={`th-clickable th-platform th-platform--gh ${activePlatform === "github" ? "is-platform-focused" : ""}`}
              >
                <span className="th-with-logo">
                  <img src="/github_logo.jpeg" alt="GitHub" className="th-logo" />
                  <span>GitHub_Repositories</span>
                  {activePlatform === "github" && <span className="platform-active-chip">RANKING</span>}
                </span>
                {renderSortIndicator("github")}
              </th>
              <th
                onClick={() => handleSort("score")}
                className={`th-clickable right th-score ${activePlatform === "all" ? "is-platform-focused" : ""}`}
              >
                <span>
                  Overall_Performance_Score
                  {activePlatform === "all" && <span className="platform-active-chip">RANKING</span>}
                </span>{" "}
                {renderSortIndicator("score")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={10} className="table-empty-cell">
                  <div className="empty-state">
                    <span className="empty-state__icon"><Trophy size={22} /></span>
                    <strong>{emptyMessage}</strong>
                  </div>
                </td>
              </tr>
            ) : (
              sortedStudents.map((student, idx) => {
                // When on a specific platform leaderboard, rank is their position on this platform (idx + 1)
                const displayRank = activePlatform === "all" ? (student.rank ?? idx + 1) : (idx + 1);
                const hrSolved = student.stats?.hackerrank?.solved ?? 
                  (student.stats?.hackerrank?.points ? Math.round(student.stats.hackerrank.points / 10) : 0);
                const lcTotal = student.stats?.leetcode?.total ?? 
                  ((student.stats?.leetcode?.easy || 0) + (student.stats?.leetcode?.medium || 0) + (student.stats?.leetcode?.hard || 0));
                const ghRepos = student.stats?.github?.publicRepos ?? 0;
                const overallScore = Number(student.score) || 0;

                return (
                  <tr key={student._id || student.studentId || idx} className={`rank-row rank-row--${displayRank}`}>
                    {/* Rank */}
                    <td className="td-rank">
                      <RankBadge rank={displayRank} />
                    </td>

                    {/* Student ID */}
                    <td className="td-id">
                      <span className="student-id-chip">
                        {student.studentId || "—"}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="td-name">
                      {isAdmin && student._id ? (
                        <Link
                          className="table-student table-student--link"
                          to={`/admin/students/${student._id}`}
                          title={`View ${student.name}'s profile and platform positions`}
                        >
                          <span className="avatar avatar--soft">{getInitials(student.name)}</span>
                          <span>
                            <strong>{student.name}</strong>
                            <small>View Dossier <UserRound size={9} /></small>
                          </span>
                        </Link>
                      ) : (
                        <div className="table-student">
                          <span className="avatar avatar--soft">{getInitials(student.name)}</span>
                          <span>
                            <strong>{student.name}</strong>
                            <small className="student-year-tag">
                              {student.year ? `${student.year}${student.year === 1 ? "st" : student.year === 2 ? "nd" : student.year === 3 ? "rd" : "th"} Year` : "Student"}
                            </small>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Department / Branch */}
                    <td className="td-dept">
                      <span className="dept-badge">{student.branch}</span>
                      {student.section && (
                        <span className="sec-tag">Sec {student.section}</span>
                      )}
                    </td>

                    {/* HackerRank Solved */}
                    <td className={`td-platform td-hr ${activePlatform === "hackerrank" ? "is-platform-focused" : ""}`}>
                      <div className="platform-cell">
                        <strong className="platform-val platform-val--purple">{formatNumber(hrSolved)}</strong>
                        {student.hackerrankUsername ? (
                          <a
                            className="platform-sublink"
                            href={`https://www.hackerrank.com/profile/${encodeURIComponent(student.hackerrankUsername)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open HackerRank profile"
                          >
                            <img src="/hackerrank_logo.jpeg" alt="" className="cell-mini-logo" />
                            <span>@{student.hackerrankUsername}</span>
                            <ArrowUpRight size={10} />
                          </a>
                        ) : (
                          <small className="platform-sublabel">solved</small>
                        )}
                      </div>
                    </td>

                    {/* LeetCode Solved */}
                    <td className={`td-platform td-lc ${activePlatform === "leetcode" ? "is-platform-focused" : ""}`}>
                      <div className="platform-cell">
                        <strong className="platform-val platform-val--lc">
                          <img src="/leetcode_logo.jpeg" alt="" className="cell-mini-logo" style={{ verticalAlign: "middle", marginRight: 4 }} />
                          {formatNumber(lcTotal)}
                        </strong>
                        <small className="lc-breakdown-sub">
                          <span className="pill-e">{student.stats?.leetcode?.easy || 0}E</span>
                          <span className="pill-m">{student.stats?.leetcode?.medium || 0}M</span>
                          <span className="pill-h">{student.stats?.leetcode?.hard || 0}H</span>
                        </small>
                      </div>
                    </td>

                    {/* CodeChef Rating & Solved */}
                    <td className={`td-platform td-cc ${activePlatform === "codechef" ? "is-platform-focused" : ""}`}>
                      <div className="platform-cell">
                        <strong className="platform-val platform-val--cc">
                          <img src="/codechef_logo.svg" alt="" className="cell-mini-logo" style={{ verticalAlign: "middle", marginRight: 4 }} />
                          {student.stats?.codechef?.rating ? formatNumber(student.stats.codechef.rating) : (student.stats?.codechef?.problemsSolved ? `${formatNumber(student.stats.codechef.problemsSolved)} sol` : "—")}
                        </strong>
                        {student.codechefUsername ? (
                          <a
                            className="platform-sublink"
                            href={`https://www.codechef.com/users/${encodeURIComponent(student.codechefUsername)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open CodeChef profile"
                          >
                            {student.stats?.codechef?.stars && (
                              <span className="cc-stars-badge">{student.stats.codechef.stars}</span>
                            )}
                            <span>@{student.codechefUsername}</span>
                            <ArrowUpRight size={10} />
                          </a>
                        ) : (
                          <small className="platform-sublabel">
                            {student.stats?.codechef?.problemsSolved ? `${student.stats.codechef.problemsSolved} solved` : "unrated"}
                          </small>
                        )}
                      </div>
                    </td>

                    {/* GeeksforGeeks Solved & Score */}
                    <td className={`td-platform td-gfg ${activePlatform === "geeksforgeeks" ? "is-platform-focused" : ""}`}>
                      <div className="platform-cell">
                        <strong className="platform-val platform-val--gfg">
                          <img src="/gfg_logo.svg" alt="" className="cell-mini-logo" style={{ verticalAlign: "middle", marginRight: 4 }} />
                          {student.stats?.geeksforgeeks?.problemsSolved ? formatNumber(student.stats.geeksforgeeks.problemsSolved) : (student.stats?.geeksforgeeks?.score ? `${formatNumber(student.stats.geeksforgeeks.score)} pts` : "—")}
                        </strong>
                        {student.geeksforgeeksUsername ? (
                          <a
                            className="platform-sublink"
                            href={`https://www.geeksforgeeks.org/user/${encodeURIComponent(student.geeksforgeeksUsername)}/`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open GeeksforGeeks profile"
                          >
                            <span>@{student.geeksforgeeksUsername}</span>
                            <ArrowUpRight size={10} />
                          </a>
                        ) : (
                          <small className="platform-sublabel">
                            {student.stats?.geeksforgeeks?.score ? `${student.stats.geeksforgeeks.score} score` : "no handle"}
                          </small>
                        )}
                      </div>
                    </td>

                    {/* GitHub Repositories */}
                    <td className={`td-platform td-gh ${activePlatform === "github" ? "is-platform-focused" : ""}`}>
                      <div className="platform-cell">
                        <strong className="platform-val platform-val--green">{formatNumber(ghRepos)}</strong>
                        {student.githubUsername ? (
                          <a
                            className="platform-sublink"
                            href={`https://github.com/${encodeURIComponent(student.githubUsername)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open GitHub profile"
                          >
                            <img src="/github_logo.jpeg" alt="" className="cell-mini-logo" />
                            <span>@{student.githubUsername}</span>
                            <ArrowUpRight size={10} />
                          </a>
                        ) : (
                          <small className="platform-sublabel">repos</small>
                        )}
                      </div>
                    </td>

                    {/* Overall Performance Score */}
                    <td className={`right td-score ${activePlatform === "all" ? "is-platform-focused" : ""}`}>
                      <div className="score-cell">
                        <strong className="overall-score-val">{overallScore.toFixed(1)}</strong>
                        <div className="score-meter">
                          <div
                            className="score-meter-fill"
                            style={{ width: `${Math.min(100, Math.round((overallScore / 300) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
