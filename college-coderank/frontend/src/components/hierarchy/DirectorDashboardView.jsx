"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Building,
  GraduationCap,
  Users,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Power,
  X,
  Layers,
  DoorOpen,
  Mail,
  Send,
  Clock,
  RotateCcw,
  Ban,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";
import HierarchyProfileInspectorModal from "./HierarchyProfileInspectorModal.jsx";

const STANDARD_DEPT_OPTIONS = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "AI & DS", name: "Artificial Intelligence & Data Science" },
  { code: "AIML", name: "Artificial Intelligence & Machine Learning" },
  { code: "IT", name: "Information Technology" },
  { code: "CYBER", name: "Cyber Security & Digital Forensics" },
  { code: "DS", name: "Data Science & Big Data" },
  { code: "CLOUD", name: "Cloud Computing & DevOps" },
  { code: "SE", name: "Software Engineering" },
  { code: "ECE", name: "Electronics & Communication Engineering" },
  { code: "EEE", name: "Electrical & Electronics Engineering" },
  { code: "ME", name: "Mechanical Engineering" },
  { code: "CE", name: "Civil Engineering" },
  { code: "MBA", name: "Master of Business Administration (MBA)" },
  { code: "PHARM", name: "Pharmaceutical Sciences" }
];

export default function DirectorDashboardView() {
  const [data, setData] = useState(null);
  const [hodInvitations, setHodInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const lastSubmitRef = useRef(0);

  const [activeTab, setActiveTab] = useState("hods"); // "hods" | "departments"
  const [showHodModal, setShowHodModal] = useState(false);
  const [showHodInviteModal, setShowHodInviteModal] = useState(false);
  const [hodAddMode, setHodAddMode] = useState("invite"); // "invite" | "manual"
  const [showPassword, setShowPassword] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deletingDept, setDeletingDept] = useState(false);
  const [tempCredsModal, setTempCredsModal] = useState(null);
  const [inviteSuccessModal, setInviteSuccessModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [inspectTargetId, setInspectTargetId] = useState(null);

  // Forms
  const [hodInviteForm, setHodInviteForm] = useState({
    name: "",
    email: "",
    departmentId: ""
  });
  const [hodInviteDeptMode, setHodInviteDeptMode] = useState("select"); // "select" | "custom"
  const [hodInviteCustomDept, setHodInviteCustomDept] = useState("");
  const [hodCreateDeptMode, setHodCreateDeptMode] = useState("select"); // "select" | "custom"
  const [hodCreateCustomDept, setHodCreateCustomDept] = useState("");

  const [hodForm, setHodForm] = useState({
    name: "",
    email: "",
    departmentId: "",
    employeeId: "",
    phone: "",
    designation: "Head of Department (HOD)",
    password: "",
    mustChangePassword: true
  });

  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    buildingBlock: "",
    floor: "",
    contactEmail: ""
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [res, invsRes] = await Promise.all([
        api.get("/hierarchy/director/overview"),
        api.get("/invitations?role=hod")
      ]);
      setData(res.data);
      setHodInvitations(invsRes.data.invitations || []);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const handleSendHodInvitation = async (e) => {
    e.preventDefault();
    if (hodInviteDeptMode === "select" && !hodInviteForm.departmentId) {
      setModalError("Please select an academic department for the HOD.");
      return;
    }
    if (hodInviteDeptMode === "custom" && !hodInviteCustomDept.trim()) {
      setModalError("Please enter the Department name or code (e.g. AIML, IT, Cyber Security).");
      return;
    }
    const now = Date.now();
    if (submitting || now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setSubmitting(true);
    setModalError("");
    setError("");
    try {
      const payload = {
        name: hodInviteForm.name?.trim(),
        email: hodInviteForm.email?.trim().toLowerCase(),
        role: "hod"
      };

      if (hodInviteDeptMode === "custom") {
        payload.newDepartmentName = hodInviteCustomDept.trim();
      } else {
        payload.departmentId = hodInviteForm.departmentId;
      }

      const { data: res } = await api.post("/invitations", payload);
      setShowHodInviteModal(false);
      setShowHodModal(false);
      setHodInviteForm({ name: "", email: "", departmentId: "" });
      setHodInviteCustomDept("");
      setHodInviteDeptMode("select");
      setInviteSuccessModal({
        name: res.invitation?.name || hodInviteForm.name,
        email: res.invitation?.email || hodInviteForm.email,
        role: "Head of Department (HOD)",
        setupLink: res.setupLink
      });
      showSuccess(`Official HOD setup invitation emailed to ${res.invitation?.email || hodInviteForm.email}.`);
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
      const { data: res } = await api.post(`/invitations/${invitation._id || invitation.id}/resend`);
      showSuccess(`Invitation email resent to ${invitation.email}.`);
      if (res.setupLink) {
        setInviteSuccessModal({
          name: invitation.name,
          email: invitation.email,
          role: "Head of Department (HOD)",
          setupLink: res.setupLink
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

  const refreshAll = async () => {
    setRefreshing(true);
    setError("");
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    const dirId = data?.directorate?._id || data?.directorate?.id;
    if (!dirId) {
      setModalError("No assigned Directorate found.");
      return;
    }
    setSubmitting(true);
    setError("");
    setModalError("");
    try {
      const { data: res } = await api.post("/hierarchy/departments", {
        ...deptForm,
        name: deptForm.name?.trim(),
        code: deptForm.code?.trim().toUpperCase(),
        directorateId: dirId
      });
      setShowDeptModal(false);
      setDeptForm({ name: "", code: "", buildingBlock: "", floor: "", contactEmail: "" });
      showSuccess(res.message || "Department added to your Directorate.");
      refreshAll();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || errorMessage(err);
      setModalError(msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deptToDelete) return;
    setDeletingDept(true);
    setError("");
    try {
      const deptId = deptToDelete._id || deptToDelete.id;
      const { data: res } = await api.delete(`/hierarchy/departments/${deptId}`);
      showSuccess(res.message || `Department "${deptToDelete.name}" deleted successfully.`);
      setDeptToDelete(null);
      refreshAll();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || errorMessage(err);
      setError(msg);
    } finally {
      setDeletingDept(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const specials = "!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 7; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    pass += specials.charAt(Math.floor(Math.random() * specials.length));
    for (let i = 0; i < 3; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setHodForm((prev) => ({ ...prev, password: pass }));
  };

  const handleCreateHod = async (e) => {
    e.preventDefault();
    if (hodCreateDeptMode === "select" && !hodForm.departmentId) {
      setError("Please select a department for the HOD.");
      return;
    }
    if (hodCreateDeptMode === "custom" && !hodCreateCustomDept.trim()) {
      setError("Please enter the Department name or code (e.g. AIML, IT, Cyber Security).");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...hodForm,
        password: hodForm.password?.trim() || undefined,
        temporaryPassword: hodForm.password?.trim() || undefined,
        mustChangePassword: Boolean(hodForm.mustChangePassword)
      };

      if (hodCreateDeptMode === "custom") {
        payload.newDepartmentName = hodCreateCustomDept.trim();
        delete payload.departmentId;
      }

      const { data: res } = await api.post("/hierarchy/director/hods", payload);
      setShowHodModal(false);
      setShowHodInviteModal(false);
      const chosenPass = res.credentials?.password || res.temporaryCredentials?.temporaryPassword;
      setTempCredsModal({
        name: res.hod.name,
        email: res.hod.email,
        password: chosenPass,
        mustChangePassword: res.hod.mustChangePassword
      });
      setHodForm({
        name: "",
        email: "",
        departmentId: "",
        employeeId: "",
        phone: "",
        designation: "Head of Department (HOD)",
        password: "",
        mustChangePassword: true
      });
      setHodCreateCustomDept("");
      setHodCreateDeptMode("select");
      showSuccess(`HOD account created successfully.`);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleHodStatusToggle = async (hod) => {
    const nextStatus = hod.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/hierarchy/accounts/${hod._id}/status`, { status: nextStatus });
      showSuccess(`HOD status updated to ${nextStatus}.`);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const copyCreds = () => {
    if (!tempCredsModal) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `College CodeRank - Head of Department (HOD) Credentials\n\nName: ${tempCredsModal.name}\nOfficial Email: ${tempCredsModal.email}\nPassword: ${tempCredsModal.password}\nLogin URL: ${origin}/login\n\nStatus: Active Account`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const directorate = data?.directorate;
  const departments = data?.departments || [];
  const hods = data?.hods || [];
  const metrics = data?.metrics || {
    departmentsCount: 0,
    hodsCount: 0,
    teachersCount: 0,
    studentsCount: 0
  };

  return (
    <div className="space-y-6">
      {/* Directorate Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-amber-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Building size={13} /> Director Portal
              </span>
              <span className="text-[11px] text-slate-300">
                {directorate ? `${directorate.name} (${directorate.code})` : "Unassigned Directorate"}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {directorate ? directorate.name : "Director Governance Dashboard"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Manage departments, appoint HOD accounts within your authorized faculty scope, and oversee faculty teaching resources.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Refreshing..." : "Sync DB"}</span>
          </button>
        </div>

        {/* Real Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Departments</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.departmentsCount}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Appointed HODs</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.hodsCount}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Faculty Teachers</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.teachersCount}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Enrolled Students</span>
            <strong className="text-2xl font-extrabold text-emerald-400 mt-1 block">{metrics.studentsCount}</strong>
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

      {!directorate ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Directorate Assigned</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Your Director account is not currently linked to an academic Directorate. Contact the Super Administrator to assign your faculty.
          </p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("hods")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "hods" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <GraduationCap size={15} />
              <span>1. Manage HOD Accounts</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-extrabold">
                {hods.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("departments")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "departments" ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers size={15} />
              <span>2. Faculty Departments</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-extrabold">
                {departments.length}
              </span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            {/* TAB: HOD MANAGEMENT */}
            {activeTab === "hods" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Department Heads (HODs)</h2>
                    <p className="text-xs text-slate-500">
                      Appoint and manage HOD accounts for departments within {directorate.name}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHodAddMode("invite");
                        setShowHodModal(true);
                      }}
                      disabled={departments.length === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Mail size={15} />
                      <span>Send HOD Invitation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHodAddMode("manual");
                        setShowHodModal(true);
                      }}
                      disabled={departments.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <KeyRound size={14} className="text-amber-600" />
                      <span>Direct Appoint (Set Password)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Section 1: HOD Email Invitations */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-amber-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        HOD Email Setup Invitations ({hodInvitations.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Single-use setup tokens · 24-hr expiry</span>
                  </div>

                  {hodInvitations.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No HOD invitations pending. Click &quot;Send HOD Invitation&quot; to invite a Department Head.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                            <th className="py-2.5 px-3">Invitee Name</th>
                            <th className="py-2.5 px-3">Official Email</th>
                            <th className="py-2.5 px-3">Assigned Department</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Sent At</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {hodInvitations.map((inv) => (
                            <tr key={inv._id || inv.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.name}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{inv.email}</td>
                              <td className="py-2.5 px-3">
                                {inv.department ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    {inv.department.name}
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
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md cursor-pointer"
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

                {/* Sub-Section 2: Active Appointed HODs */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap size={16} className="text-amber-600" />
                      Active Appointed HODs ({hods.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">Authenticated department heads</span>
                  </div>

                  {hods.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <GraduationCap size={32} className="text-slate-300 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-slate-700">No active HOD accounts found</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                        {departments.length === 0
                          ? "Add a department in Tab 2 before inviting an HOD."
                          : "Send an invitation above to appoint a Head of Department."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-3">HOD Name</th>
                            <th className="py-3 px-3">Official Email</th>
                            <th className="py-3 px-3">Department</th>
                            <th className="py-3 px-3">Employee ID</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {hods.map((hod) => {
                            const dept = departments.find((d) => String(d._id) === String(hod.departmentId));
                            return (
                              <tr key={hod._id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => setInspectTargetId(hod._id)}
                                    className="text-left group cursor-pointer block"
                                    title="Click to inspect HOD, teachers, sections, and students"
                                  >
                                    <strong className="text-slate-800 font-bold group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                                      {hod.name}
                                      <Eye size={12} className="opacity-0 group-hover:opacity-100 text-amber-600 transition-opacity" />
                                    </strong>
                                    <span className="text-[11px] text-slate-400 block">{hod.designation}</span>
                                  </button>
                                </td>
                                <td className="py-3.5 px-3 font-mono text-slate-600">{hod.email}</td>
                                <td className="py-3.5 px-3">
                                  <span className="font-bold text-slate-700">{dept?.name || "Assigned Department"}</span>
                                </td>
                                <td className="py-3.5 px-3 font-mono text-slate-500">{hod.employeeId || "—"}</td>
                                <td className="py-3.5 px-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      hod.status === "active"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {hod.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setInspectTargetId(hod._id)}
                                      title="Inspect HOD & Teachers Tree"
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleHodStatusToggle(hod)}
                                      title={hod.status === "active" ? "Deactivate HOD" : "Activate HOD"}
                                      className={`p-1.5 rounded-lg cursor-pointer ${
                                        hod.status === "active"
                                          ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                          : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                      }`}
                                    >
                                      <Power size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DEPARTMENTS */}
            {activeTab === "departments" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Departments in {directorate.name}</h2>
                    <p className="text-xs text-slate-500">
                      Manage, add, and delete academic departments under your faculty leadership.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModalError("");
                      setShowDeptModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer transition-all"
                  >
                    <Plus size={15} />
                    <span>+ Add Department</span>
                  </button>
                </div>

                {departments.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Layers size={36} className="text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">No departments added yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Create departments like "Computer Science & Engineering" or "Data Science" under your Directorate.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalError("");
                        setShowDeptModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                    >
                      <Plus size={14} /> Add Department
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((dept) => (
                      <div key={dept._id || dept.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                            {dept.code || "DEPT"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {dept.buildingBlock ? `${dept.buildingBlock}${dept.floor ? ` · ${dept.floor}` : ""}` : "Campus Complex"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-sm">{dept.name}</h3>
                          {dept.contactEmail && (
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{dept.contactEmail}</p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                          <div className="text-slate-600">
                            <span className="text-slate-400 mr-1.5">Appointed HOD:</span>
                            {dept.hodId?.name ? (
                              <button
                                type="button"
                                onClick={() => setInspectTargetId(dept.hodId._id || dept.hodId)}
                                className="font-bold text-slate-800 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Click to inspect HOD, teachers, and student rosters"
                              >
                                <span>{dept.hodId.name}</span>
                                <Eye size={12} className="text-amber-600" />
                              </button>
                            ) : (
                              <strong className="text-amber-600 italic">Vacant</strong>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeptToDelete(dept)}
                            title={`Delete Department ${dept.name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Add Department */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Layers size={16} className="text-amber-600" />
                Add Department to {directorate?.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDeptModal(false);
                  setModalError("");
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDept} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Engineering"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="MECH"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Building Block</label>
                  <input
                    type="text"
                    placeholder="Block B"
                    value={deptForm.buildingBlock}
                    onChange={(e) => setDeptForm({ ...deptForm, buildingBlock: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor</label>
                  <input
                    type="text"
                    placeholder="2nd Floor"
                    value={deptForm.floor}
                    onChange={(e) => setDeptForm({ ...deptForm, floor: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="dept.mech@rungta.org"
                    value={deptForm.contactEmail}
                    onChange={(e) => setDeptForm({ ...deptForm, contactEmail: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeptModal(false);
                    setModalError("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Department</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Department Confirmation */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Delete Department</h3>
                <p className="text-xs text-slate-500">Confirm permanent removal of this department</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete department <strong className="text-slate-900 font-bold">"{deptToDelete.name}"</strong> ({deptToDelete.code || "NO_CODE"}) from <strong className="text-slate-900">{directorate.name}</strong>?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-normal">
              <strong>Safety Notice:</strong> Deletion will only proceed if no active students, sections, or staff members are currently assigned to this department.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deletingDept}
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingDept}
                onClick={handleDeleteDept}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deletingDept ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Modal: Onboard HOD (Email Invite OR Manual Password Creation) */}
      {(showHodModal || showHodInviteModal) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <GraduationCap size={18} className="text-amber-600" />
                <span>Onboard Head of Department (HOD)</span>
              </h3>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowHodModal(false);
                  setShowHodInviteModal(false);
                  setModalError("");
                  setHodInviteDeptMode("select");
                  setHodInviteCustomDept("");
                  setHodCreateDeptMode("select");
                  setHodCreateCustomDept("");
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Notification Inside Modal */}
            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setHodAddMode("invite")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hodAddMode === "invite"
                    ? "bg-white text-amber-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Mail size={14} className={hodAddMode === "invite" ? "text-amber-600" : ""} />
                <span>Send Email Invitation</span>
              </button>
              <button
                type="button"
                onClick={() => setHodAddMode("manual")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hodAddMode === "manual"
                    ? "bg-white text-amber-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <KeyRound size={14} className={hodAddMode === "manual" ? "text-amber-600" : ""} />
                <span>Manual Creation &amp; Password</span>
              </button>
            </div>

            {/* MODE 1: SEND EMAIL INVITATION */}
            {hodAddMode === "invite" && (
              <form onSubmit={handleSendHodInvitation} className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Assigned Role</span>
                    <span className="text-xs font-bold text-amber-950">Head of Department (HOD)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900">
                    Email Setup Link
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Academic Department <span className="text-amber-500">*</span>
                    </label>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setHodInviteDeptMode("select")}
                        className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                          hodInviteDeptMode === "select"
                            ? "bg-white text-amber-800 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Choose from list
                      </button>
                      <button
                        type="button"
                        onClick={() => setHodInviteDeptMode("custom")}
                        className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                          hodInviteDeptMode === "custom"
                            ? "bg-white text-amber-800 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        ✍️ Type new department
                      </button>
                    </div>
                  </div>

                  {hodInviteDeptMode === "select" ? (
                    <>
                      <select
                        required={hodInviteDeptMode === "select"}
                        value={hodInviteForm.departmentId}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setHodInviteDeptMode("custom");
                            setHodInviteForm({ ...hodInviteForm, departmentId: "" });
                          } else {
                            setHodInviteForm({ ...hodInviteForm, departmentId: e.target.value });
                          }
                        }}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      >
                        <option value="">-- Select Department in Your Directorate --</option>
                        {departments.length > 0 && (
                          <optgroup label="Directorate Departments">
                            {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name} ({dept.code || "DEPT"}) {dept.hodId ? `· Current: ${dept.hodId.name}` : "· Vacant"}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Standard University Departments">
                          {STANDARD_DEPT_OPTIONS.filter(
                            (std) => !departments.some((d) => (d.code || "").toUpperCase() === std.code.toUpperCase())
                          ).map((std) => (
                            <option key={std.code} value={std.name}>
                              {std.name} ({std.code})
                            </option>
                          ))}
                        </optgroup>
                        <option value="__NEW__">✍️ + Type / write another department name...</option>
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Select which academic department this HOD will head, or switch to typing a new one.
                      </span>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        required={hodInviteDeptMode === "custom"}
                        placeholder="e.g. AIML, IT, Cyber Security, ECE, Mechanical, MBA..."
                        value={hodInviteCustomDept}
                        onChange={(e) => setHodInviteCustomDept(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50/20"
                        autoFocus
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Type department name or code. System auto-creates it if new.</span>
                        <button
                          type="button"
                          onClick={() => setHodInviteDeptMode("select")}
                          className="text-amber-600 font-semibold hover:underline cursor-pointer"
                        >
                          ← Choose existing
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sunita Rao"
                    value={hodInviteForm.name}
                    onChange={(e) => setHodInviteForm({ ...hodInviteForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="hod.cse@rungta.org"
                    value={hodInviteForm.email}
                    onChange={(e) => setHodInviteForm({ ...hodInviteForm, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                  ⏳ <strong>Single-Use Link:</strong> An invitation link valid for 24 hours will be sent to the HOD&apos;s email. They will set their own password and activate their account directly.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setShowHodModal(false);
                      setShowHodInviteModal(false);
                      setModalError("");
                      setHodInviteDeptMode("select");
                      setHodInviteCustomDept("");
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Sending Invitation...</span>
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
            )}

            {/* MODE 2: MANUAL CREATION WITH PASSWORD */}
            {hodAddMode === "manual" && (
              <form onSubmit={handleCreateHod} className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Direct Account Setup</span>
                    <span className="text-xs font-bold text-amber-950">Active HOD Profile &amp; Custom Password</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Instant Activation
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Academic Department <span className="text-amber-500">*</span>
                    </label>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setHodCreateDeptMode("select")}
                        className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                          hodCreateDeptMode === "select"
                            ? "bg-white text-amber-800 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Choose from list
                      </button>
                      <button
                        type="button"
                        onClick={() => setHodCreateDeptMode("custom")}
                        className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                          hodCreateDeptMode === "custom"
                            ? "bg-white text-amber-800 shadow-xs font-bold"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        ✍️ Type new department
                      </button>
                    </div>
                  </div>

                  {hodCreateDeptMode === "select" ? (
                    <>
                      <select
                        required={hodCreateDeptMode === "select"}
                        value={hodForm.departmentId}
                        onChange={(e) => {
                          if (e.target.value === "__NEW__") {
                            setHodCreateDeptMode("custom");
                            setHodForm({ ...hodForm, departmentId: "" });
                          } else {
                            setHodForm({ ...hodForm, departmentId: e.target.value });
                          }
                        }}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      >
                        <option value="">-- Select Department in Your Directorate --</option>
                        {departments.length > 0 && (
                          <optgroup label="Directorate Departments">
                            {departments.map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.name} ({d.code || "DEPT"}) {d.hodId ? `· Current: ${d.hodId.name}` : "· Vacant"}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Standard University Departments">
                          {STANDARD_DEPT_OPTIONS.filter(
                            (std) => !departments.some((d) => (d.code || "").toUpperCase() === std.code.toUpperCase())
                          ).map((std) => (
                            <option key={std.code} value={std.name}>
                              {std.name} ({std.code})
                            </option>
                          ))}
                        </optgroup>
                        <option value="__NEW__">✍️ + Type / write another department name...</option>
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Select which academic department this HOD will head, or switch to typing a new one.
                      </span>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        required={hodCreateDeptMode === "custom"}
                        placeholder="e.g. AIML, IT, Cyber Security, ECE, Mechanical, MBA..."
                        value={hodCreateCustomDept}
                        onChange={(e) => setHodCreateCustomDept(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50/20"
                        autoFocus
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Type department name or code. System auto-creates it if new.</span>
                        <button
                          type="button"
                          onClick={() => setHodCreateDeptMode("select")}
                          className="text-amber-600 font-semibold hover:underline cursor-pointer"
                        >
                          ← Choose existing
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Anand Mishra"
                      value={hodForm.name}
                      onChange={(e) => setHodForm({ ...hodForm, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="hod.cse@rungta.org"
                      value={hodForm.email}
                      onChange={(e) => setHodForm({ ...hodForm, email: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Password Setting Section */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Account Password *
                    </label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>Quick Generate</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter strong password or click Quick Generate"
                      value={hodForm.password}
                      onChange={(e) => setHodForm({ ...hodForm, password: e.target.value })}
                      className="w-full text-xs pl-3 pr-10 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={hodForm.mustChangePassword}
                      onChange={(e) => setHodForm({ ...hodForm, mustChangePassword: e.target.checked })}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-600">
                      Force HOD to change password on first login
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="EMP-HOD-01"
                      value={hodForm.employeeId}
                      onChange={(e) => setHodForm({ ...hodForm, employeeId: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+91 94252 00003"
                      value={hodForm.phone}
                      onChange={(e) => setHodForm({ ...hodForm, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHodModal(false);
                      setShowHodInviteModal(false);
                      setHodCreateDeptMode("select");
                      setHodCreateCustomDept("");
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound size={13} />
                    {submitting ? "Creating..." : "Create HOD Account Now"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Credentials Created Confirmation Card */}
      {tempCredsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>HOD Account Created Successfully!</span>
            </div>

            <p className="text-xs text-slate-600">
              The HOD account for <strong>{tempCredsModal.name}</strong> has been created with direct access. Share these credentials with the user:
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                <span className="text-slate-400">Official Email:</span>
                <strong className="text-slate-800 font-bold">{tempCredsModal.email}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Password:</span>
                <strong className="text-amber-700 text-sm font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 select-all">
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
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVITATION DISPATCH SUCCESS ================= */}
      {inviteSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-100 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>HOD Invitation Dispatched</span>
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
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-amber-800 break-all select-all">
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
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DEEP HIERARCHICAL PROFILE INSPECTOR ================= */}
      {inspectTargetId && (
        <HierarchyProfileInspectorModal
          targetId={inspectTargetId}
          onClose={() => setInspectTargetId(null)}
        />
      )}
    </div>
  );
}
