"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api, { errorMessage } from "../services/api.js";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [tokenError, setTokenError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token || !email) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("Missing reset token or email address in the URL.");
      return;
    }

    api
      .get("/auth/verify-reset-token", {
        params: { token, email }
      })
      .then(({ data }) => {
        setTokenValid(true);
        setStudentName(data.name || "");
      })
      .catch((err) => {
        setTokenValid(false);
        setTokenError(
          err.response?.data?.message ||
            "This password reset link is invalid, expired, or has already been used."
        );
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token, email]);

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
      await api.post("/auth/reset-password", {
        email,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setResetComplete(true);
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
            <small className="auth-pill-dsc">Secure Account Access</small>
          </div>
        </div>
        <div className="auth-topbar__actions">
          <Link href="/login" className="auth-home-btn">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </header>

      <main className="auth-main-area">
        <div className="auth-card auth-card--transparent" style={{ maxWidth: 480 }}>
          <div className="auth-brand">
            <span className="brand__mark brand__mark--glass">
              <img src="/college_logo.png" alt="Rungta University Logo" className="brand__logo-img" />
            </span>
            <div className="brand__text-group">
              <span className="brand__text brand__text--white">Reset<span>Password</span></span>
              <span className="brand__college-sub brand__college-sub--gold">College CodeRank Portal</span>
            </div>
          </div>

          <h1 className="auth-card__title">Choose a <span>New Password</span></h1>

          {verifying ? (
            <div className="p-8 text-center text-white/80 space-y-2">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-xs">Verifying cryptographic reset token...</p>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-4 my-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <XCircle size={32} />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-rose-500/30 text-left space-y-2">
                <strong className="block text-sm text-rose-300 font-bold">
                  Invalid or Expired Link
                </strong>
                <p className="text-xs text-white/80 leading-relaxed">
                  {tokenError}
                </p>
                <p className="text-[11px] text-white/60">
                  Password reset links are single-use and expire after 15 minutes for your protection.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/forgot-password" className="button button--risu-portal button--wide inline-flex justify-center">
                  Request New Reset Link &rarr;
                </Link>
              </div>
            </div>
          ) : resetComplete ? (
            <div className="space-y-4 my-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <ShieldCheck size={32} />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-emerald-500/30 text-left space-y-2">
                <strong className="block text-sm text-emerald-300 font-bold">
                  Password Successfully Reset!
                </strong>
                <p className="text-xs text-white/80 leading-relaxed">
                  Your student portal password has been updated. A transactional confirmation email has been sent to <strong>{email}</strong>.
                </p>
                <p className="text-[11px] text-emerald-200/80 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                  🔒 All previous active sessions across all devices have been invalidated.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/login" className="button button--risu-portal button--wide inline-flex justify-center">
                  Sign In With New Password <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="auth-subtitle auth-subtitle--light text-xs mb-3">
                Resetting password for <strong>{studentName ? `${studentName} (${email})` : email}</strong>. Please define your new secure password below:
              </p>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="form-label form-label--light">
                  New Password
                  <span className="input-wrap input-wrap--glass">
                    <Lock size={16} />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Enter new password"
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
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </span>
                </label>

                {/* Password Policy Checklist */}
                <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10 space-y-1.5 my-1">
                  <span className="text-[11px] font-bold text-white/80 block mb-1">
                    Password Requirements:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    <span className={`flex items-center gap-1.5 ${ruleChecks.length ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                      {ruleChecks.length ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      Min 8 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${ruleChecks.upper ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                      {ruleChecks.upper ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      1 uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${ruleChecks.lower ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                      {ruleChecks.lower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      1 lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${ruleChecks.digit ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                      {ruleChecks.digit ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      1 number (0-9)
                    </span>
                    <span className={`flex items-center gap-1.5 ${ruleChecks.special ? "text-emerald-400 font-semibold" : "text-white/60"}`}>
                      {ruleChecks.special ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      1 special char (!@#$)
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
                  <span>{busy ? "Resetting password..." : "Confirm & Update Password"}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          <p className="auth-privacy auth-privacy--light mt-4">
            Security enforced by Rungta International Skills University IT Governance
          </p>
        </div>
      </main>
    </div>
  );
}
