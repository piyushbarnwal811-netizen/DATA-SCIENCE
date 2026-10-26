"use client";

import { useState, useEffect, useCallback } from "react";
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
  Sparkles
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";

export default function DirectorDashboardView() {
  const [data, setData] = useState(null);
  const [hodInvitations, setHodInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [activeTab, setActiveTab] = useState("hods"); // "hods" | "departments"
  const [showHodModal, setShowHodModal] = useState(false);
  const [showHodInviteModal, setShowHodInviteModal] = useState(false);
  const [hodAddMode, setHodAddMode] = useState("invite"); // "invite" | "manual"
  const [showPassword, setShowPassword] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [tempCredsModal, setTempCredsModal] = useState(null);
  const [inviteSuccessModal, setInviteSuccessModal] = useState(null);
  const [copied, setCopied] = useState(false);

  // Forms
  const [hodInviteForm, setHodInviteForm] = useState({
    name: "",
    email: "",
    departmentId: ""
  });

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
    if (!hodInviteForm.departmentId) {
      setError("Please select a department for the HOD.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data: res } = await api.post("/invitations", {
        name: hodInviteForm.name,
        email: hodInviteForm.email,
        role: "hod",
        departmentId: hodInviteForm.departmentId
      });
      setShowHodInviteModal(false);
      setHodInviteForm({ name: "", email: "", departmentId: "" });
      setInviteSuccessModal({
        name: res.invitation.name,
        email: res.invitation.email,
        role: "Head of Department (HOD)",
        setupLink: res.setupLink
      });
      showSuccess(`Official HOD setup invitation emailed to ${res.invitation.email}.`);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitation = async (invitation) => {
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
      setError(errorMessage(err));
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
    if (!data?.directorate?._id) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/hierarchy/departments", {
        ...deptForm,
        directorateId: data.directorate._id
      });
      setShowDeptModal(false);
      setDeptForm({ name: "", code: "", buildingBlock: "", floor: "", contactEmail: "" });
      showSuccess("Department added to your Directorate.");
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
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
    if (!hodForm.departmentId) {
      setError("Please select a department for the HOD.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data: res } = await api.post("/hierarchy/director/hods", {
        ...hodForm,
        password: hodForm.password?.trim() || undefined,
        temporaryPassword: hodForm.password?.trim() || undefined,
        mustChangePassword: Boolean(hodForm.mustChangePassword)
      });
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
                                  <strong className="text-slate-800 font-bold block">{hod.name}</strong>
                                  <span className="text-[11px] text-slate-400">{hod.designation}</span>
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
                      Academic departments under your faculty leadership.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeptModal(true)}
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
                      onClick={() => setShowDeptModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
                    >
                      <Plus size={14} /> Add Department
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((dept) => (
                      <div key={dept._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {dept.code || "DEPT"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {dept.buildingBlock ? `${dept.buildingBlock} · ${dept.floor || ""}` : "Campus Tower"}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm">{dept.name}</h3>
                        <div className="pt-2 border-t border-slate-200 text-xs flex justify-between text-slate-600">
                          <span>Appointed HOD:</span>
                          <strong className="text-slate-800">{dept.hodId?.name || "Vacant"}</strong>
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
              <button type="button" onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
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
                    placeholder="CSE"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Building Block</label>
                  <input
                    type="text"
                    placeholder="Block A"
                    value={deptForm.buildingBlock}
                    onChange={(e) => setDeptForm({ ...deptForm, buildingBlock: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Department"}
                </button>
              </div>
            </form>
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
                onClick={() => {
                  setShowHodModal(false);
                  setShowHodInviteModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Department *</label>
                  <select
                    required
                    value={hodInviteForm.departmentId}
                    onChange={(e) => setHodInviteForm({ ...hodInviteForm, departmentId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Select Department in Your Directorate --</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code || "DEPT"})
                      </option>
                    ))}
                  </select>
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
                    onClick={() => {
                      setShowHodModal(false);
                      setShowHodInviteModal(false);
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
                    <Send size={13} />
                    {submitting ? "Sending..." : "Send Invitation Link"}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Department *</label>
                  <select
                    required
                    value={hodForm.departmentId}
                    onChange={(e) => setHodForm({ ...hodForm, departmentId: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Select Department in Your Directorate --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code || "DEPT"})
                      </option>
                    ))}
                  </select>
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
    </div>
  );
}
