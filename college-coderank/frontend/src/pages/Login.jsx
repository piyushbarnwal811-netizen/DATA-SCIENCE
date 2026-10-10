import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, GraduationCap, LockKeyhole, Mail, Sparkles, Video } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoOnly, setPhotoOnly] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login({ ...form, role });
      navigate(location.state?.from || (user.role === "admin" ? "/admin" : "/profile"), { replace: true });
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
          <span>Rungta International Skills University</span>
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
            <span>{photoOnly ? "Show Sign In" : "View Full Campus"}</span>
          </button>
          <Link to="/" className="auth-home-btn">
            <ArrowLeft size={14} /> Back to Leaderboard
          </Link>
        </div>
      </header>

      <main className="auth-main-area">
        <div className={`auth-card auth-card--transparent ${photoOnly ? "auth-card--hidden" : ""}`}>
          <div className="auth-card__campus-crest">
            <img src="/college_logo.png" alt="Rungta University Logo" className="auth-crest-logo" />
            <span>Rungta International Skills University</span>
          </div>

          <div className="auth-brand">
            <span className="brand__mark brand__mark--glass">
              <img src="/college_logo.png" alt="Rungta University Logo" className="brand__logo-img" />
            </span>
            <div className="brand__text-group">
              <span className="brand__text brand__text--white">College<span>CodeRank</span></span>
              <span className="brand__college-sub brand__college-sub--gold">Official Student & Faculty Portal</span>
            </div>
          </div>

          <h1 className="auth-card__title">Sign In to <span>RISU Portal</span></h1>
          <p className="auth-subtitle auth-subtitle--light">
            Empowering future tech leaders. Track LeetCode, GitHub & HackerRank streaks at Rungta University.
          </p>

          <div className="role-switch role-switch--glass">
            <button type="button" className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>Student</button>
            <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>Administrator</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label className="form-label form-label--light">
              College email address
              <span className="input-wrap input-wrap--glass">
                <Mail size={17} />
                <input type="email" required autoComplete="email" placeholder="you@rungta.ac.in" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </span>
            </label>
            <label className="form-label form-label--light">
              Password
              <span className="input-wrap input-wrap--glass">
                <LockKeyhole size={17} />
                <input type="password" required autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              </span>
            </label>
            {error && <div className="inline-error inline-error--glass" role="alert">{error}</div>}
            <button className="button button--risu-portal button--wide" disabled={busy}>{busy ? "Verifying credentials..." : "Sign in to Rungta Portal"} <ArrowRight size={16} /></button>
          </form>

          {role === "student" && <p className="auth-bottom auth-bottom--light">New student? <Link to="/register">Create your student account</Link></p>}
          <p className="auth-privacy auth-privacy--light">Rungta Educational Complex · Central India Premier Tech Institute</p>
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
            Click to return to sign in
          </button>
        )}
      </footer>
    </div>
  );
}