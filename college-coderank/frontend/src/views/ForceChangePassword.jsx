"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, KeyRound, Lock, ShieldAlert, Sparkles, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api.js";

export default function ForceChangePassword() {
  const { user, forceChangePassword, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Real-time password requirement checks
  const ruleChecks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
    match: Boolean(newPassword && newPassword === confirmPassword)
  };

  const isFormValid =
    currentPassword.trim() &&
    ruleChecks.length &&
    ruleChecks.upper &&
    ruleChecks.lower &&
    ruleChecks.digit &&
    ruleChecks.special &&
    ruleChecks.match;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setBusy(true);
    setError("");

    try {
      await forceChangePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      router.replace("/profile");
    } catch (err) {
      setError(errorMessage(err));
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
            <small className="auth-pill-dsc">Security Gatekeeper</small>
          </div>
        </div>
        <div className="auth-topbar__actions">
          <button
            type="button"
            className="auth-photo-toggle-btn"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="auth-main-area">
        <div className="auth-card auth-card--transparent" style={{ maxWidth: 480 }}>
          {/* Header Shield */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Mandatory First-Time Password Change
              </h2>
              <p className="text-xs text-white/75 mt-0.5">
                Temporary onboard password detected for <strong>{user?.name || "Student"}</strong>.
              </p>
            </div>
          </div>

          <p className="auth-subtitle auth-subtitle--light text-xs mb-4">
            For institutional security, all newly onboarded students must replace their initial temporary password with a strong personal password before accessing the portal.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-label form-label--light">
              Current Temporary Password
              <span className="input-wrap input-wrap--glass">
                <KeyRound size={16} />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter current temporary password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </span>
            </label>

            <label className="form-label form-label--light">
              New Personal Password
              <span className="input-wrap input-wrap--glass">
                <Lock size={16} />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </span>
            </label>

            <label className="form-label form-label--light">
              Confirm New Password
              <span className="input-wrap input-wrap--glass">
                <Lock size={16} />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </span>
            </label>

            {/* Password Policy Checklist */}
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10 space-y-1.5 my-1">
              <span className="text-[11px] font-bold text-white/80 block mb-1">
                Password Policy Requirements:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <span className={`flex items-center gap-1.5 ${ruleChecks.length ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                  {ruleChecks.length ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  Minimum 8 characters
                </span>
                <span className={`flex items-center gap-1.5 ${ruleChecks.upper ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                  {ruleChecks.upper ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  1 uppercase letter (A-Z)
                </span>
                <span className={`flex items-center gap-1.5 ${ruleChecks.lower ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                  {ruleChecks.lower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  1 lowercase letter (a-z)
                </span>
                <span className={`flex items-center gap-1.5 ${ruleChecks.digit ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                  {ruleChecks.digit ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  1 number (0-9)
                </span>
                <span className={`flex items-center gap-1.5 ${ruleChecks.special ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                  {ruleChecks.special ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  1 special character (!@#$)
                </span>
                <span className={`flex items-center gap-1.5 ${ruleChecks.match ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                  {ruleChecks.match ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  Passwords match
                </span>
              </div>
            </div>

            {error && (
              <div className="inline-error inline-error--glass" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="button button--risu-portal button--wide mt-2"
              disabled={busy || !isFormValid}
            >
              <span>{busy ? "Updating password..." : "Set New Password & Enter Portal"}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="auth-privacy auth-privacy--light mt-4">
            Encrypted with bcrypt (10 rounds) · Invalidator active for previous sessions
          </p>
        </div>
      </main>
    </div>
  );
}
