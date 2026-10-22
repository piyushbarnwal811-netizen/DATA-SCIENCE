"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  FileSpreadsheet,
  Globe,
  Plus,
  Radio,
  RefreshCw,
  Trash2,
  Upload,
  UserPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import BranchSectionFields from "../components/BranchSectionFields.jsx";
import api, { errorMessage } from "../services/api.js";
import { useRealtimeSync } from "../services/realtime.js";
import { formatNumber } from "../utils/helpers.js";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [rosterMode, setRosterMode] = useState("bulk"); // "bulk" | "single"
  const [file, setFile] = useState(null);
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [origin, setOrigin] = useState("");

  const [singleStudent, setSingleStudent] = useState({
    name: "",
    email: "",
    studentId: "",
    branch: "",
    section: "",
    year: "1",
    password: "",
    leetcodeUsername: "",
    githubUsername: "",
    codechefUsername: "",
    geeksforgeeksUsername: "",
    hackerrankUsername: ""
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const updateCampusFields = ({ branch: nextBranch, section: nextSection }) => {
    setBranch(nextBranch);
    setSection(nextSection);
  };

  const loadDashboard = async () => {
    const [overviewResponse, departmentsResponse] = await Promise.all([
      api.get("/admin/overview"),
      api.get("/admin/departments")
    ]);
    setOverview(overviewResponse.data);
    setDepartments(departmentsResponse.data.departments);
  };

  useEffect(() => {
    loadDashboard().catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  // Real-time live auto-update listener
  const { connected } = useRealtimeSync({
    onStudentUpdated: () => {
      loadDashboard().catch(() => {});
    },
    onLeaderboardRefresh: () => {
      loadDashboard().catch(() => {});
    }
  });

  const uploadSheet = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!file) {
      setError("Choose an Excel or CSV student sheet first.");
      return;
    }
    setBusy("upload");
    setError("");
    setNotice("");
    const body = new FormData();
    body.append("file", file);
    try {
      const { data } = await api.post("/admin/students/import", body);
      setNotice(`${data.message} ${data.imported} student records processed.`);
      setFile(null);
      form.reset();
      await loadDashboard();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const updateSingleStudentBranchSection = ({ branch: nextBranch, section: nextSection }) => {
    setSingleStudent((prev) => ({ ...prev, branch: nextBranch, section: nextSection }));
  };

  const handleAddSingleStudent = async (event) => {
    event.preventDefault();
    setBusy("add-student");
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/admin/students", singleStudent);
      setNotice(data.message || `Student "${singleStudent.name}" added successfully!`);
      setSingleStudent({
        name: "",
        email: "",
        studentId: "",
        branch: "",
        section: "",
        year: "1",
        password: "",
        leetcodeUsername: "",
        githubUsername: "",
        codechefUsername: "",
        geeksforgeeksUsername: "",
        hackerrankUsername: ""
      });
      await loadDashboard();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const handleExportRoster = async () => {
    setExporting(true);
    setError("");
    try {
      const response = await api.get("/admin/students/export", { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Full_Student_Roster_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setNotice("Student roster exported successfully as Excel spreadsheet (.xlsx).");
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not export student roster."));
    } finally {
      setExporting(false);
    }
  };

  const handleSyncAll = async () => {
    setBusy("sync-all");
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/admin/students/sync-all");
      setNotice(`${data.message} (Updated: ${data.updated})`);
      await loadDashboard();
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not sync students."));
    } finally {
      setBusy("");
    }
  };

  const addSection = async (event) => {
    event.preventDefault();
    setBusy("section");
    setError("");
    setNotice("");
    try {
      await api.post("/admin/departments", { branch, section });
      setNotice(`Section ${section} is ready under ${branch}.`);
      setBranch("");
      setSection("");
      await loadDashboard();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  const removeSection = async (department, sectionName) => {
    setBusy(`${department.name}:${sectionName}`);
    setError("");
    setNotice("");
    try {
      await api.delete(
        `/admin/departments/${encodeURIComponent(department.name)}/sections/${encodeURIComponent(sectionName)}`
      );
      setNotice(`Removed section ${sectionName} from ${department.name}.`);
      await loadDashboard();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <div className="page-intro">
        <div className="page-intro__header">
          <span className="eyebrow">RUNGTA INTERNATIONAL SKILLS UNIVERSITY · CAMPUS CONTROL ROOM</span>
          <div className="live-status-pill" title="Real-time push updates active via SSE">
            <span className={`live-dot ${connected ? "is-active" : ""}`} />
            <small>{connected ? "Real-time sync active" : "Connecting..."}</small>
          </div>
        </div>
        <div className="page-intro__line">
          <div>
            <h1>Admin dashboard</h1>
            <p>Keep the student roster, platform stats, and campus sections in sync.</p>
          </div>
          <div className="page-intro__actions">
            <button
              className="button button--subtle"
              onClick={handleSyncAll}
              disabled={busy !== ""}
              title="Sync LeetCode, CodeChef, GeeksforGeeks, GitHub and HackerRank for all students"
            >
              <RefreshCw size={15} className={busy === "sync-all" ? "spin" : ""} />
              <span>{busy === "sync-all" ? "Syncing roster..." : "Sync all students"}</span>
            </button>
            <button
              className="button button--excel"
              onClick={handleExportRoster}
              disabled={exporting}
              title="Download entire student database in Excel format"
            >
              <FileSpreadsheet size={15} />
              <span>{exporting ? "Exporting..." : "Export Excel (.xlsx)"}</span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="inline-error" role="alert">{error}</div>}
      {notice && <div className="inline-success" role="status"><Check size={16} />{notice}</div>}

      <div className="stats-grid stats-grid--admin">
        <article className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon"><Users size={19} /></span>
            <span className="stat-card__note">Roster</span>
          </div>
          <strong className="stat-card__value">{formatNumber(overview?.students)}</strong>
          <span className="stat-card__label">Active students</span>
        </article>
        <article className="stat-card stat-card--orange">
          <div className="stat-card__top">
            <span className="stat-card__icon"><FileSpreadsheet size={19} /></span>
            <span className="stat-card__note">Organized</span>
          </div>
          <strong className="stat-card__value">{formatNumber(overview?.departments)}</strong>
          <span className="stat-card__label">Branches</span>
        </article>
        <article className="stat-card stat-card--peach">
          <div className="stat-card__top">
            <span className="stat-card__icon"><RefreshCw size={19} /></span>
            <span className="stat-card__note">Database</span>
          </div>
          <strong className="stat-card__value">
            {departments.reduce((total, item) => total + item.sections.length, 0)}
          </strong>
          <span className="stat-card__label">Sections listed</span>
        </article>
      </div>

      {/* Connected Coding Platforms Status */}
      <div className="admin-platforms-bar">
        <div className="admin-platform-chip admin-platform-chip--lc">
          <img src="/leetcode_logo.jpeg" alt="LeetCode" className="admin-platform-logo" />
          <div>
            <strong>LeetCode Engine</strong>
            <span>Easy (1x) + Med (3x) + Hard (5x)</span>
          </div>
        </div>
        <div className="admin-platform-chip admin-platform-chip--cc">
          <img src="/codechef_logo.svg" alt="CodeChef" className="admin-platform-logo" />
          <div>
            <strong>CodeChef Engine</strong>
            <span>2 pts / problem + Rating tier bonus</span>
          </div>
        </div>
        <div className="admin-platform-chip admin-platform-chip--gfg">
          <img src="/gfg_logo.svg" alt="GeeksforGeeks" className="admin-platform-logo" />
          <div>
            <strong>GeeksforGeeks Engine</strong>
            <span>Coding Score (0.5x) + Solved (1x)</span>
          </div>
        </div>
        <div className="admin-platform-chip admin-platform-chip--hr">
          <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="admin-platform-logo" />
          <div>
            <strong>HackerRank Engine</strong>
            <span>Practice Points (10 pts = 1 score)</span>
          </div>
        </div>
        <div className="admin-platform-chip admin-platform-chip--gh">
          <img src="/github_logo.jpeg" alt="GitHub" className="admin-platform-logo" />
          <div>
            <strong>GitHub Engine</strong>
            <span>Public Repos (2x pts) + Push Webhooks</span>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <section className="section-card admin-upload-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">STUDENT ROSTER &amp; ONBOARDING</span>
              <h2>Student roster management</h2>
            </div>
            <div className="roster-mode-switcher" role="tablist">
              <button
                type="button"
                className={`mode-btn ${rosterMode === "bulk" ? "is-active" : ""}`}
                onClick={() => {
                  setRosterMode("bulk");
                  setError("");
                }}
              >
                <Upload size={13} />
                <span>Bulk Upload</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${rosterMode === "single" ? "is-active" : ""}`}
                onClick={() => {
                  setRosterMode("single");
                  setError("");
                }}
              >
                <UserPlus size={13} />
                <span>Add Single Student</span>
              </button>
            </div>
          </div>

          {rosterMode === "bulk" ? (
            <>
              <p className="section-description">
                Add or update student profiles in bulk using Excel (.xlsx) or CSV files. Existing accounts are matched by email.
              </p>
              <div className="roster-actions-row">
                <a className="download-template" href="/sample_student_template.xlsx" download>
                  <ArrowDownToLine size={15} /> Download template
                </a>
                <button
                  type="button"
                  className="button button--subtle button--compact"
                  onClick={handleExportRoster}
                  disabled={exporting}
                >
                  <FileSpreadsheet size={14} /> Download current roster (.xlsx)
                </button>
              </div>
              <form className="upload-form" onSubmit={uploadSheet}>
                <label className="upload-dropzone">
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                  <span className="upload-dropzone__icon"><Upload size={21} /></span>
                  <strong>{file?.name || "Choose a student sheet"}</strong>
                  <span>
                    {file ? `${(file.size / 1024).toFixed(0)} KB · ready to upload` : "Excel (.xlsx) or CSV · max 5 MB"}
                  </span>
                </label>
                <button className="button button--primary button--wide" disabled={busy !== "" || !file}>
                  <Upload size={16} />
                  {busy === "upload" ? "Importing roster..." : "Upload student list"}
                </button>
              </form>
              <div className="import-tip">
                <span>!</span>
                <p>
                  Required columns: <strong>name, email, branch, section, year</strong>. Optional: studentId,
                  leetcodeUsername, codechefUsername, geeksforgeeksUsername, githubUsername, hackerrankUsername.
                </p>
              </div>
            </>
          ) : (
            <form className="single-student-form" onSubmit={handleAddSingleStudent}>
              <p className="section-description">
                Manually register an individual student. Competitive coding handles will synchronize immediately upon adding.
              </p>

              <div className="form-grid-2">
                <label className="form-label" htmlFor="single-name">
                  Full Name *
                  <input
                    id="single-name"
                    className="plain-input"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={singleStudent.name}
                    onChange={(e) => setSingleStudent({ ...singleStudent, name: e.target.value })}
                  />
                </label>

                <label className="form-label" htmlFor="single-email">
                  Email Address *
                  <input
                    id="single-email"
                    className="plain-input"
                    type="email"
                    required
                    placeholder="e.g. rahul.sharma@rungta.ac.in"
                    value={singleStudent.email}
                    onChange={(e) => setSingleStudent({ ...singleStudent, email: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-grid-2">
                <label className="form-label" htmlFor="single-student-id">
                  Student ID / Roll No (Optional)
                  <input
                    id="single-student-id"
                    className="plain-input"
                    type="text"
                    placeholder="e.g. CS2024045"
                    value={singleStudent.studentId}
                    onChange={(e) => setSingleStudent({ ...singleStudent, studentId: e.target.value })}
                  />
                </label>

                <label className="form-label" htmlFor="single-year">
                  Academic Year *
                  <select
                    id="single-year"
                    className="plain-input"
                    required
                    value={singleStudent.year}
                    onChange={(e) => setSingleStudent({ ...singleStudent, year: e.target.value })}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                    <option value="6">6th Year</option>
                    <option value="7">7th Year</option>
                    <option value="8">8th Year</option>
                  </select>
                </label>
              </div>

              <BranchSectionFields
                idPrefix="single-student"
                branch={singleStudent.branch}
                section={singleStudent.section}
                departments={departments}
                onChange={updateSingleStudentBranchSection}
                branchLabel="Branch *"
                sectionLabel="Section *"
              />

              <div className="platform-handles-section">
                <div className="platform-handles-header">
                  <strong>Competitive Coding Profiles (Optional)</strong>
                  <small>Auto-synced on submission</small>
                </div>

                <div className="form-grid-2">
                  <label className="form-label" htmlFor="single-lc">
                    <span className="flex items-center gap-1.5">
                      <img src="/leetcode_logo.jpeg" alt="LeetCode" className="w-3.5 h-3.5 rounded object-contain" />
                      LeetCode Handle
                    </span>
                    <input
                      id="single-lc"
                      className="plain-input"
                      type="text"
                      placeholder="e.g. rahul_sharma"
                      value={singleStudent.leetcodeUsername}
                      onChange={(e) => setSingleStudent({ ...singleStudent, leetcodeUsername: e.target.value })}
                    />
                  </label>

                  <label className="form-label" htmlFor="single-gh">
                    <span className="flex items-center gap-1.5">
                      <img src="/github_logo.jpeg" alt="GitHub" className="w-3.5 h-3.5 rounded object-contain" />
                      GitHub Username
                    </span>
                    <input
                      id="single-gh"
                      className="plain-input"
                      type="text"
                      placeholder="e.g. rahulsharma-dev"
                      value={singleStudent.githubUsername}
                      onChange={(e) => setSingleStudent({ ...singleStudent, githubUsername: e.target.value })}
                    />
                  </label>
                </div>

                <div className="form-grid-3">
                  <label className="form-label" htmlFor="single-cc">
                    <span className="flex items-center gap-1.5">
                      <img src="/codechef_logo.svg" alt="CodeChef" className="w-3.5 h-3.5 rounded object-contain" />
                      CodeChef Handle
                    </span>
                    <input
                      id="single-cc"
                      className="plain-input"
                      type="text"
                      placeholder="e.g. rahul_cc"
                      value={singleStudent.codechefUsername}
                      onChange={(e) => setSingleStudent({ ...singleStudent, codechefUsername: e.target.value })}
                    />
                  </label>

                  <label className="form-label" htmlFor="single-gfg">
                    <span className="flex items-center gap-1.5">
                      <img src="/gfg_logo.svg" alt="GeeksforGeeks" className="w-3.5 h-3.5 rounded object-contain" />
                      GFG Username
                    </span>
                    <input
                      id="single-gfg"
                      className="plain-input"
                      type="text"
                      placeholder="e.g. rahul_gfg"
                      value={singleStudent.geeksforgeeksUsername}
                      onChange={(e) => setSingleStudent({ ...singleStudent, geeksforgeeksUsername: e.target.value })}
                    />
                  </label>

                  <label className="form-label" htmlFor="single-hr">
                    <span className="flex items-center gap-1.5">
                      <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="w-3.5 h-3.5 rounded object-contain" />
                      HackerRank Handle
                    </span>
                    <input
                      id="single-hr"
                      className="plain-input"
                      type="text"
                      placeholder="e.g. rahul_hr"
                      value={singleStudent.hackerrankUsername}
                      onChange={(e) => setSingleStudent({ ...singleStudent, hackerrankUsername: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <label className="form-label" htmlFor="single-password">
                Temporary Password (Optional)
                <input
                  id="single-password"
                  className="plain-input"
                  type="password"
                  placeholder="Min 6 characters (or leave blank for student self-registration)"
                  value={singleStudent.password}
                  onChange={(e) => setSingleStudent({ ...singleStudent, password: e.target.value })}
                />
              </label>

              <div className="single-student-actions">
                <button
                  type="submit"
                  className="button button--primary button--wide"
                  disabled={busy !== "" || !singleStudent.name || !singleStudent.email || !singleStudent.branch || !singleStudent.section}
                >
                  <UserPlus size={16} />
                  {busy === "add-student" ? "Adding student & syncing stats..." : "Add Student to Roster"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="section-card section-manager">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CAMPUS STRUCTURE</span>
              <h2>Branches &amp; sections</h2>
            </div>
          </div>
          <form className="section-add-form" onSubmit={addSection}>
            <BranchSectionFields
              idPrefix="admin"
              branch={branch}
              section={section}
              departments={departments}
              onChange={updateCampusFields}
              branchLabel="Branch name"
              sectionLabel="Section"
            />
            <button className="button button--primary" disabled={busy !== ""}>
              <Plus size={16} /> Add
            </button>
          </form>
          <div className="department-list">
            {departments.length ? (
              departments.map((department) => (
                <div className="department-item" key={department._id}>
                  <div className="department-item__head">
                    <strong>{department.name}</strong>
                    <span>{department.sections.length} sections</span>
                  </div>
                  <div className="section-chips">
                    {department.sections.map((sectionName) => (
                      <span className="section-chip" key={sectionName}>
                        {sectionName}
                        <button
                          type="button"
                          onClick={() => removeSection(department, sectionName)}
                          disabled={busy !== ""}
                          aria-label={`Remove section ${sectionName}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state empty-state--compact">
                <strong>No branches yet</strong>
                <p>Add a branch and section, or import a roster.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Auto-Sync & Webhook Integration Info */}
      <section className="section-card webhook-guide-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">AUTO-UPDATE INTEGRATION</span>
            <h2>Real-time Webhook &amp; Sync Status</h2>
          </div>
          <span className="admin-section-icon"><Globe size={19} /></span>
        </div>
        <div className="webhook-guide-content">
          <p>
            Students' scores update automatically in real-time across both Admin and Student panels when they solve
            problems or push code:
          </p>
          <div className="webhook-steps">
            <div className="webhook-step">
              <div className="admin-step-title">
                <img src="/github_logo.jpeg" alt="GitHub" className="admin-step-logo" />
                <strong>1. GitHub Webhook (Instant)</strong>
              </div>
              <p>Configure repo webhook to URL:</p>
              <code>{origin ? `${origin}/api/webhooks/github` : "/api/webhooks/github"}</code>
              <small>Triggers on commit push event to instantly refresh student repositories and score.</small>
            </div>
            <div className="webhook-step">
              <div className="admin-step-title">
                <img src="/leetcode_logo.jpeg" alt="LeetCode" className="admin-step-logo" />
                <img src="/codechef_logo.svg" alt="CodeChef" className="admin-step-logo" />
                <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="admin-step-logo" />
                <strong>2. Background Poller (LeetCode, CodeChef &amp; HackerRank)</strong>
              </div>
              <p>Active automatic background cycle:</p>
              <code>Runs every 2 minutes automatically</code>
              <small>Detects newly accepted questions, updates scores, and broadcasts live.</small>
            </div>
            <div className="webhook-step">
              <div className="admin-step-title">
                <strong>3. Instant Ping Endpoint</strong>
              </div>
              <p>Call anytime via GET/POST:</p>
              <code>{origin ? `${origin}/api/webhooks/ping?username=<handle>` : "/api/webhooks/ping?username=<handle>"}</code>
              <small>Can be hooked into student scripts, browser extensions, or GitHub Actions.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section-card recent-students">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LATEST ARRIVALS</span>
            <h2>Recently added students</h2>
          </div>
          <span className="table-caption">Showing the latest 5</span>
        </div>
        {overview?.recent?.length ? (
          <div className="recent-list">
            {overview.recent.map((student) => (
              <Link
                className="recent-student recent-student--link"
                href={`/admin/students/${student._id}`}
                key={student._id}
              >
                <span className="avatar avatar--soft">
                  {student.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.email}</span>
                </div>
                <span className="recent-student__branch">
                  {student.branch} · {student.section}
                </span>
                <small>{new Date(student.createdAt).toLocaleDateString()}</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state empty-state--compact">
            <strong>No students added yet</strong>
            <p>Upload your first roster to get started.</p>
          </div>
        )}
      </section>
    </>
  );
}