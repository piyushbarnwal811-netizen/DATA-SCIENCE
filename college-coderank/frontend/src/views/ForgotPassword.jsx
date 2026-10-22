"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Send, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import api, { errorMessage } from "../services/api.js";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: identifier.trim()
      });
      setSubmitted(true);
      setNotice(
        data.message ||
          "If an account exists with this email or student ID, a password reset link has been sent to your registered email."
      );
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
            <small className="auth-pill-dsc">Self-Service Account Recovery</small>
          </div>
        </div>
        <div className="auth-topbar__actions">
          <Link href="/login" className="auth-home-btn">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </header>

      <main className="auth-main-area">
        <div className="auth-card auth-card--transparent" style={{ maxWidth: 460 }}>
          <div className="auth-brand">
            <span className="brand__mark brand__mark--glass">
              <img src="/college_logo.png" alt="Rungta University Logo" className="brand__logo-img" />
            </span>
            <div className="brand__text-group">
              <span className="brand__text brand__text--white">Account<span>Recovery</span></span>
              <span className="brand__college-sub brand__college-sub--gold">College CodeRank Portal</span>
            </div>
          </div>

          <h1 className="auth-card__title">Forgot your <span>Password?</span></h1>
          <p className="auth-subtitle auth-subtitle--light">
            Enter your college email address or student roll number. We will send you a secure one-time password reset link.
          </p>

          {submitted ? (
            <div className="space-y-4 my-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={30} />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-white/10 text-left space-y-2">
                <strong className="block text-sm text-white font-bold">
                  Check your college email inbox
                </strong>
                <p className="text-xs text-white/80 leading-relaxed">
                  {notice}
                </p>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90">
                  ⏳ <strong>Important:</strong> The reset link is valid for exactly <strong>15 minutes</strong>. If you do not see it within a couple minutes, please check your Spam or Junk folder.
                </div>
              </div>

              <div className="pt-2">
                <Link href="/login" className="button button--risu-portal button--wide inline-flex justify-center">
                  <ArrowLeft size={16} /> Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="form-label form-label--light">
                Registered College Email or Roll Number
                <span className="input-wrap input-wrap--glass">
                  <Mail size={17} />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. student@rungta.ac.in or CS2024012"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </span>
              </label>

              {error && (
                <div className="inline-error inline-error--glass" role="alert">
                  {error}
                </div>
              )}

              <button className="button button--risu-portal button--wide" disabled={busy || !identifier.trim()}>
                <Send size={15} />
                <span>{busy ? "Sending secure link..." : "Send Password Reset Link"}</span>
              </button>

              <div className="flex items-center justify-between text-xs text-white/70 pt-2">
                <Link href="/login" className="hover:text-white transition-colors">
                  &larr; Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}

          <p className="auth-privacy auth-privacy--light mt-4">
            Protected by cryptographic SHA-256 tokens &amp; hourly rate limiting
          </p>
        </div>
      </main>
    </div>
  );
}
