"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  XCircle,
  Building,
  GraduationCap,
  Briefcase,
  User,
  Phone,
  BadgeCheck,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api, { errorMessage } from "../services/api.js";

function getRoleDisplay(role) {
  switch (role) {
    case "tpo":
      return {
        label: "Training & Placement Officer (TPO)",
        badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        icon: Briefcase
      };
    case "director":
      return {
        label: "Director of Institute / Faculty",
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: Building
      };
    case "hod":
      return {
        label: "Head of Department (HOD)",
        badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        icon: GraduationCap
      };
    case "teacher":
      return {
        label: "Faculty Member / Teacher",
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: User
      };
    default:
      return {
        label: "Institutional Staff",
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: ShieldCheck
      };
  }
}

export default function SetupAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [invitationData, setInvitationData] = useState(null);

  // Form Fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");
  const [qualification, setQualification] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);

  // Verify invitation token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("Missing security invitation token in the link.");
      return;
    }

    api
      .get("/invitations/verify", {
        params: { token }
      })
      .then(({ data }) => {
        setTokenValid(true);
        setInvitationData(data.invitation);
      })
      .catch((err) => {
        setTokenValid(false);
        setTokenError(
          err.response?.data?.message ||
            "This invitation link is invalid, expired, or has already been accepted."
        );
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  // Real-time password requirement checklist
  const ruleChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    match: Boolean(password && password === confirmPassword)
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
      await api.post("/invitations/accept", {
        token,
        password,
        confirmPassword,
        phone,
        employeeId,
        designation,
        qualification
      });
      setSetupComplete(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const roleInfo = invitationData ? getRoleDisplay(invitationData.role) : null;
  const RoleIcon = roleInfo?.icon || ShieldCheck;

  return (
    <div className="auth-wrap auth-wrap--glass">
      {/* Top Header */}
      <header className="auth-topbar">
        <div className="auth-university-pill">
          <img src="/college_logo.png" alt="Rungta University Logo" className="auth-pill-logo" />
          <div className="auth-pill-text">
            <span>Rungta International Skills University</span>
            <small className="auth-pill-dsc">Institutional Account Provisioning</small>
          </div>
        </div>
        <div className="auth-topbar__actions">
          <Link href="/login" className="auth-home-btn">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="auth-main-area">
        <div className="auth-card auth-card--transparent" style={{ maxWidth: 520 }}>
          {/* Card Brand Header */}
          <div className="auth-brand">
            <span className="brand__mark brand__mark--glass">
              <img src="/college_logo.png" alt="Rungta University Logo" className="brand__logo-img" />
            </span>
            <div className="brand__text-group">
              <span className="brand__text brand__text--white">
                Account<span>Setup</span>
              </span>
              <span className="brand__college-sub brand__college-sub--gold">
                College CodeRank Institutional Portal
              </span>
            </div>
          </div>

          <h1 className="auth-card__title">
            Set Up Your <span>Official Account</span>
          </h1>

          {/* Verification Loading State */}
          {verifying ? (
            <div className="p-8 text-center text-white/80 space-y-3">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Validating cryptographic invitation token...</p>
              <p className="text-xs text-white/50">Contacting institutional security directory</p>
            </div>
          ) : !tokenValid ? (
            /* Invalid or Expired Token State */
            <div className="space-y-4 my-2 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <XCircle size={32} />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/30 text-left space-y-2">
                <strong className="block text-sm text-rose-300 font-bold">
                  Invitation Link Inactive or Expired
                </strong>
                <p className="text-xs text-white/80 leading-relaxed">
                  {tokenError}
                </p>
                <p className="text-[11px] text-white/60">
                  Account setup links are single-use and expire within 24 hours. Please contact your administrative supervisor (Super Admin, Director, or HOD) to request a fresh invitation link.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="button button--risu-portal button--wide inline-flex justify-center"
                >
                  Return to Portal Login &rarr;
                </Link>
              </div>
            </div>
          ) : setupComplete ? (
            /* Successful Activation State */
            <div className="space-y-4 my-2 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <ShieldCheck size={36} />
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 text-left space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Sparkles size={16} /> Account Successfully Activated!
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Welcome to the faculty and administration portal, <strong>{invitationData?.name}</strong>. Your password has been securely stored and your account status is now <strong>Active</strong>.
                </p>
                <div className="text-[11px] text-emerald-200/90 bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20 space-y-1">
                  <div><strong>Email:</strong> {invitationData?.email}</div>
                  <div><strong>Assigned Role:</strong> {roleInfo?.label}</div>
                  {invitationData?.directorateName && (
                    <div><strong>Directorate:</strong> {invitationData.directorateName}</div>
                  )}
                  {invitationData?.departmentName && (
                    <div><strong>Department:</strong> {invitationData.departmentName}</div>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="button button--risu-portal button--wide inline-flex justify-center items-center gap-2"
                >
                  Proceed to Sign In <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            /* Active Setup Form */
            <>
              {/* Recipient Details Pill */}
              <div className="mb-4 p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {invitationData?.name}
                      <BadgeCheck size={16} className="text-emerald-400" />
                    </h3>
                    <p className="text-xs text-white/70">{invitationData?.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleInfo?.badgeClass}`}
                  >
                    <RoleIcon size={12} />
                    {roleInfo?.label}
                  </span>
                </div>
                {(invitationData?.directorateName || invitationData?.departmentName) && (
                  <div className="text-[11px] text-white/60 pt-1 border-t border-white/10 flex flex-wrap gap-x-3">
                    {invitationData.directorateName && (
                      <span><strong>Directorate:</strong> {invitationData.directorateName}</span>
                    )}
                    {invitationData.departmentName && (
                      <span><strong>Department:</strong> {invitationData.departmentName}</span>
                    )}
                  </div>
                )}
              </div>

              <p className="auth-subtitle auth-subtitle--light text-xs mb-3">
                Choose your official account password below. You will use this password and your official email to sign in.
              </p>

              {error && (
                <div className="auth-error-box mb-3 flex items-start gap-2 text-xs bg-rose-500/20 border border-rose-500/40 text-rose-200 p-2.5 rounded-lg">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="form-label form-label--light">
                  Choose New Password
                  <span className="input-wrap input-wrap--glass">
                    <Lock size={16} />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Enter a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </span>
                </label>

                <label className="form-label form-label--light">
                  Confirm Password
                  <span className="input-wrap input-wrap--glass">
                    <Lock size={16} />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </span>
                </label>

                {/* Optional Profile Info */}
                <div className="grid grid-cols-2 gap-2 my-1">
                  <label className="form-label form-label--light text-[11px]">
                    Phone (Optional)
                    <span className="input-wrap input-wrap--glass">
                      <Phone size={14} />
                      <input
                        type="tel"
                        placeholder="+91..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </span>
                  </label>
                  <label className="form-label form-label--light text-[11px]">
                    Employee ID (Optional)
                    <span className="input-wrap input-wrap--glass">
                      <User size={14} />
                      <input
                        type="text"
                        placeholder="EMP-..."
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                      />
                    </span>
                  </label>
                </div>

                {/* Real-time Password Rules Checklist */}
                <div className="p-3 rounded-lg bg-slate-900/50 border border-white/10 space-y-1.5 my-2">
                  <div className="text-[11px] font-semibold text-white/80 mb-1">
                    Security Requirements:
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        ruleChecks.length ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      <CheckCircle2 size={12} /> 8+ Characters
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        ruleChecks.upper ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      <CheckCircle2 size={12} /> Uppercase (A-Z)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        ruleChecks.lower ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      <CheckCircle2 size={12} /> Lowercase (a-z)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        ruleChecks.digit ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      <CheckCircle2 size={12} /> Number (0-9)
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        ruleChecks.special ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      <CheckCircle2 size={12} /> Special Symbol
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        ruleChecks.match ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      <CheckCircle2 size={12} /> Passwords Match
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || busy}
                  className={`button button--risu-portal button--wide mt-2 ${
                    !isFormValid || busy ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {busy ? "Activating Account..." : "Activate Account & Sign In"}
                </button>
              </form>
            </>
          )}

          <div className="auth-footer-help text-center mt-4">
            <span className="text-[11px] text-white/50">
              Need assistance? Contact Campus IT at{" "}
              <a href="mailto:it-support@rungta.org" className="text-white/80 underline">
                it-support@rungta.org
              </a>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
