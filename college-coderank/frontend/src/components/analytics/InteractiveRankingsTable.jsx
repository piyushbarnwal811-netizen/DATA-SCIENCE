import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUpRight, Code2, Github, Trophy, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import RankBadge from "../RankBadge.jsx";
import { formatNumber, getInitials } from "../../utils/helpers.js";

export default function InteractiveRankingsTable({
  students = [],
  isAdmin = false,
  emptyMessage = "No students found matching current filters."
}) {
  const [sortField, setSortField] = useState("score");
  const [sortDir, setSortDir] = useState("desc");

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
        case "leetcode":
          valA = a.stats?.leetcode?.total ?? ((a.stats?.leetcode?.easy || 0) + (a.stats?.leetcode?.medium || 0) + (a.stats?.leetcode?.hard || 0));
          valB = b.stats?.leetcode?.total ?? ((b.stats?.leetcode?.easy || 0) + (b.stats?.leetcode?.medium || 0) + (b.stats?.leetcode?.hard || 0));
          break;
        case "codechef":
          valA = a.stats?.codechef?.rating ?? (a.stats?.codechef?.problemsSolved ?? 0);
          valB = b.stats?.codechef?.rating ?? (b.stats?.codechef?.problemsSolved ?? 0);
          break;
        case "github":
          valA = a.stats?.github?.publicRepos ?? 0;
          valB = b.stats?.github?.publicRepos ?? 0;
          break;
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
    <div className="table-scroll">
      <table className="ranking-table ranking-table--modern">
        <thead>
          <tr>
            <th onClick={() => handleSort("rank")} className="th-clickable" style={{ width: 50 }}>
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
            <th onClick={() => handleSort("hackerrank")} className="th-clickable th-platform th-platform--hr">
              <span className="th-with-logo">
                <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="th-logo" />
                <span>HackerRank_Solved</span>
              </span>
              {renderSortIndicator("hackerrank")}
            </th>
            <th onClick={() => handleSort("leetcode")} className="th-clickable th-platform th-platform--lc">
              <span className="th-with-logo">
                <img src="/leetcode_logo.jpeg" alt="LeetCode" className="th-logo" />
                <span>LeetCode_Solved</span>
              </span>
              {renderSortIndicator("leetcode")}
            </th>
            <th onClick={() => handleSort("codechef")} className="th-clickable th-platform th-platform--cc">
              <span className="th-with-logo">
                <img src="/codechef_logo.svg" alt="CodeChef" className="th-logo" />
                <span>CodeChef_Rating</span>
              </span>
              {renderSortIndicator("codechef")}
            </th>
            <th onClick={() => handleSort("github")} className="th-clickable th-platform th-platform--gh">
              <span className="th-with-logo">
                <img src="/github_logo.jpeg" alt="GitHub" className="th-logo" />
                <span>GitHub_Repositories</span>
              </span>
              {renderSortIndicator("github")}
            </th>
            <th onClick={() => handleSort("score")} className="th-clickable right th-score">
              <span>Overall_Performance_Score</span> {renderSortIndicator("score")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.length === 0 ? (
            <tr>
              <td colSpan={9} className="table-empty-cell">
                <div className="empty-state">
                  <span className="empty-state__icon"><Trophy size={22} /></span>
                  <strong>{emptyMessage}</strong>
                </div>
              </td>
            </tr>
          ) : (
            sortedStudents.map((student, idx) => {
              const displayRank = student.rank ?? idx + 1;
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
                        title={`View ${student.name}'s profile`}
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
                  <td className="td-platform td-hr">
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
                  <td className="td-platform td-lc">
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
                  <td className="td-platform td-cc">
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

                  {/* GitHub Repositories */}
                  <td className="td-platform td-gh">
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
                  <td className="right td-score">
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
  );
}
