import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Code2, Eye, GraduationCap, LockKeyhole, Mail, Sparkles, UserRound, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import BranchSectionFields from "../components/BranchSectionFields.jsx";
import api, { errorMessage } from "../services/api.js";

const initialForm = {
  name: "",
  email: "",
  password: "",
  studentId: "",
  branch: "",
  section: "",
  year: "",
  githubUsername: "",
  leetcodeUsername: "",
  hackerrankUsername: "",
  codechefUsername: "",
  geeksforgeeksUsername: ""
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoOnly, setPhotoOnly] = useState(false);

  useEffect(() => {
    api.get("/leaderboard")
      .then(({ data }) => setDepartments(data.filters.departments))
      .catch(() => setDepartments([]));
  }, []);

  const updateCampusFields = ({ branch, section }) =>
    setForm((current) => ({
      ...current,
      branch,
      section
    }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        studentId: form.studentId?.trim() || undefined,
        branch: form.branch.trim(),
        section: form.section.trim(),
        year: Number(form.year),
        githubUsername: form.githubUsername?.trim() || "",
        leetcodeUsername: form.leetcodeUsername?.trim() || "",
        hackerrankUsername: form.hackerrankUsername?.trim() || "",
        codechefUsername: form.codechefUsername?.trim() || "",
        geeksforgeeksUsername: form.geeksforgeeksUsername?.trim() || ""
      });
      navigate("/profile", { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap auth-wrap--glass">
      <header className="auth-topbar">
        <div className="auth-university-pill">
          <img src="/college_logo.png" alt="Rungta University Logo" className="auth-pill-logo" />
          <div className="auth-pill-text">
            <span>Rungta International Skills University</span>
            <small className="auth-pill-dsc">Presented by DATA SCIENCE CLUB</small>
          </div>
        </div>
        <div className="auth-topbar__actions">
          <button
            type="button"
            className="auth-photo-toggle-btn"
            onClick={() => navigate("/welcome")}
            title="Play Welcome Intro"
          >
            <Video size={14} />
            <span>Campus Welcome Intro</span>
          </button>
          <button
            type="button"
            className="auth-photo-toggle-btn"
            onClick={() => setPhotoOnly((prev) => !prev)}
            title="Toggle full campus view"
          >
            <Eye size={14} />
            <span>{photoOnly ? "Show Registration Form" : "View Full Campus"}</span>
          </button>
          <Link to="/leaderboard" className="auth-home-btn">
            <ArrowLeft size={14} /> Back to Leaderboard
          </Link>
        </div>
      </header>

      <main className="auth-main-area">
        <div className={`auth-card auth-card--register auth-card--transparent ${photoOnly ? "auth-card--hidden" : ""}`}>
          <div className="auth-card__campus-crest">
            <img src="/college_logo.png" alt="Rungta University Logo" className="auth-crest-logo" />
            <div className="auth-crest-text">
              <span>Rungta Student Registration</span>
              <small className="auth-crest-dsc">Presented by DATA SCIENCE CLUB</small>
            </div>
          </div>

          <div className="auth-brand">
            <span className="brand__mark brand__mark--glass">
              <img src="/college_logo.png" alt="Rungta University Logo" className="brand__logo-img" />
            </span>
            <div className="brand__text-group">
              <span className="brand__text brand__text--white">College<span>CodeRank</span></span>
              <span className="brand__college-sub brand__college-sub--gold">Presented by Data Science Club · RISU</span>
            </div>
          </div>

          <h1 className="auth-card__title">Create Student <span>Account</span></h1>
          <p className="auth-subtitle auth-subtitle--light">
            Presented by the Data Science Club. Set up your official profile and represent your department on the leaderboard.
          </p>

          <form className="auth-form register-form" onSubmit={submit}>
            <label className="form-label form-label--light">
              Full name
              <span className="input-wrap input-wrap--glass">
                <UserRound size={17} />
                <input required placeholder="Your full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </span>
            </label>
            <label className="form-label form-label--light">
              College email address
              <span className="input-wrap input-wrap--glass">
                <Mail size={17} />
                <input type="email" required placeholder="you@rungta.ac.in" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </span>
            </label>
            <label className="form-label form-label--light">
              Password
              <span className="input-wrap input-wrap--glass">
                <LockKeyhole size={17} />
                <input type="password" minLength="8" required placeholder="At least 8 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </span>
            </label>
            <label className="form-label form-label--light">
              Student / roll number
              <span className="input-wrap input-wrap--glass">
                <Code2 size={17} />
                <input placeholder="University Roll No. (e.g. 21CS042)" value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} />
              </span>
            </label>
            <div className="register-row register-row--glass">
              <BranchSectionFields
                idPrefix="register"
                branch={form.branch}
                section={form.section}
                departments={departments}
                onChange={updateCampusFields}
              />
              <label className="form-label form-label--light">
                Year
                <select required value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>
                  <option value="">Year</option>
                  {[1, 2, 3, 4].map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </div>

            <div style={{ marginTop: 14, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#fca5a5", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Coding Handles (Optional · auto-syncs repos & score)
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <label className="form-label form-label--light" style={{ margin: 0 }}>
                  <span className="input-wrap input-wrap--glass">
                    <img src="/github_logo.jpeg" alt="GitHub" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "contain" }} />
                    <input
                      placeholder="GitHub Username (e.g. your-github-handle)"
                      value={form.githubUsername}
                      onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
                    />
                  </span>
                </label>
                <label className="form-label form-label--light" style={{ margin: 0 }}>
                  <span className="input-wrap input-wrap--glass">
                    <img src="/leetcode_logo.jpeg" alt="LeetCode" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "contain" }} />
                    <input
                      placeholder="LeetCode Username (e.g. your-leetcode-handle)"
                      value={form.leetcodeUsername}
                      onChange={(e) => setForm({ ...form, leetcodeUsername: e.target.value })}
                    />
                  </span>
                </label>
                <label className="form-label form-label--light" style={{ margin: 0 }}>
                  <span className="input-wrap input-wrap--glass">
                    <img src="/hackerrank_logo.jpeg" alt="HackerRank" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "contain" }} />
                    <input
                      placeholder="HackerRank Username (e.g. your-hackerrank-handle)"
                      value={form.hackerrankUsername}
                      onChange={(e) => setForm({ ...form, hackerrankUsername: e.target.value })}
                    />
                  </span>
                </label>
                <label className="form-label form-label--light" style={{ margin: 0 }}>
                  <span className="input-wrap input-wrap--glass">
                    <img src="/codechef_logo.svg" alt="CodeChef" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "contain" }} />
                    <input
                      placeholder="CodeChef Username (e.g. your-codechef-handle)"
                      value={form.codechefUsername}
                      onChange={(e) => setForm({ ...form, codechefUsername: e.target.value })}
                    />
                  </span>
                </label>
                <label className="form-label form-label--light" style={{ margin: 0 }}>
                  <span className="input-wrap input-wrap--glass">
                    <img src="/gfg_logo.svg" alt="GeeksforGeeks" style={{ width: 16, height: 16, borderRadius: 4, objectFit: "contain" }} />
                    <input
                      placeholder="GeeksforGeeks Username (e.g. your-gfg-handle)"
                      value={form.geeksforgeeksUsername}
                      onChange={(e) => setForm({ ...form, geeksforgeeksUsername: e.target.value })}
                    />
                  </span>
                </label>
              </div>
            </div>

            {error && <div className="inline-error inline-error--glass" role="alert">{error}</div>}
            <button className="button button--risu-portal button--wide" disabled={busy}>{busy ? "Registering student & syncing..." : "Create Account & Join Board"} <ArrowRight size={16} /></button>
          </form>

          <p className="auth-bottom auth-bottom--light">Already registered? <Link to="/login">Sign in</Link></p>
          <p className="auth-privacy auth-privacy--light">Rungta Educational Complex · Sign up with your college email.</p>
        </div>
      </main>

      <footer className="auth-footer-bar">
        <div className="auth-campus-tag auth-campus-tag--glass">
          <span className="auth-campus-tag__dot" />
          <span>Campus: Rungta International Skills University, Bhilai / Raipur</span>
        </div>
        {photoOnly && (
          <button
            type="button"
            className="auth-resume-btn auth-resume-btn--red"
            onClick={() => setPhotoOnly(false)}
          >
            Click to return to register
          </button>
        )}
      </footer>
    </div>
  );
}