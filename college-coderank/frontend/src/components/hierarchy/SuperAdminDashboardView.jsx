"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  Briefcase,
  Building,
  GraduationCap,
  Users,
  KeyRound,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Power,
  ShieldAlert,
  Layers,
  Settings,
  X,
  Mail,
  Send,
  Clock,
  RotateCcw,
  Ban,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";

export default function SuperAdminDashboardView({ onInspectTree }) {
  const [activeTab, setActiveTab] = useState("tpos"); // "tpos" | "directors" | "accounts" | "audit" | "settings"
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const lastSubmitRef = useRef(0);

  // Modals state
  const [showTpoModal, setShowTpoModal] = useState(false);
  const [showDirModal, setShowDirModal] = useState(false);
  const [showDirateModal, setShowDirateModal] = useState(false);
  const [showTpoInviteModal, setShowTpoInviteModal] = useState(false);
  const [showDirInviteModal, setShowDirInviteModal] = useState(false);
  const [inviteSuccessModal, setInviteSuccessModal] = useState(null);
  const [tempCredsModal, setTempCredsModal] = useState(null); // { name, email, password, role }
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // { id, name, role }
  const [copied, setCopied] = useState(false);
  const [showTpoPassword, setShowTpoPassword] = useState(false);
  const [showDirPassword, setShowDirPassword] = useState(false);

  // Tab Data States
  const [tpos, setTpos] = useState([]);
  const [tpoInvitations, setTpoInvitations] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [directorInvitations, setDirectorInvitations] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [directorates, setDirectorates] = useState([]);

  // Invitation Forms
  const [tpoInviteForm, setTpoInviteForm] = useState({ name: "", email: "" });
  const [dirInviteForm, setDirInviteForm] = useState({ name: "", email: "", directorateId: "" });
  const [dirInviteSchoolMode, setDirInviteSchoolMode] = useState("select"); // "select" | "custom"
  const [dirInviteCustomSchool, setDirInviteCustomSchool] = useState("");
  const [dirCreateSchoolMode, setDirCreateSchoolMode] = useState("select"); // "select" | "custom"
  const [dirCreateCustomSchool, setDirCreateCustomSchool] = useState("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Forms
  const [tpoForm, setTpoForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    phone: "",
    designation: "Head - Training & Placement Office (TPO)",
    password: "",
    temporaryPassword: "",
    mustChangePassword: false
  });

  const [dirForm, setDirForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    phone: "",
    designation: "Director of Faculty / Institute",
    qualification: "",
    directorateId: "",
    password: "",
    temporaryPassword: "",
    mustChangePassword: false
  });

  const [dirateForm, setDirateForm] = useState({
    name: "",
    code: "",
    description: "",
    building: ""
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const { data } = await api.get("/hierarchy/super-admin/overview");
      setOverview(data);
      setDirectorates(data.directorates || []);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const fetchTabData = useCallback(async (tab) => {
    try {
      if (tab === "tpos") {
        const [tposRes, invsRes] = await Promise.all([
          api.get("/hierarchy/tpos"),
          api.get("/invitations?role=tpo")
        ]);
        setTpos(tposRes.data.tpos || []);
        setTpoInvitations(invsRes.data.invitations || []);
      } else if (tab === "directors") {
        const [dirsRes, invsRes] = await Promise.all([
          api.get("/hierarchy/directors"),
          api.get("/invitations?role=director")
        ]);
        setDirectors(dirsRes.data.directors || []);
        setDirectorInvitations(invsRes.data.invitations || []);
      } else if (tab === "accounts") {
        const params = new URLSearchParams();
        if (roleFilter) params.append("role", roleFilter);
        if (statusFilter) params.append("status", statusFilter);
        if (searchQuery) params.append("search", searchQuery);
        const { data } = await api.get(`/hierarchy/accounts?${params.toString()}`);
        setAccounts(data.accounts || []);
      } else if (tab === "audit") {
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        const { data } = await api.get(`/hierarchy/audit-logs?${params.toString()}`);
        setAuditLogs(data.logs || []);
      } else if (tab === "settings") {
        const { data } = await api.get("/hierarchy/directorates");
        setDirectorates(data.directorates || []);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [roleFilter, statusFilter, searchQuery]);

  // Invitation Action Handlers
  const handleSendTpoInvitation = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (submitting || now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setSubmitting(true);
    setModalError("");
    setError("");
    try {
      const { data } = await api.post("/invitations", {
        name: tpoInviteForm.name?.trim(),
        email: tpoInviteForm.email?.trim().toLowerCase(),
        role: "tpo"
      });
      setShowTpoInviteModal(false);
      setTpoInviteForm({ name: "", email: "" });
      setInviteSuccessModal({
        name: data.invitation?.name || tpoInviteForm.name,
        email: data.invitation?.email || tpoInviteForm.email,
        role: "Training & Placement Officer (TPO)",
        setupLink: data.setupLink
      });
      showSuccess(`Official invitation emailed to ${data.invitation?.email || tpoInviteForm.email}.`);
      refreshAll();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || errorMessage(err);
      setModalError(msg);
      setError(msg);
      if (err.response?.status === 409) {
        refreshAll();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendDirectorInvitation = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (submitting || now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    if (dirInviteSchoolMode === "select" && !dirInviteForm.directorateId) {
      setModalError("Please select which School / Directorate this Director will lead.");
      return;
    }
    if (dirInviteSchoolMode === "custom" && !dirInviteCustomSchool.trim()) {
      setModalError("Please enter the School name or code (e.g. SOCSE, SOIT, SOB).");
      return;
    }

    setSubmitting(true);
    setModalError("");
    setError("");
    try {
      const payload = {
        name: dirInviteForm.name?.trim(),
        email: dirInviteForm.email?.trim().toLowerCase(),
        role: "director"
      };

      if (dirInviteSchoolMode === "custom") {
        payload.newSchoolName = dirInviteCustomSchool.trim();
      } else {
        payload.directorateId = dirInviteForm.directorateId || undefined;
      }

      const { data } = await api.post("/invitations", payload);
      setShowDirInviteModal(false);
      setDirInviteForm({ name: "", email: "", directorateId: "" });
      setDirInviteCustomSchool("");
      setDirInviteSchoolMode("select");
      setInviteSuccessModal({
        name: data.invitation?.name || dirInviteForm.name,
        email: data.invitation?.email || dirInviteForm.email,
        role: "Director of Institute / Faculty",
        setupLink: data.setupLink
      });
      showSuccess(`Official invitation emailed to ${data.invitation?.email || dirInviteForm.email}.`);
      refreshAll();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || errorMessage(err);
      setModalError(msg);
      setError(msg);
      if (err.response?.status === 409) {
        refreshAll();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitation = async (invitation) => {
    const now = Date.now();
    if (submitting || now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/invitations/${invitation._id || invitation.id}/resend`);
      showSuccess(`Invitation email resent to ${invitation.email}.`);
      if (data.setupLink) {
        setInviteSuccessModal({
          name: invitation.name,
          email: invitation.email,
          role: invitation.role?.toUpperCase(),
          setupLink: data.setupLink
        });
      }
      refreshAll();
    } catch (err) {
      const msg = err.response?.data?.message || errorMessage(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    if (!window.confirm(`Revoke pending invitation for ${invitation.name} (${invitation.email})?`)) return;
    try {
      await api.post(`/invitations/${invitation._id || invitation.id}/revoke`);
      showSuccess(`Invitation for ${invitation.email} has been revoked.`);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setError("");
    await Promise.all([fetchOverview(), fetchTabData(activeTab)]);
    setRefreshing(false);
  }, [fetchOverview, fetchTabData, activeTab]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOverview(), fetchTabData(activeTab)]).finally(() => setLoading(false));
  }, [fetchOverview, fetchTabData, activeTab]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const specials = "!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 7; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    pass += specials.charAt(Math.floor(Math.random() * specials.length));
    for (let i = 0; i < 3; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  // Handle TPO Creation
  const handleCreateTpo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/hierarchy/tpos", {
        ...tpoForm,
        password: tpoForm.password?.trim() || undefined,
        temporaryPassword: tpoForm.password?.trim() || tpoForm.temporaryPassword?.trim() || undefined,
        mustChangePassword: Boolean(tpoForm.mustChangePassword)
      });
      setShowTpoModal(false);
      const chosenPassword = data.credentials?.password || data.temporaryCredentials?.temporaryPassword;
      setTempCredsModal({
        name: data.tpo.name,
        email: data.tpo.email || data.credentials?.email || data.temporaryCredentials?.email,
        password: chosenPassword,
        role: "TPO",
        mustChangePassword: data.tpo?.mustChangePassword
      });
      setTpoForm({
        name: "",
        email: "",
        employeeId: "",
        phone: "",
        designation: "Head - Training & Placement Office (TPO)",
        password: "",
        temporaryPassword: "",
        mustChangePassword: false
      });
      showSuccess("TPO account created successfully!");
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Director Creation
  const handleCreateDirector = async (e) => {
    e.preventDefault();
    if (dirCreateSchoolMode === "select" && !dirForm.directorateId) {
      setError("Please select which School / Directorate this Director will lead.");
      return;
    }
    if (dirCreateSchoolMode === "custom" && !dirCreateCustomSchool.trim()) {
      setError("Please enter the School name or code (e.g. SOCSE, SOIT, SOB).");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...dirForm,
        password: dirForm.password?.trim() || undefined,
        temporaryPassword: dirForm.password?.trim() || dirForm.temporaryPassword?.trim() || undefined,
        mustChangePassword: Boolean(dirForm.mustChangePassword)
      };

      if (dirCreateSchoolMode === "custom") {
        payload.newSchoolName = dirCreateCustomSchool.trim();
        delete payload.directorateId;
      }

      const { data } = await api.post("/hierarchy/directors", payload);
      setShowDirModal(false);
      const chosenPassword = data.credentials?.password || data.temporaryCredentials?.temporaryPassword;
      setTempCredsModal({
        name: data.director.name,
        email: data.director.email || data.credentials?.email || data.temporaryCredentials?.email,
        password: chosenPassword,
        role: "Director",
        mustChangePassword: data.director?.mustChangePassword
      });
      setDirForm({
        name: "",
        email: "",
        employeeId: "",
        phone: "",
        designation: "Director of Faculty / Institute",
        qualification: "",
        directorateId: "",
        password: "",
        temporaryPassword: "",
        mustChangePassword: false
      });
      setDirCreateCustomSchool("");
      setDirCreateSchoolMode("select");
      showSuccess("Director account created successfully!");
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Directorate Creation
  const handleCreateDirectorate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/hierarchy/directorates", dirateForm);
      setShowDirateModal(false);
      setDirateForm({ name: "", code: "", description: "", building: "" });
      showSuccess("Directorate created successfully!");
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Account Status Toggle (active, inactive, suspended)
  const handleStatusChange = async (accountId, newStatus) => {
    try {
      await api.patch(`/hierarchy/accounts/${accountId}/status`, { status: newStatus });
      showSuccess(`Account status updated to ${newStatus}.`);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Reset Password
  const handleResetPassword = async (account) => {
    if (!window.confirm(`Generate a temporary password and force password change for ${account.name}?`)) return;
    try {
      const { data } = await api.post(`/hierarchy/accounts/${account._id || account.id}/reset-password`);
      setTempCredsModal({
        name: account.name,
        email: data.temporaryCredentials.email,
        password: data.temporaryCredentials.temporaryPassword,
        role: account.role?.toUpperCase()
      });
      showSuccess(`Password reset for ${account.name}.`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // Delete Account
  const confirmDeleteAccount = async () => {
    if (!deleteConfirmModal) return;
    try {
      await api.delete(`/hierarchy/accounts/${deleteConfirmModal.id}`);
      showSuccess(`Account ${deleteConfirmModal.name} deleted.`);
      setDeleteConfirmModal(null);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const copyCreds = () => {
    if (!tempCredsModal) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `College CodeRank Credentials (${tempCredsModal.role})\n\nName: ${tempCredsModal.name}\nOfficial Email: ${tempCredsModal.email}\nPassword: ${tempCredsModal.password}\nLogin URL: ${origin}/login\nPolicy: ${tempCredsModal.mustChangePassword ? "Change Password Required on First Login" : "Direct Permanent Login"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const metrics = overview?.metrics || {
    tpos: 0,
    directors: 0,
    hods: 0,
    teachers: 0,
    students: 0,
    directorates: 0,
    departments: 0,
    sections: 0
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-red-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <ShieldCheck size={13} /> Super Administrator Portal
              </span>
              <span className="text-[11px] text-slate-300">
                Chancellor Secretariat · Universal Governance
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Institutional Hierarchy & Account Control
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Manage executive roles (TPOs, Directors), monitor real-time institutional accounts, enforce security policies, and inspect audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Sync DB"}</span>
            </button>
            {onInspectTree && (
              <button
                type="button"
                onClick={onInspectTree}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer shadow-md"
              >
                <Layers size={13} />
                <span>Inspect Hierarchy Tree</span>
              </button>
            )}
          </div>
        </div>

        {/* Real Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TPOs</span>
            <strong className="text-xl font-extrabold text-white">{metrics.tpos}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Directors</span>
            <strong className="text-xl font-extrabold text-white">{metrics.directors}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">HODs</span>
            <strong className="text-xl font-extrabold text-white">{metrics.hods}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teachers</span>
            <strong className="text-xl font-extrabold text-white">{metrics.teachers}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Directorates</span>
            <strong className="text-xl font-extrabold text-white">{metrics.directorates}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Depts</span>
            <strong className="text-xl font-extrabold text-white">{metrics.departments}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sections</span>
            <strong className="text-xl font-extrabold text-white">{metrics.sections}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
            <strong className="text-xl font-extrabold text-emerald-400">{metrics.students}</strong>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError("")} className="text-rose-500 hover:text-rose-800 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-800 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. Top-Level Module Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("tpos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tpos"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Briefcase size={15} />
          <span>1. Manage TPOs</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-extrabold">
            {metrics.tpos}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("directors")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "directors"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Building size={15} />
          <span>2. Manage Directors</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-extrabold">
            {metrics.directors}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "accounts"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Users size={15} />
          <span>3. Account Management</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ShieldAlert size={15} />
          <span>4. Audit Logs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-red-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Settings size={15} />
          <span>5. System Settings</span>
        </button>
      </div>

      {/* 3. Module Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {/* ================= TAB 1: MANAGE TPOS ================= */}
        {activeTab === "tpos" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Training & Placement Officers (TPO)</h2>
                <p className="text-xs text-slate-500">
                  Only the Super Admin can issue invitations and manage authorized TPO accounts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTpoInviteModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer transition-all"
                >
                  <Mail size={15} />
                  <span>Send TPO Invitation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTpoModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  <span>Direct Add</span>
                </button>
              </div>
            </div>

            {/* Sub-Section 1: Pending & Past Email Invitations */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-red-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    TPO Email Setup Invitations ({tpoInvitations.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Single-use setup tokens · 24-hr expiry</span>
              </div>

              {tpoInvitations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No invitations issued yet. Click &quot;Send TPO Invitation&quot; to email an invitation link.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                        <th className="py-2.5 px-3">Invitee Name</th>
                        <th className="py-2.5 px-3">Official Email</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Sent At</th>
                        <th className="py-2.5 px-3">Expiry / Accepted</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tpoInvitations.map((inv) => (
                        <tr key={inv._id || inv.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{inv.email}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === "accepted"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : inv.status === "pending"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : inv.status === "revoked"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {inv.status === "pending" && <Clock size={10} />}
                              {inv.status === "accepted" && <CheckCircle2 size={10} />}
                              {inv.status.toUpperCase()}
                            </span>
                            {inv.resendCount > 0 && (
                              <span className="ml-1 text-[9px] text-slate-400">({inv.resendCount}x resent)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            {inv.lastSentAt || inv.createdAt ? new Date(inv.lastSentAt || inv.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            {inv.status === "accepted" && inv.acceptedAt ? (
                              <span className="text-emerald-700 font-semibold">
                                {new Date(inv.acceptedAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {inv.status !== "accepted" && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleResendInvitation(inv)}
                                  title="Resend Invitation Email"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                                >
                                  <RotateCcw size={11} /> Resend
                                </button>
                                {inv.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeInvitation(inv)}
                                    title="Revoke Invitation"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md cursor-pointer"
                                  >
                                    <Ban size={11} /> Revoke
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sub-Section 2: Active Database TPO Accounts */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={16} className="text-red-600" />
                  Active TPO Accounts ({tpos.length})
                </h3>
                <span className="text-[11px] text-slate-400">Authenticated university staff</span>
              </div>

              {tpos.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <Briefcase size={32} className="text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-700">No active TPO accounts found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                    Send an invitation above to onboard the college Training & Placement Officer.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3">Officer Name</th>
                        <th className="py-3 px-3">Official Email</th>
                        <th className="py-3 px-3">Employee ID</th>
                        <th className="py-3 px-3">Phone</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tpos.map((tpo) => (
                        <tr key={tpo._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <strong className="text-slate-800 font-bold block">{tpo.name}</strong>
                            <span className="text-[11px] text-slate-400">{tpo.designation}</span>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600">{tpo.email}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-500">{tpo.employeeId || "—"}</td>
                          <td className="py-3.5 px-3 text-slate-600">{tpo.phone || "—"}</td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tpo.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {tpo.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleResetPassword(tpo)}
                                title="Reset Password"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                              >
                                <KeyRound size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(tpo._id, tpo.status === "active" ? "inactive" : "active")
                                }
                                title={tpo.status === "active" ? "Deactivate" : "Activate"}
                                className={`p-1.5 rounded-lg cursor-pointer ${
                                  tpo.status === "active"
                                    ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                    : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                <Power size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmModal({ id: tpo._id, name: tpo.name, role: "tpo" })}
                                title="Delete Account"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: MANAGE DIRECTORS ================= */}
        {activeTab === "directors" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Institute & School Directors</h2>
                <p className="text-xs text-slate-500">
                  Super Admin onboards Directors and links them to university Directorates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDirInviteModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer transition-all"
                >
                  <Mail size={15} />
                  <span>Send Director Invitation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDirModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  <span>Direct Add</span>
                </button>
              </div>
            </div>

            {/* Sub-Section 1: Pending & Past Email Invitations */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-red-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Director Email Invitations ({directorInvitations.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Single-use setup tokens · 24-hr expiry</span>
              </div>

              {directorInvitations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No Director invitations issued yet. Click &quot;Send Director Invitation&quot; to email an invitation link.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                        <th className="py-2.5 px-3">Invitee Name</th>
                        <th className="py-2.5 px-3">Official Email</th>
                        <th className="py-2.5 px-3">Assigned Directorate</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Sent At</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {directorInvitations.map((inv) => (
                        <tr key={inv._id || inv.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{inv.email}</td>
                          <td className="py-2.5 px-3">
                            {inv.directorate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                {inv.directorate.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === "accepted"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : inv.status === "pending"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : inv.status === "revoked"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {inv.status === "pending" && <Clock size={10} />}
                              {inv.status === "accepted" && <CheckCircle2 size={10} />}
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            {inv.lastSentAt || inv.createdAt ? new Date(inv.lastSentAt || inv.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {inv.status !== "accepted" && (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleResendInvitation(inv)}
                                  title="Resend Invitation Email"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                                >
                                  <RotateCcw size={11} /> Resend
                                </button>
                                {inv.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeInvitation(inv)}
                                    title="Revoke Invitation"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md cursor-pointer"
                                  >
                                    <Ban size={11} /> Revoke
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sub-Section 2: Active Database Director Accounts */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Building size={16} className="text-red-600" />
                  Active Director Accounts ({directors.length})
                </h3>
                <span className="text-[11px] text-slate-400">Authenticated university leadership</span>
              </div>

              {directors.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <Building size={32} className="text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-700">No Director accounts found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                    Send an invitation above to onboard an academic Director.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-3">Director Name</th>
                        <th className="py-3 px-3">Official Email</th>
                        <th className="py-3 px-3">Assigned Directorate</th>
                        <th className="py-3 px-3">Employee ID</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {directors.map((dir) => (
                        <tr key={dir._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3">
                            <strong className="text-slate-800 font-bold block">{dir.name}</strong>
                            <span className="text-[11px] text-slate-400">{dir.designation}</span>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600">{dir.email}</td>
                          <td className="py-3.5 px-3">
                            {dir.directorateId ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                {dir.directorateId.name} ({dir.directorateId.code})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-500">{dir.employeeId || "—"}</td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dir.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {dir.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleResetPassword(dir)}
                                title="Reset Password"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                              >
                                <KeyRound size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(dir._id, dir.status === "active" ? "inactive" : "active")
                                }
                                title={dir.status === "active" ? "Deactivate" : "Activate"}
                                className={`p-1.5 rounded-lg cursor-pointer ${
                                  dir.status === "active"
                                    ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                    : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                <Power size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmModal({ id: dir._id, name: dir.name, role: "director" })
                                }
                                title="Delete Account"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: ACCOUNT MANAGEMENT ================= */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Master Account Directory</h2>
                <p className="text-xs text-slate-500">
                  Universal administrative control: activate, deactivate, suspend, or delete accounts across all hierarchy levels.
                </p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">All Roles (Universal)</option>
                <option value="super_admin">Super Admin</option>
                <option value="tpo">TPO</option>
                <option value="director">Director</option>
                <option value="hod">HOD</option>
                <option value="teacher">Teacher</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">All Account Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {accounts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Users size={32} className="mx-auto mb-2 text-slate-300" />
                <strong className="block font-bold text-slate-700">No accounts matched your filters</strong>
                <span>Try clearing search query or role filter</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Department / Directorate</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Created</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accounts.map((acc) => (
                      <tr key={acc._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-slate-800 font-bold block">{acc.name}</strong>
                          <span className="font-mono text-[11px] text-slate-500">{acc.email}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                            {acc.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {acc.departmentId?.name || acc.directorateId?.name || "Campus Secretariat"}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={acc.status}
                            onChange={(e) => handleStatusChange(acc._id, e.target.value)}
                            className={`text-[10px] font-bold rounded px-2 py-0.5 border cursor-pointer ${
                              acc.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : acc.status === "suspended"
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "bg-rose-50 text-rose-700 border-rose-300"
                            }`}
                          >
                            <option value="active">ACTIVE</option>
                            <option value="inactive">INACTIVE</option>
                            <option value="suspended">SUSPENDED</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {new Date(acc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleResetPassword(acc)}
                              title="Reset Password"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                            >
                              <KeyRound size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmModal({ id: acc._id, name: acc.name, role: acc.role })}
                              title="Delete Account"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: AUDIT LOGS ================= */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Institutional Audit Trail</h2>
                <p className="text-xs text-slate-500">
                  Tamper-evident logs tracking every user creation, credential change, status update, and deallocation.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter logs by user name, email, action, details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <ShieldAlert size={32} className="mx-auto mb-2 text-slate-300" />
                <strong className="block font-bold text-slate-700">No audit logs recorded yet</strong>
                <span>All institutional modifications will be logged automatically here</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Timestamp</th>
                      <th className="py-3 px-3">Actor / User</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Action</th>
                      <th className="py-3 px-3">Details</th>
                      <th className="py-3 px-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-800 font-bold block">{log.userName}</strong>
                          <span className="text-[11px] font-mono text-slate-500">{log.userEmail}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            {log.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 max-w-md">{log.details}</td>
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{log.ipAddress || "127.0.0.1"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: SYSTEM SETTINGS & ORGANIZATIONAL UNITS ================= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Academic Directorates & Faculties</h2>
                <p className="text-xs text-slate-500">
                  Manage the top-tier academic faculties and institutes of the university.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDirateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer transition-all"
              >
                <Plus size={15} />
                <span>+ Add Directorate</span>
              </button>
            </div>

            {directorates.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Building size={36} className="text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Directorates created yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Create academic divisions such as "Faculty of Engineering & Technology" or "School of Computing".
                </p>
                <button
                  type="button"
                  onClick={() => setShowDirateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                >
                  <Plus size={14} /> Add Directorate
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {directorates.map((dir) => (
                  <div key={dir._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          {dir.code}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-sm mt-1">{dir.name}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        dir.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {dir.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{dir.description || "No description provided."}</p>

                    <div className="pt-3 border-t border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Campus Location:</span>
                        <strong>{dir.building || "Main Tower"}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Appointed Director:</span>
                        <strong>{dir.directorId?.name || "Unassigned"}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE TPO ================= */}
      {showTpoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Briefcase size={16} className="text-red-600" />
                Create Official TPO Account
              </h3>
              <button type="button" onClick={() => setShowTpoModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTpo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alok Verma"
                  value={tpoForm.name}
                  onChange={(e) => setTpoForm({ ...tpoForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="tpo@rungta.org"
                  value={tpoForm.email}
                  onChange={(e) => setTpoForm({ ...tpoForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="EMP-TPO-01"
                    value={tpoForm.employeeId}
                    onChange={(e) => setTpoForm({ ...tpoForm, employeeId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 94252 00001"
                    value={tpoForm.phone}
                    onChange={(e) => setTpoForm({ ...tpoForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Password Setting Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Account Password (Direct Set)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generatePassword();
                      setTpoForm((prev) => ({ ...prev, password: p }));
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Quick Generate</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showTpoPassword ? "text" : "password"}
                    placeholder="Enter custom password or click Quick Generate"
                    value={tpoForm.password}
                    onChange={(e) => setTpoForm({ ...tpoForm, password: e.target.value })}
                    className="w-full text-xs pl-3 pr-10 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTpoPassword(!showTpoPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showTpoPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={tpoForm.mustChangePassword}
                    onChange={(e) => setTpoForm({ ...tpoForm, mustChangePassword: e.target.checked })}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600">
                    Require officer to change password on first login
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTpoModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create TPO Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE DIRECTOR ================= */}
      {showDirModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building size={16} className="text-red-600" />
                Create Official Director Account
              </h3>
              <button type="button" onClick={() => setShowDirModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDirector} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={dirForm.name}
                  onChange={(e) => setDirForm({ ...dirForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="director.eng@rungta.org"
                  value={dirForm.email}
                  onChange={(e) => setDirForm({ ...dirForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Assign School / Directorate (e.g. SOCSE, SOIT) <span className="text-red-500">*</span>
                  </label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDirCreateSchoolMode("select")}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        dirCreateSchoolMode === "select"
                          ? "bg-white text-red-700 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Choose from list
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirCreateSchoolMode("custom")}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        dirCreateSchoolMode === "custom"
                          ? "bg-white text-red-700 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      ✍️ Type new school
                    </button>
                  </div>
                </div>

                {dirCreateSchoolMode === "select" ? (
                  <>
                    <select
                      required={dirCreateSchoolMode === "select"}
                      value={dirForm.directorateId}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setDirCreateSchoolMode("custom");
                          setDirForm({ ...dirForm, directorateId: "" });
                        } else {
                          setDirForm({ ...dirForm, directorateId: e.target.value });
                        }
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">-- Choose School (e.g. SOCSE, SOIT) --</option>
                      {directorates.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.code} · {d.name} {d.directorId ? `(Current Director: ${d.directorId.name})` : "(Vacant)"}
                        </option>
                      ))}
                      <option value="__NEW__">✍️ + Type / write a new school name...</option>
                    </select>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      required={dirCreateSchoolMode === "custom"}
                      placeholder="e.g. SOB - School of Business, SOET, SOM..."
                      value={dirCreateCustomSchool}
                      onChange={(e) => setDirCreateCustomSchool(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-red-50/20"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Type code or name. Auto-creates School if new.</span>
                      <button
                        type="button"
                        onClick={() => setDirCreateSchoolMode("select")}
                        className="text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        ← Choose existing
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="EMP-DIR-01"
                    value={dirForm.employeeId}
                    onChange={(e) => setDirForm({ ...dirForm, employeeId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 94252 00002"
                    value={dirForm.phone}
                    onChange={(e) => setDirForm({ ...dirForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Password Setting Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Account Password (Direct Set)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generatePassword();
                      setDirForm((prev) => ({ ...prev, password: p }));
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Quick Generate</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showDirPassword ? "text" : "password"}
                    placeholder="Enter custom password or click Quick Generate"
                    value={dirForm.password}
                    onChange={(e) => setDirForm({ ...dirForm, password: e.target.value })}
                    className="w-full text-xs pl-3 pr-10 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDirPassword(!showDirPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showDirPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={dirForm.mustChangePassword}
                    onChange={(e) => setDirForm({ ...dirForm, mustChangePassword: e.target.checked })}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600">
                    Require Director to change password on first login
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Director"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DIRECTORATE ================= */}
      {showDirateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building size={16} className="text-red-600" />
                Add Directorate / Faculty
              </h3>
              <button type="button" onClick={() => setShowDirateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDirectorate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty / Directorate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty of Engineering & Technology"
                  value={dirateForm.name}
                  onChange={(e) => setDirateForm({ ...dirateForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="FET"
                    value={dirateForm.code}
                    onChange={(e) => setDirateForm({ ...dirateForm, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Campus Building</label>
                  <input
                    type="text"
                    placeholder="Block A - Main Tower"
                    value={dirateForm.building}
                    onChange={(e) => setDirateForm({ ...dirateForm, building: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief overview of disciplines covered..."
                  value={dirateForm.description}
                  onChange={(e) => setDirateForm({ ...dirateForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Directorate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREDENTIALS POPUP ================= */}
      {tempCredsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>{tempCredsModal.role} Account Credentials Created</span>
            </div>

            <p className="text-xs text-slate-600">
              The {tempCredsModal.role} account for <strong>{tempCredsModal.name}</strong> has been configured. Share these credentials with the user:
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                <span className="text-slate-400">Official Email:</span>
                <strong className="text-slate-800 font-bold">{tempCredsModal.email}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Password:</span>
                <strong className="text-red-600 text-sm font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 select-all">
                  {tempCredsModal.password}
                </strong>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                <span className="text-slate-400">First-Login Policy:</span>
                <span className="text-slate-600 font-sans">
                  {tempCredsModal.mustChangePassword ? "Change Password Required" : "Direct Permanent Login"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={copyCreds}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? "Copied All Credentials!" : "Copy Credentials"}</span>
              </button>
              <button
                type="button"
                onClick={() => setTempCredsModal(null)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DELETION ================= */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
              <AlertCircle size={18} className="text-rose-600" />
              <span>Confirm Account Deletion</span>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete the account for <strong>{deleteConfirmModal.name}</strong> ({deleteConfirmModal.role})?
              All organizational references and assignments will be safely cleared.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL: INVITE TPO ================= */}
      {showTpoInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Mail size={16} className="text-red-600" />
                Issue TPO Account Invitation
              </h3>
              <button
                type="button"
                onClick={() => setShowTpoInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-red-50/70 border border-red-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Assigned Role</span>
                <span className="text-xs font-bold text-red-950">Training & Placement Officer (TPO)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-200/80 text-red-800">
                Institutional Level
              </span>
            </div>

            <form onSubmit={handleSendTpoInvitation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Alok Verma"
                  value={tpoInviteForm.name}
                  onChange={(e) => setTpoInviteForm({ ...tpoInviteForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="tpo.central@rungta.org"
                  value={tpoInviteForm.email}
                  onChange={(e) => setTpoInviteForm({ ...tpoInviteForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                ⏳ <strong>Secure Single-Use Link:</strong> A cryptographic invitation token valid for 24 hours will be emailed. The officer will set and verify their own secure password upon activation.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowTpoInviteModal(false);
                    setModalError("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Invitation Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVITE DIRECTOR ================= */}
      {showDirInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Mail size={16} className="text-red-600" />
                Issue Director Account Invitation
              </h3>
              <button
                type="button"
                onClick={() => setShowDirInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-red-50/70 border border-red-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Assigned Role</span>
                <span className="text-xs font-bold text-red-950">Director of Faculty / Institute</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-200/80 text-red-800">
                School Leadership
              </span>
            </div>

            <form onSubmit={handleSendDirectorInvitation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={dirInviteForm.name}
                  onChange={(e) => setDirInviteForm({ ...dirInviteForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="director.eng@rungta.org"
                  value={dirInviteForm.email}
                  onChange={(e) => setDirInviteForm({ ...dirInviteForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Assign School / Directorate (e.g. SOCSE, SOIT) <span className="text-red-500">*</span>
                  </label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDirInviteSchoolMode("select")}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        dirInviteSchoolMode === "select"
                          ? "bg-white text-red-700 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Choose from list
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirInviteSchoolMode("custom")}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        dirInviteSchoolMode === "custom"
                          ? "bg-white text-red-700 shadow-xs font-bold"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      ✍️ Type new school
                    </button>
                  </div>
                </div>

                {dirInviteSchoolMode === "select" ? (
                  <>
                    <select
                      required={dirInviteSchoolMode === "select"}
                      value={dirInviteForm.directorateId}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setDirInviteSchoolMode("custom");
                          setDirInviteForm({ ...dirInviteForm, directorateId: "" });
                        } else {
                          setDirInviteForm({ ...dirInviteForm, directorateId: e.target.value });
                        }
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">-- Choose School (e.g. SOCSE, SOIT) --</option>
                      {directorates.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.code} · {d.name} {d.directorId ? `(Current Director: ${d.directorId.name})` : "(Vacant)"}
                        </option>
                      ))}
                      <option value="__NEW__">✍️ + Type / write a new school name...</option>
                    </select>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      required={dirInviteSchoolMode === "custom"}
                      placeholder="e.g. SOB - School of Business, SOET, SOM..."
                      value={dirInviteCustomSchool}
                      onChange={(e) => setDirInviteCustomSchool(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-red-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-red-50/20"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Type code or name. Auto-creates School if new.</span>
                      <button
                        type="button"
                        onClick={() => setDirInviteSchoolMode("select")}
                        className="text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        ← Choose existing
                      </button>
                    </div>
                  </>
                )}
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                ⏳ <strong>Secure Single-Use Link:</strong> A cryptographic invitation token valid for 24 hours will be delivered. The Director will choose and confirm their password upon opening the setup link.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowDirInviteModal(false);
                    setModalError("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Invitation Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVITATION DISPATCH SUCCESS ================= */}
      {inviteSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>Official Invitation Dispatched</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              An official setup invitation was sent to <strong>{inviteSuccessModal.name}</strong> ({inviteSuccessModal.email}) for the role of <strong>{inviteSuccessModal.role}</strong>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span>Email Delivery &amp; Spam Notice:</span>
              </div>
              <p className="text-amber-800 leading-normal">
                If the email is not visible in the recipient&apos;s primary Inbox, please have them check their <strong>Spam / Junk</strong> folder. You can also copy and share the single-use link directly with them below.
              </p>
            </div>

            {inviteSuccessModal.setupLink && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 block">Single-Use Setup Link:</span>
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-red-600 break-all select-all">
                  {inviteSuccessModal.setupLink}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {inviteSuccessModal.setupLink && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteSuccessModal.setupLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? "Link Copied!" : "Copy Link"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInviteSuccessModal(null)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
