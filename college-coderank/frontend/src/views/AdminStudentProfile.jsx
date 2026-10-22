"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  FileSpreadsheet,
  Github,
  RefreshCw,
  Trash2,
  Trophy,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Loader from "../components/Loader.jsx";
import RecentSolvedProblems from "../components/RecentSolvedProblems.jsx";
import StatCard from "../components/StatCard.jsx";
import StudentPlatformStandings from "../components/StudentPlatformStandings.jsx";
import api, { errorMessage } from "../services/api.js";
import { useRealtimeSync } from "../services/realtime.js";
import { formatNumber, getInitials } from "../utils/helpers.js";

export default function AdminStudentProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [positions, setPositions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfile = useCallback(async () => {
    const { data } = await api.get(`/students/${encodeURIComponent(id)}`);
    setStudent(data.student);
    if (data.positions) setPositions(data.positions);
  }, [id]);

  useEffect(() => {
    let active = true;
    api.get(`/students/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (active) {
          setStudent(data.student);
          if (data.positions) setPositions(data.positions);
        }
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Real-time live auto-update listener
  const { connected } = useRealtimeSync({
    onStudentUpdated: (payload) => {
      if (payload.studentId === id || payload.email === student?.email) {
        loadProfile().catch(() => {});
        setNotice(`Profile updated live in real time! Score: ${payload.score} pts.`);
        setTimeout(() => setNotice(""), 5000);
      }
    }
  });

  const syncStudent = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post(`/students/${encodeURIComponent(id)}/sync`);
      setStudent(data.student);
      setNotice(
        data.errors?.length
          ? `Synced with notices: ${data.errors.join(", ")}`
          : "All platform handles updated from the latest live data."
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const handleExportStudent = async () => {
    if (!student) return;
    setExporting(true);
    setError("");
    try {
      const response = await api.get(`/students/${encodeURIComponent(id)}/export`, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = student.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.setAttribute("download", `${safeName}_CodeRank_Profile_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setNotice(`Exported ${student.name}'s information as Excel sheet (.xlsx).`);
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not export student report."));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!window.confirm(
      `Permanently delete ${student.name} and all of their saved coding stats and history? This cannot be undone.`
    )) return;

    setDeleting(true);
    setError("");
    try {
      await api.delete(`/admin/students/${encodeURIComponent(id)}`);
      router.replace("/admin");
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not delete this student."));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader label="Loading student profile..." />;
  if (!student) {
    return (
      <>
        <Link className="back-link" href="/leaderboard">
          <ArrowLeft size={15} /> Back to leaderboard
        </Link>
        <div className="inline-error" role="alert">{error || "Student profile not found."}</div>
      </>
    );
  }

  const stats = student.stats ?? {};

  return (
    <>
      <div className="profile-header-actions">
        <Link className="back-link" href="/leaderboard">
          <ArrowLeft size={15} /> Back to leaderboard
        </Link>
        <div className="live-status-pill">
          <span className={`live-dot ${connected ? "is-active" : ""}`} />
          <small>{connected ? "Live sync active" : "Connecting..."}</small>
        </div>
      </div>

      <div className="page-intro">
        <span className="eyebrow">STUDENT CODING PROFILE</span>
        <div className="page-intro__line">
          <div>
            <h1>{student.name}</h1>
            <p>{student.branch} · Section {student.section} · Year {student.year}</p>
          </div>
          <span className="page-intro__icon"><UserRound size={25} /></span>
        </div>
      </div>

      <section className="profile-hero section-card">
        <div className="profile-cover" />
        <div className="profile-main">
          <span className="avatar avatar--profile">{getInitials(student.name)}</span>
          <div className="profile-name">
            <h2>{student.name}</h2>
            <span>{student.email}</span>
            <small>{student.studentId || "No roll number added"}</small>
          </div>
          <div className="profile-hero__right">
            <div className="profile-rank">
              <Trophy size={16} />
              <span>Campus score</span>
              <strong>{formatNumber(student.score)} <small>pts</small></strong>
            </div>
            <button
              type="button"
              className="button button--excel button--compact"
              onClick={handleExportStudent}
              disabled={exporting || deleting}
              title="Download this student's complete information into Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>{exporting ? "Exporting..." : "Export Excel (.xlsx)"}</span>
            </button>
            <button
              type="button"
              className="button button--danger button--compact"
              onClick={handleDeleteStudent}
              disabled={deleting || busy}
              title="Permanently delete this student and all saved history"
            >
              <Trash2 size={15} />
              <span>{deleting ? "Deleting..." : "Delete student"}</span>
            </button>
          </div>
        </div>
      </section>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {notice && <div className="inline-success" role="status">{notice}</div>}

      {/* Multi-Platform Campus Positions & Rankings */}
      <StudentPlatformStandings student={student} positions={positions} />

      <div className="stats-grid stats-grid--four">
        <StatCard icon={Code2} label="Problems solved" value={formatNumber(stats.leetcode?.total)} note="Accepted problems" />
        <StatCard icon={Code2} label="Easy solved" value={formatNumber(stats.leetcode?.easy)} note="LeetCode" />
        <StatCard icon={Code2} label="Medium solved" value={formatNumber(stats.leetcode?.medium)} note="LeetCode" tone="orange" />
        <StatCard icon={Code2} label="Hard solved" value={formatNumber(stats.leetcode?.hard)} note="LeetCode" tone="peach" />
        <StatCard icon={Code2} label="CodeChef Rating" value={stats.codechef?.rating ? formatNumber(stats.codechef.rating) : "—"} note={stats.codechef?.stars ? `${stats.codechef.stars} · ${stats.codechef.division || "Rated"}` : "Unrated"} tone="peach" />
        <StatCard icon={Code2} label="CodeChef Solved" value={formatNumber(stats.codechef?.problemsSolved)} note="Contest problems" tone="orange" />
        <StatCard icon={Code2} label="GFG Solved" value={formatNumber(stats.geeksforgeeks?.problemsSolved)} note={stats.geeksforgeeks?.instituteRank ? `Inst. Rank #${stats.geeksforgeeks.instituteRank}` : "GeeksforGeeks"} tone="peach" />
        <StatCard icon={Code2} label="GFG Score" value={formatNumber(stats.geeksforgeeks?.score)} note="Coding score" tone="orange" />
        <StatCard icon={Github} label="Public repositories" value={formatNumber(stats.github?.publicRepos)} note={`${formatNumber(stats.github?.followers)} followers`} tone="purple" />
        <StatCard icon={Code2} label="HackerRank points" value={formatNumber(stats.hackerrank?.points)} note="Public score" tone="orange" />
      </div>

      <section className="section-card profile-links-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONNECTED PLATFORMS</span>
            <h2>Student handles</h2>
          </div>
          <button
            className="button button--subtle"
            onClick={syncStudent}
            disabled={busy || deleting || (!student.leetcodeUsername && !student.githubUsername && !student.hackerrankUsername && !student.codechefUsername && !student.geeksforgeeksUsername)}
          >
            <RefreshCw size={15} className={busy ? "spin" : ""} />
            {busy ? "Updating all..." : "Refresh all stats"}
          </button>
        </div>
        <div className="platform-handles">
          <span>
            <img src="/leetcode_logo.jpeg" alt="LeetCode" className="admin-handle-logo" />
            <span>LeetCode</span>
            <strong>{student.leetcodeUsername || "Not connected"}</strong>
            {student.leetcodeUsername && (
              <a
                href={`https://leetcode.com/u/${encodeURIComponent(student.leetcodeUsername)}/`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open LeetCode profile"
              >
                <ArrowUpRight size={14} />
              </a>
            )}
          </span>
          <span>
            <img src="/codechef_logo.svg" alt="CodeChef" className="admin-handle-logo" />
            <span>CodeChef</span>
            <strong>{student.codechefUsername || "Not connected"}</strong>
            {student.codechefUsername && (
              <a
                href={`https://www.codechef.com/users/${encodeURIComponent(student.codechefUsername)}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open CodeChef profile"
              >
                <ArrowUpRight size={14} />
              </a>
            )}
          </span>
          <span>
            <img src="/gfg_logo.svg" alt="GeeksforGeeks" className="admin-handle-logo" />
            <span>GeeksforGeeks</span>
            <strong>{student.geeksforgeeksUsername || "Not connected"}</strong>
            {student.geeksforgeeksUsername && (
              <a
                href={`https://www.geeksforgeeks.org/user/${encodeURIComponent(student.geeksforgeeksUsername)}/`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open GeeksforGeeks profile"
              >
                <ArrowUpRight size={14} />
              </a>
            )}
          </span>
          <span>
            <img src="/github_logo.jpeg" alt="GitHub" className="admin-handle-logo" />
            <span>GitHub</span>
            <strong>{student.githubUsername || "Not connected"}</strong>
            {student.githubUsername && (
              <a
                href={`https://github.com/${encodeURIComponent(student.githubUsername)}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open GitHub profile"
              >
                <ArrowUpRight size={14} />
              </a>
            )}
          </span>
          <span>
            <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="admin-handle-logo" />
            <span>HackerRank</span>
            <strong>{student.hackerrankUsername || "Not connected"}</strong>
            {student.hackerrankUsername && (
              <a
                href={`https://www.hackerrank.com/profile/${encodeURIComponent(student.hackerrankUsername)}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open HackerRank profile"
              >
                <ArrowUpRight size={14} />
              </a>
            )}
          </span>
          <small>
            Last updated: {stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString() : "not synced yet"}
          </small>
        </div>
      </section>

      <RecentSolvedProblems problems={stats.recentAccepted ?? []} />
    </>
  );
}
