"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Power,
  X,
  Layers,
  Award,
  Link as LinkIcon,
  Mail,
  Send,
  Clock,
  RotateCcw,
  Ban,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Loader2
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";

export default function HodDashboardView() {
  const [data, setData] = useState(null);
  const [teacherInvitations, setTeacherInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const lastSubmitRef = useRef(0);

  const [activeTab, setActiveTab] = useState("teachers"); // "teachers" | "sections" | "subjects"
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showTeacherInviteModal, setShowTeacherInviteModal] = useState(false);
  const [teacherAddMode, setTeacherAddMode] = useState("invite"); // "invite" | "manual"
  const [showPassword, setShowPassword] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null); // teacher to assign
  const [tempCredsModal, setTempCredsModal] = useState(null);
  const [inviteSuccessModal, setInviteSuccessModal] = useState(null);
  const [copied, setCopied] = useState(false);

  // Forms
  const [teacherInviteForm, setTeacherInviteForm] = useState({
    name: "",
    email: ""
  });

  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    phone: "",
    designation: "Assistant Professor",
    qualification: "",
    password: "",
    mustChangePassword: true
  });

  const [sectionForm, setSectionForm] = useState({
    name: "",
    year: "3",
    semester: "5",
    capacity: "60"
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    credits: "4",
    semester: "5",
    type: "Theory"
  });

  const [assignmentForm, setAssignmentForm] = useState({
    sectionId: "",
    subject: "",
    isClassTeacher: false
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [res, invsRes] = await Promise.all([
        api.get("/hierarchy/hod/overview"),
        api.get("/invitations?role=teacher")
      ]);
      setData(res.data);
      setTeacherInvitations(invsRes.data.invitations || []);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  const handleSendTeacherInvitation = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (submitting || now - lastSubmitRef.current < 2000) return;
    lastSubmitRef.current = now;

    setSubmitting(true);
    setModalError("");
    setError("");
    try {
      const { data: res } = await api.post("/invitations", {
        name: teacherInviteForm.name,
        email: teacherInviteForm.email,
        role: "teacher"
      });
      setShowTeacherModal(false);
      setShowTeacherInviteModal(false);
      setTeacherInviteForm({ name: "", email: "" });
      setInviteSuccessModal({
        name: res.invitation.name,
        email: res.invitation.email,
        role: "Faculty Member / Teacher",
        setupLink: res.setupLink
      });
      showSuccess(`Official teacher setup invitation emailed to ${res.invitation.email}.`);
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
          role: "Faculty Member / Teacher",
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

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const specials = "!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 7; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    pass += specials.charAt(Math.floor(Math.random() * specials.length));
    for (let i = 0; i < 3; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setTeacherForm((prev) => ({ ...prev, password: pass }));
  };

  // Create Teacher
  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    if (!data?.department?._id) return;
    setSubmitting(true);
    setError("");
    try {
      const { data: res } = await api.post("/hierarchy/hod/teachers", {
        ...teacherForm,
        departmentId: data.department._id,
        password: teacherForm.password?.trim() || undefined,
        temporaryPassword: teacherForm.password?.trim() || undefined,
        mustChangePassword: Boolean(teacherForm.mustChangePassword)
      });
      setShowTeacherModal(false);
      setShowTeacherInviteModal(false);
      const chosenPass = res.credentials?.password || res.temporaryCredentials?.temporaryPassword;
      setTempCredsModal({
        name: res.teacher.name,
        email: res.teacher.email,
        password: chosenPass,
        mustChangePassword: res.teacher.mustChangePassword
      });
      setTeacherForm({
        name: "",
        email: "",
        employeeId: "",
        phone: "",
        designation: "Assistant Professor",
        qualification: "",
        password: "",
        mustChangePassword: true
      });
      showSuccess(`Teacher ${res.teacher.name} created successfully.`);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Create Section
  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!data?.department?._id) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/hierarchy/sections", {
        ...sectionForm,
        departmentId: data.department._id,
        year: Number(sectionForm.year),
        semester: Number(sectionForm.semester),
        capacity: Number(sectionForm.capacity)
      });
      setShowSectionModal(false);
      setSectionForm({ name: "", year: "3", semester: "5", capacity: "60" });
      showSuccess("Section created successfully.");
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Create Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!data?.department?._id) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/hierarchy/subjects", {
        ...subjectForm,
        departmentId: data.department._id,
        credits: Number(subjectForm.credits),
        semester: Number(subjectForm.semester)
      });
      setShowSubjectModal(false);
      setSubjectForm({ name: "", code: "", credits: "4", semester: "5", type: "Theory" });
      showSuccess("Subject added to curriculum.");
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Teacher to Section/Subject
  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!assignModal || !assignmentForm.sectionId) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/hierarchy/hod/assign-teacher", {
        teacherId: assignModal._id,
        sectionId: assignmentForm.sectionId,
        subject: assignmentForm.subject,
        isClassTeacher: assignmentForm.isClassTeacher
      });
      showSuccess(`Assignments updated for ${assignModal.name}.`);
      setAssignModal(null);
      setAssignmentForm({ sectionId: "", subject: "", isClassTeacher: false });
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher status toggle
  const handleTeacherStatusToggle = async (teacher) => {
    const nextStatus = teacher.status === "active" ? "inactive" : "active";
    try {
      await api.patch(`/hierarchy/accounts/${teacher._id}/status`, { status: nextStatus });
      showSuccess(`Teacher status updated to ${nextStatus}.`);
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const copyCreds = () => {
    if (!tempCredsModal) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `College CodeRank - Faculty Teacher Credentials\n\nName: ${tempCredsModal.name}\nOfficial Email: ${tempCredsModal.email}\nPassword: ${tempCredsModal.password}\nLogin URL: ${origin}/login\n\nStatus: Active Account`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const department = data?.department;
  const teachers = data?.teachers || [];
  const sections = data?.sections || [];
  const subjects = data?.subjects || [];
  const metrics = data?.metrics || {
    teachersCount: 0,
    sectionsCount: 0,
    subjectsCount: 0,
    studentsCount: 0
  };

  return (
    <div className="space-y-6">
      {/* Department Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <GraduationCap size={13} /> Head of Department (HOD) Portal
              </span>
              <span className="text-[11px] text-slate-300">
                {department ? `${department.name} (${department.code || "DEPT"})` : "Unassigned Department"}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {department ? department.name : "HOD Academic Management"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Manage department faculty, onboard teachers, establish class sections, and allocate teachers to sections and curriculum subjects.
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

        {/* Real Department Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Department Teachers</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.teachersCount}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class Sections</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.sectionsCount}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Curriculum Subjects</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.subjectsCount}</strong>
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

      {!department ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <GraduationCap size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Department Assigned</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Your HOD account is not currently linked to a department. Contact your Director or Super Admin to assign your department.
          </p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("teachers")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "teachers" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users size={15} />
              <span>1. Department Teachers</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-extrabold">
                {teachers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sections")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "sections" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers size={15} />
              <span>2. Class Sections</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-extrabold">
                {sections.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subjects")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "subjects" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BookOpen size={15} />
              <span>3. Subjects &amp; Curriculum</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-extrabold">
                {subjects.length}
              </span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            {/* ================= TAB 1: TEACHERS ================= */}
            {activeTab === "teachers" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Department Faculty &amp; Teachers</h2>
                    <p className="text-xs text-slate-500">
                      Onboard teachers for {department.name} and assign them to sections and subjects.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherAddMode("invite");
                        setShowTeacherModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer transition-all"
                    >
                      <Mail size={15} />
                      <span>Send Teacher Invitation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherAddMode("manual");
                        setShowTeacherModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-all"
                    >
                      <KeyRound size={14} className="text-emerald-600" />
                      <span>Direct Add (Set Password)</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Section 1: Pending & Past Faculty Setup Invitations */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-emerald-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Faculty Setup Invitations ({teacherInvitations.length})
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Single-use setup tokens · 24-hr expiry</span>
                  </div>

                  {teacherInvitations.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No invitations issued yet. Click &quot;Send Teacher Invitation&quot; to email a faculty onboarding link.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                            <th className="py-2.5 px-3">Faculty Name</th>
                            <th className="py-2.5 px-3">Official Email</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Sent At</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {teacherInvitations.map((inv) => (
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
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md cursor-pointer"
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

                {/* Sub-Section 2: Active Faculty Teachers */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} className="text-emerald-600" />
                      Active Faculty Teachers ({teachers.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">Department faculty &amp; assignments</span>
                  </div>

                  {teachers.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <Users size={32} className="text-slate-300 mx-auto mb-2" />
                      <h3 className="text-sm font-bold text-slate-700">No active teachers in this department</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-3">
                        Send an invitation above to onboard faculty for {department.name}.
                      </p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3">Teacher Name</th>
                          <th className="py-3 px-3">Official Email</th>
                          <th className="py-3 px-3">Assigned Sections</th>
                          <th className="py-3 px-3">Subjects</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teachers.map((tch) => (
                          <tr key={tch._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3">
                              <strong className="text-slate-800 font-bold block">{tch.name}</strong>
                              <span className="text-[11px] text-slate-400">{tch.designation}</span>
                            </td>
                            <td className="py-3.5 px-3 font-mono text-slate-600">{tch.email}</td>
                            <td className="py-3.5 px-3">
                              {tch.assignedSections && tch.assignedSections.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {tch.assignedSections.map((sec) => (
                                    <span key={sec._id || sec} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      {sec.name || "Section"}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-amber-600 text-[11px] italic">No sections assigned</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              {tch.assignedSubjects && tch.assignedSubjects.length > 0 ? (
                                <span className="text-slate-700 font-medium">
                                  {tch.assignedSubjects.join(", ")}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tch.status === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}>
                                {tch.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignModal(tch);
                                    setAssignmentForm({ sectionId: "", subject: "", isClassTeacher: false });
                                  }}
                                  title="Assign to Section / Subject"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 cursor-pointer transition-all"
                                >
                                  <LinkIcon size={12} />
                                  <span>Assign</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTeacherStatusToggle(tch)}
                                  title={tch.status === "active" ? "Deactivate" : "Activate"}
                                  className={`p-1.5 rounded-lg cursor-pointer ${
                                    tch.status === "active"
                                      ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                      : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                  }`}
                                >
                                  <Power size={14} />
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

            {/* ================= TAB 2: SECTIONS ================= */}
            {activeTab === "sections" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Class Cohorts &amp; Sections</h2>
                    <p className="text-xs text-slate-500">
                      Manage year and semester class cohorts in {department.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSectionModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer transition-all"
                  >
                    <Plus size={15} />
                    <span>+ Create Section</span>
                  </button>
                </div>

                {sections.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <Layers size={36} className="text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">No class sections created</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Create cohorts like "CSE-A" or "AIML-B" to enroll students and assign class teachers.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSectionModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <Plus size={14} /> Create Section
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((sec) => (
                      <div key={sec._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 text-sm font-bold">{sec.name}</strong>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Year {sec.year} · Sem {sec.semester}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Enrolled Students:</span>
                            <strong className="text-slate-800">{sec.totalStudents} / {sec.capacity}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Class Teacher:</span>
                            <strong className="text-emerald-700">{sec.classTeacherId?.name || "Not Appointed"}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: SUBJECTS ================= */}
            {activeTab === "subjects" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Curriculum Subjects</h2>
                    <p className="text-xs text-slate-500">
                      Manage official courses and subjects offered by {department.name}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSubjectModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer transition-all"
                  >
                    <Plus size={15} />
                    <span>+ Add Subject</span>
                  </button>
                </div>

                {subjects.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <BookOpen size={36} className="text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-700">No subjects added yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Add subjects like "Data Structures", "Algorithms", or "Operating Systems".
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSubjectModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <Plus size={14} /> Add Subject
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3">Subject Name</th>
                          <th className="py-3 px-3">Subject Code</th>
                          <th className="py-3 px-3">Credits</th>
                          <th className="py-3 px-3">Semester</th>
                          <th className="py-3 px-3">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subjects.map((sub) => (
                          <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3">
                              <strong className="text-slate-800 font-bold block">{sub.name}</strong>
                            </td>
                            <td className="py-3.5 px-3 font-mono font-bold text-emerald-700">{sub.code}</td>
                            <td className="py-3.5 px-3">{sub.credits} Credits</td>
                            <td className="py-3.5 px-3">Semester {sub.semester}</td>
                            <td className="py-3.5 px-3">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {sub.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Appoint / Onboard Teacher */}
      {(showTeacherModal || showTeacherInviteModal) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Users size={16} className="text-emerald-600" />
                Faculty Teacher Onboarding
              </h3>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowTeacherModal(false);
                  setShowTeacherInviteModal(false);
                  setModalError("");
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
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTeacherAddMode("invite")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  teacherAddMode === "invite"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Mail size={13} />
                <span>Send Email Invitation</span>
              </button>
              <button
                type="button"
                onClick={() => setTeacherAddMode("manual")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  teacherAddMode === "manual"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <KeyRound size={13} />
                <span>Manual &amp; Password</span>
              </button>
            </div>

            {/* MODE 1: SEND EMAIL INVITATION */}
            {teacherAddMode === "invite" && (
              <form onSubmit={handleSendTeacherInvitation} className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Assigned Role</span>
                    <span className="text-xs font-bold text-emerald-950">Faculty Member / Teacher</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900">
                    {department?.name || "Your Department"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Rakesh Verma"
                    value={teacherInviteForm.name}
                    onChange={(e) => setTeacherInviteForm({ ...teacherInviteForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="teacher.cs@rungta.org"
                    value={teacherInviteForm.email}
                    onChange={(e) => setTeacherInviteForm({ ...teacherInviteForm, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-900 leading-relaxed">
                  ⏳ <strong>Single-Use Link:</strong> A single-use link valid for 24 hours will be sent to the teacher&apos;s email. They will set their own password and activate their account directly.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setShowTeacherModal(false);
                      setShowTeacherInviteModal(false);
                      setModalError("");
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
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

            {/* MODE 2: MANUAL CREATION WITH DIRECT PASSWORD */}
            {teacherAddMode === "manual" && (
              <form onSubmit={handleCreateTeacher} className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Direct Account Setup</span>
                    <span className="text-xs font-bold text-emerald-950">Active Teacher Profile &amp; Custom Password</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Instant Activation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. Ankit Gupta"
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="teacher@rungta.org"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
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
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      className="w-full text-xs pl-3 pr-10 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
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
                      checked={teacherForm.mustChangePassword}
                      onChange={(e) => setTeacherForm({ ...teacherForm, mustChangePassword: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-600">
                      Force teacher to change password on first login
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="EMP-TCH-01"
                      value={teacherForm.employeeId}
                      onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+91 94252 00004"
                      value={teacherForm.phone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                    <select
                      value={teacherForm.designation}
                      onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Lab Instructor">Lab Instructor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Qualification (Optional)</label>
                    <input
                      type="text"
                      placeholder="M.Tech, Ph.D"
                      value={teacherForm.qualification}
                      onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherModal(false);
                      setShowTeacherInviteModal(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound size={13} />
                    {submitting ? "Appointing..." : "Appoint Teacher Now"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Section */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Layers size={16} className="text-emerald-600" />
                Create Section in {department?.name}
              </h3>
              <button type="button" onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Cohort Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-A"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={sectionForm.year}
                    onChange={(e) => setSectionForm({ ...sectionForm, year: e.target.value })}
                    className="w-full text-xs px-2 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={sectionForm.semester}
                    onChange={(e) => setSectionForm({ ...sectionForm, semester: e.target.value })}
                    className="w-full text-xs px-2 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                    className="w-full text-xs px-2 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subject */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-600" />
                Add Curriculum Subject
              </h3>
              <button type="button" onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures and Algorithms"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="CS301"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={subjectForm.semester}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Lab / Practical">Lab / Practical</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Teacher to Section */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <LinkIcon size={16} className="text-emerald-600" />
                Assign {assignModal.name}
              </h3>
              <button type="button" onClick={() => setAssignModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Section *</label>
                <select
                  required
                  value={assignmentForm.sectionId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, sectionId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Section --</option>
                  {sections.map((sec) => (
                    <option key={sec._id} value={sec._id}>
                      {sec.name} (Year {sec.year} · Sem {sec.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Assignment (Optional)</label>
                <select
                  value={assignmentForm.subject}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub.name}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="classTeacherCheck"
                  checked={assignmentForm.isClassTeacher}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, isClassTeacher: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="classTeacherCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Designate as Primary Class Teacher for this section
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary Credentials Popup */}
      {tempCredsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Faculty Teacher Account Created</span>
            </div>

            <p className="text-xs text-slate-600">
              Please share these temporary credentials with <strong>{tempCredsModal.name}</strong>. The teacher will be forced to set a permanent password upon first login.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Official Email:</span>
                <strong className="text-slate-800">{tempCredsModal.email}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Temporary Password:</span>
                <strong className="text-emerald-700 select-all">{tempCredsModal.password}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={copyCreds}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? "Copied!" : "Copy Credentials"}</span>
              </button>
              <button
                type="button"
                onClick={() => setTempCredsModal(null)}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVITE TEACHER VIA EMAIL ================= */}
      {showTeacherInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Mail size={16} className="text-emerald-600" />
                Issue Faculty / Teacher Invitation
              </h3>
              <button
                type="button"
                onClick={() => setShowTeacherInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Assigned Role</span>
                <span className="text-xs font-bold text-emerald-950">Faculty Member / Teacher</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900">
                {data?.department?.name || "Your Department"}
              </span>
            </div>

            <form onSubmit={handleSendTeacherInvitation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Rakesh Verma"
                  value={teacherInviteForm.name}
                  onChange={(e) => setTeacherInviteForm({ ...teacherInviteForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="teacher.cs@rungta.org"
                  value={teacherInviteForm.email}
                  onChange={(e) => setTeacherInviteForm({ ...teacherInviteForm, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-900 leading-relaxed">
                ⏳ <strong>Secure Invitation:</strong> A single-use link valid for 24 hours will be sent to the teacher&apos;s email. They will set their own password and activate their account directly.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Send size={13} />
                  {submitting ? "Sending..." : "Send Invitation Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVITATION DISPATCH SUCCESS ================= */}
      {inviteSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <span>Teacher Invitation Dispatched</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              An official setup invitation was sent to <strong>{inviteSuccessModal.name}</strong> ({inviteSuccessModal.email}) for the role of <strong>{inviteSuccessModal.role}</strong>.
            </p>

            {inviteSuccessModal.setupLink && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 block">Single-Use Setup Link:</span>
                <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-emerald-800 break-all select-all">
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
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
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
