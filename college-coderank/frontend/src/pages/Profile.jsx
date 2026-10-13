import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Code2,
  FileSpreadsheet,
  Github,
  RefreshCw,
  Save,
  Trophy,
  UserRound
} from "lucide-react";
import Loader from "../components/Loader.jsx";
import RecentSolvedProblems from "../components/RecentSolvedProblems.jsx";
import StatCard from "../components/StatCard.jsx";
import StudentPlatformStandings from "../components/StudentPlatformStandings.jsx";
import api, { errorMessage } from "../services/api.js";
import { useRealtimeSync } from "../services/realtime.js";
import { formatNumber, getInitials } from "../utils/helpers.js";

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [positions, setPositions] = useState(null);
  const [handles, setHandles] = useState({ leetcodeUsername: "", githubUsername: "", hackerrankUsername: "", codechefUsername: "", geeksforgeeksUsername: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadProfile = ({ updateHandles = true } = {}) =>
    api.get("/students/me").then(({ data }) => {
      setStudent(data.student);
      if (data.positions) setPositions(data.positions);
      if (updateHandles) {
        setHandles({
          leetcodeUsername: data.student.leetcodeUsername ?? "",
          githubUsername: data.student.githubUsername ?? "",
          hackerrankUsername: data.student.hackerrankUsername ?? "",
          codechefUsername: data.student.codechefUsername ?? "",
          geeksforgeeksUsername: data.student.geeksforgeeksUsername ?? ""
        });
      }
    });

  useEffect(() => {
    let active = true;
    loadProfile()
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Real-time live auto-update listener
  const { connected } = useRealtimeSync({
    onStudentUpdated: (payload) => {
      if (student && (payload.studentId === student._id || payload.email === student.email)) {
        loadProfile({ updateHandles: false }).catch(() => {});
        setNotice(`Live update received! Campus score is now ${payload.score} pts.`);
        setTimeout(() => setNotice(""), 6000);
      }
    }
  });

  const saveHandles = async (event) => {
    event.preventDefault();
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const { data } = await api.patch("/students/me", handles);
      setStudent(data.student);
      setNotice(
        data.errors && data.errors.length
          ? `Profile saved. Sync notice: ${data.errors.join("; ")}`
          : "Profile links saved & platform stats synchronized!"
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const syncStats = async () => {
    setBusy("sync");
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/students/me/sync");
      setStudent(data.student);
      setNotice(data.errors.length ? data.errors.join(" ") : "All platform coding stats are up to date!");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleExportReport = async () => {
    if (!student) return;
    setExporting(true);
    setError("");
    try {
      const response = await api.get("/students/me/export", { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = student.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.setAttribute("download", `${safeName}_CodeRank_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setNotice("Your profile report has been downloaded as an Excel spreadsheet (.xlsx).");
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not download Excel report."));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Loader label="Loading your profile..." />;
  if (!student) return <div className="inline-error">{error || "We couldn't load your profile."}</div>;
  const stats = student.stats ?? {};

  return (
    <>
      <div className="page-intro">
        <div className="page-intro__header">
          <span className="eyebrow">YOUR CODING JOURNEY</span>
          <div className="live-status-pill" title="Real-time push updates active">
            <span className={`live-dot ${connected ? "is-active" : ""}`} />
            <small>{connected ? "Auto-sync connected" : "Connecting..."}</small>
          </div>
        </div>
        <div className="page-intro__line">
          <div>
            <h1>My profile</h1>
            <p>Your progress across LeetCode, CodeChef, GeeksforGeeks, GitHub, and HackerRank in real time.</p>
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
            <span>{student.branch} · Section {student.section} · Year {student.year}</span>
            <small>{student.studentId || student.email}</small>
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
              onClick={handleExportReport}
              disabled={exporting}
              title="Download your full profile data and solved questions in Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>{exporting ? "Downloading..." : "Export report (.xlsx)"}</span>
            </button>
          </div>
        </div>
      </section>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {notice && <div className="inline-success" role="status"><Check size={16} />{notice}</div>}

      {/* Multi-Platform Campus Positions & Rankings */}
      <StudentPlatformStandings student={student} positions={positions} />

      <div className="stats-grid stats-grid--four">
        <StatCard icon={Code2} label="Problems solved" value={formatNumber(stats.leetcode?.total)} note="LeetCode" />
        <StatCard icon={Code2} label="Easy solved" value={formatNumber(stats.leetcode?.easy)} note="Keep going" tone="orange" />
        <StatCard icon={Code2} label="Medium solved" value={formatNumber(stats.leetcode?.medium)} note="LeetCode" tone="peach" />
        <StatCard icon={Code2} label="Hard solved" value={formatNumber(stats.leetcode?.hard)} note="LeetCode" tone="orange" />
        <StatCard icon={Code2} label="CodeChef Rating" value={stats.codechef?.rating ? formatNumber(stats.codechef.rating) : "—"} note={stats.codechef?.stars ? `${stats.codechef.stars} · ${stats.codechef.division || "Rated"}` : "Unrated"} tone="peach" />
        <StatCard icon={Code2} label="CodeChef Solved" value={formatNumber(stats.codechef?.problemsSolved)} note="Contest challenges" tone="orange" />
        <StatCard icon={Code2} label="GFG Solved" value={formatNumber(stats.geeksforgeeks?.problemsSolved)} note={stats.geeksforgeeks?.instituteRank ? `Inst. Rank #${stats.geeksforgeeks.instituteRank}` : "GeeksforGeeks"} tone="peach" />
        <StatCard icon={Code2} label="GFG Score" value={formatNumber(stats.geeksforgeeks?.score)} note="Coding score" tone="orange" />
        <StatCard icon={Github} label="Public repositories" value={formatNumber(stats.github?.publicRepos)} note={`${formatNumber(stats.github?.followers)} followers`} tone="purple" />
        <StatCard icon={Code2} label="HackerRank points" value={formatNumber(stats.hackerrank?.points)} note="Public score" tone="orange" />
      </div>

      <section className="section-card profile-links-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CONNECT YOUR CRAFT</span>
            <h2>Platform profiles</h2>
          </div>
          <div className="heading-actions">
            <button className="button button--subtle" onClick={syncStats} disabled={busy !== ""}>
              <RefreshCw size={15} className={busy === "sync" ? "spin" : ""} />
              {busy === "sync" ? "Syncing..." : "Sync stats now"}
            </button>
          </div>
        </div>
        <form className="handles-form" onSubmit={saveHandles}>
          {[
            { name: "leetcodeUsername", label: "LeetCode username", logo: "/leetcode_logo.jpeg", placeholder: "e.g. codewizard", getUrl: (u) => `https://leetcode.com/${encodeURIComponent(u)}` },
            { name: "codechefUsername", label: "CodeChef username", logo: "/codechef_logo.svg", placeholder: "e.g. your_codechef", getUrl: (u) => `https://www.codechef.com/users/${encodeURIComponent(u)}` },
            { name: "geeksforgeeksUsername", label: "GeeksforGeeks username", logo: "/gfg_logo.svg", placeholder: "e.g. your_gfg_handle", getUrl: (u) => `https://www.geeksforgeeks.org/user/${encodeURIComponent(u)}/` },
            { name: "githubUsername", label: "GitHub username", logo: "/github_logo.jpeg", placeholder: "e.g. your-github", getUrl: (u) => `https://github.com/${encodeURIComponent(u)}` },
            { name: "hackerrankUsername", label: "HackerRank username", logo: "/hackerrank_logo.jpeg", placeholder: "e.g. problem_solver", getUrl: (u) => `https://www.hackerrank.com/profile/${encodeURIComponent(u)}` }
          ].map(({ name, label, logo, placeholder, getUrl }) => (
            <label className="handle-input" key={name}>
              <span className="handle-input__icon"><img src={logo} alt="" className="handle-input-logo" /></span>
              <span className="handle-input__body">
                <small>{label}</small>
                <input
                  value={handles[name]}
                  onChange={(event) => setHandles({ ...handles, [name]: event.target.value })}
                  placeholder={placeholder}
                />
              </span>
              {handles[name] && getUrl && (
                <a
                  className="icon-button"
                  href={getUrl(handles[name])}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${label}`}
                  title={`Open ${label}`}
                >
                  <ArrowUpRight size={16} />
                </a>
              )}
            </label>
          ))}
          <div className="form-actions">
            <span>
              Last synced: {stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString() : "not yet synced"}
            </span>
            <button className="button button--primary" type="submit" disabled={busy !== ""}>
              <Save size={15} /> {busy === "save" ? "Saving..." : "Save links"}
            </button>
          </div>
        </form>
      </section>

      <RecentSolvedProblems problems={stats.recentAccepted ?? []} />
    </>
  );
}