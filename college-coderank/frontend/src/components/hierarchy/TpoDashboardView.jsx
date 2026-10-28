"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Building,
  GraduationCap,
  Users,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  UserPlus,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Mail,
  Phone,
  Layers,
  Send,
  Check,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";

export default function TpoDashboardView() {
  const [data, setData] = useState(null);
  const [directorsList, setDirectorsList] = useState([]);
  const [directorInvitations, setDirectorInvitations] = useState([]);
  const [activeTab, setActiveTab] = useState("schools"); // "schools" | "directors" | "invitations" | "departments"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [addSchoolModalOpen, setAddSchoolModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState(null); // { directorateId, name, currentDirectorId }
  const [deleteDirectorModal, setDeleteDirectorModal] = useState(null); // { id, name, schoolName }
  const [inviteSuccessModal, setInviteSuccessModal] = useState(null);

  // Forms
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    directorateId: "",
    phone: "",
    designation: "Director of School"
  });
  const [schoolForm, setSchoolForm] = useState({
    code: "",
    name: "",
    building: "Academic Complex",
    description: ""
  });
  const [selectedDirectorId, setSelectedDirectorId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tpoRes, dirRes, invRes] = await Promise.all([
        api.get("/hierarchy/tpo/overview"),
        api.get("/hierarchy/directors"),
        api.get("/invitations?role=director").catch(() => ({ data: { invitations: [] } }))
      ]);

      setData(tpoRes.data);
      setDirectorsList(dirRes.data.directors || tpoRes.data.directors || []);
      setDirectorInvitations(invRes.data.invitations || tpoRes.data.directorInvitations || []);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

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

  // 1. Invite Director for a School
  const handleInviteDirector = async (e) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      setModalError("Director name and official email are required.");
      return;
    }
    if (!inviteForm.directorateId) {
      setModalError("Please select which School / Directorate this Director will lead.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      const { data: resData } = await api.post("/invitations", {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        role: "director",
        directorateId: inviteForm.directorateId,
        phone: inviteForm.phone.trim() || undefined,
        designation: inviteForm.designation.trim() || "Director of School"
      });

      const selectedSchool = (data?.directorates || []).find((d) => d._id === inviteForm.directorateId);

      setInviteSuccessModal({
        name: inviteForm.name,
        email: inviteForm.email,
        schoolName: selectedSchool ? `${selectedSchool.name} (${selectedSchool.code})` : "Assigned School",
        setupLink: resData.setupLink,
        expiresInHours: resData.expiresInHours || 24
      });

      setInviteForm({
        name: "",
        email: "",
        directorateId: "",
        phone: "",
        designation: "Director of School"
      });
      setInviteModalOpen(false);
      showSuccess(`Official invitation sent to ${inviteForm.email}.`);
      await refreshAll();
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Add New School (Directorate)
  const handleAddSchool = async (e) => {
    e.preventDefault();
    if (!schoolForm.code.trim() || !schoolForm.name.trim()) {
      setModalError("School code (e.g. SOCSE, SOIT) and full school name are required.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      await api.post("/hierarchy/directorates", {
        code: schoolForm.code.trim().toUpperCase(),
        name: schoolForm.name.trim(),
        building: schoolForm.building.trim(),
        description: schoolForm.description.trim()
      });

      showSuccess(`School ${schoolForm.name} (${schoolForm.code.toUpperCase()}) added successfully.`);
      setSchoolForm({ code: "", name: "", building: "Academic Complex", description: "" });
      setAddSchoolModalOpen(false);
      await refreshAll();
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Reassign Director to School
  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!assignModal) return;
    setSubmitting(true);
    setError("");
    try {
      await api.put(`/hierarchy/directorates/${assignModal.directorateId}`, {
        directorId: selectedDirectorId || null
      });
      showSuccess(`Director assignment updated for ${assignModal.name}.`);
      setAssignModal(null);
      await refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Delete Director
  const handleDeleteDirector = async () => {
    if (!deleteDirectorModal) return;
    setSubmitting(true);
    setError("");
    try {
      await api.delete(`/hierarchy/directors/${deleteDirectorModal.id}`);
      showSuccess(`Director ${deleteDirectorModal.name} removed successfully.`);
      setDeleteDirectorModal(null);
      await refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Resend Invitation
  const handleResendInvitation = async (inv) => {
    setError("");
    try {
      const { data: resData } = await api.post(`/invitations/${inv._id}/resend`);
      setInviteSuccessModal({
        name: inv.name,
        email: inv.email,
        schoolName: inv.directorateId?.name || "Assigned School",
        setupLink: resData.setupLink,
        expiresInHours: 24
      });
      showSuccess(`Invitation resent to ${inv.email}.`);
      await refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  // 6. Revoke Invitation
  const handleRevokeInvitation = async (invId) => {
    if (!window.confirm("Are you sure you want to revoke this Director invitation?")) return;
    setError("");
    try {
      await api.delete(`/invitations/${invId}`);
      showSuccess("Invitation revoked.");
      await refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const metrics = data?.metrics || {
    totalSchools: (data?.directorates || []).length,
    totalDirectorates: (data?.directorates || []).length,
    totalDirectors: (directorsList || []).length,
    totalDepartments: (data?.departments || []).length,
    totalStudents: 0,
    vacantDirectorates: 0
  };

  const directorates = data?.directorates || [];
  const departments = data?.departments || [];

  // Filtered lists
  const filteredSchools = directorates.filter((dir) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      dir.name?.toLowerCase().includes(q) ||
      dir.code?.toLowerCase().includes(q) ||
      dir.directorId?.name?.toLowerCase().includes(q) ||
      dir.directorId?.email?.toLowerCase().includes(q)
    );
  });

  const filteredDirectors = directorsList.filter((dir) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      dir.name?.toLowerCase().includes(q) ||
      dir.email?.toLowerCase().includes(q) ||
      dir.directorateId?.name?.toLowerCase().includes(q) ||
      dir.directorateId?.code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <div className="bg-gradient-to-r from-red-950 via-rose-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-red-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-300 border border-red-400/30 uppercase tracking-wide">
                <Briefcase size={14} className="text-red-400" />
                Training &amp; Placement Office (TPO)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck size={12} /> Executive Authority
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              University Schools &amp; Director Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Supervise all academic Schools (SOCSE, SOIT, etc.), appoint and govern School Directors, and monitor campus-wide placement readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setModalError("");
                setInviteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 transition-all cursor-pointer"
            >
              <UserPlus size={15} />
              <span>+ Appoint / Invite Director</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalError("");
                setAddSchoolModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Add School</span>
            </button>

            <button
              type="button"
              onClick={refreshAll}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Executive Real-Time Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Active Directors
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <strong className="text-2xl font-black text-white">{metrics.totalDirectors}</strong>
              <span className="text-[11px] text-slate-400">appointed</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              University Schools
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <strong className="text-2xl font-black text-rose-300">{metrics.totalSchools || metrics.totalDirectorates}</strong>
              <span className="text-[11px] text-slate-400">faculties</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Vacant Leadership
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <strong className={`text-2xl font-black ${metrics.vacantDirectorates > 0 ? "text-amber-400" : "text-slate-300"}`}>
                {metrics.vacantDirectorates}
              </strong>
              <span className="text-[11px] text-slate-400">schools</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Academic Departments
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <strong className="text-2xl font-black text-white">{metrics.totalDepartments}</strong>
              <span className="text-[11px] text-slate-400">branches</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Placement Students
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <strong className="text-2xl font-black text-emerald-400">{metrics.totalStudents}</strong>
              <span className="text-[11px] text-slate-400">profiles</span>
            </div>
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

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("schools")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "schools"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Building size={14} />
            <span>Schools &amp; Leadership</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "schools" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {directorates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("directors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "directors"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Users size={14} />
            <span>Directors Directory</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "directors" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {directorsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "invitations"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Mail size={14} />
            <span>Director Invitations</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "invitations" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {directorInvitations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("departments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "departments"
                ? "bg-red-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <GraduationCap size={14} />
            <span>Department Readiness</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "departments" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {departments.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search school or director..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
          />
        </div>
      </div>

      {/* TAB 1: SCHOOLS & APPOINTED DIRECTORS */}
      {activeTab === "schools" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                University Schools &amp; Directorate Leadership
              </h2>
              <p className="text-xs text-slate-500">
                Each school (e.g., SOCSE, SOIT) is led by an appointed Director. Directors autonomously manage their departments and HOD appointments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalError("");
                setInviteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all cursor-pointer self-start sm:self-auto"
            >
              <UserPlus size={13} />
              <span>Appoint Director</span>
            </button>
          </div>

          {filteredSchools.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Building size={36} className="text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Schools Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                No university schools matching your search. Click "+ Add School" to establish SOCSE, SOIT, or other faculties.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchools.map((dir) => {
                const schoolDepts = departments.filter(
                  (d) => String(d.directorateId?._id || d.directorateId) === String(dir._id)
                );

                return (
                  <div
                    key={dir._id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            {dir.code}
                          </span>
                          <span className="text-[11px] text-slate-400">{dir.building || "Campus Complex"}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{dir.name}</h3>
                        {dir.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{dir.description}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setAssignModal({
                            directorateId: dir._id,
                            name: `${dir.name} (${dir.code})`,
                            currentDirectorId: dir.directorId?._id || ""
                          });
                          setSelectedDirectorId(dir.directorId?._id || "");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer shadow-2xs transition-all shrink-0"
                      >
                        <Edit2 size={12} />
                        <span>Reassign</span>
                      </button>
                    </div>

                    {/* Appointed Director Card */}
                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          dir.directorId ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {dir.directorId ? dir.directorId.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-bold text-slate-800">
                              {dir.directorId?.name || "No Appointed Director"}
                            </strong>
                            {dir.directorId && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {dir.directorId?.email || "Position is currently vacant"}
                          </span>
                        </div>
                      </div>

                      {!dir.directorId && (
                        <button
                          type="button"
                          onClick={() => {
                            setInviteForm({
                              ...inviteForm,
                              directorateId: dir._id
                            });
                            setModalError("");
                            setInviteModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition-all shrink-0"
                        >
                          Appoint Now
                        </button>
                      )}
                    </div>

                    {/* Department summary under this school */}
                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Governed Departments: <strong className="text-slate-800">{schoolDepts.length}</strong>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {schoolDepts.map((d) => d.code).join(", ") || "No branches yet"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECTORS DIRECTORY */}
      {activeTab === "directors" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                College Directors Directory ({directorsList.length})
              </h2>
              <p className="text-xs text-slate-500">
                All appointed Directors leading university Schools. TPO collaborates with Directors on institutional placements and student technical ranking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalError("");
                setInviteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all cursor-pointer self-start sm:self-auto"
            >
              <UserPlus size={13} />
              <span>+ Invite Director</span>
            </button>
          </div>

          {filteredDirectors.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Users size={36} className="text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Directors Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                No active Directors match your filter. Click "+ Invite Director" to appoint leadership for a school.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Director</th>
                    <th className="py-3 px-3">Assigned School</th>
                    <th className="py-3 px-3">Contact Details</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDirectors.map((dir) => (
                    <tr key={dir._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {dir.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-slate-900 font-bold block">{dir.name}</strong>
                            <span className="text-[11px] text-slate-400">{dir.designation || "Director of Faculty"}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {dir.directorateId ? (
                          <div>
                            <span className="font-mono text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block mb-0.5">
                              {dir.directorateId.code}
                            </span>
                            <span className="text-xs text-slate-800 font-medium block">
                              {dir.directorateId.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                            Unassigned School
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-700 text-xs block">{dir.email}</span>
                          <span className="text-slate-400 text-[11px] block">{dir.phone || "No phone listed"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={11} /> Active
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {dir.directorateId && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModal({
                                  directorateId: dir.directorateId._id,
                                  name: `${dir.directorateId.name} (${dir.directorateId.code})`,
                                  currentDirectorId: dir._id
                                });
                                setSelectedDirectorId(dir._id);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 cursor-pointer"
                            >
                              Reassign
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteDirectorModal({
                                id: dir._id,
                                name: dir.name,
                                schoolName: dir.directorateId?.name || "School"
                              })
                            }
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                            title="Remove Director"
                          >
                            <Trash2 size={13} />
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

      {/* TAB 3: DIRECTOR INVITATIONS */}
      {activeTab === "invitations" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Pending &amp; Dispatched Director Invitations ({directorInvitations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Single-use invitations sent to prospective School Directors. Recipients set their own secure password upon opening their invitation link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setModalError("");
                setInviteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all cursor-pointer self-start sm:self-auto"
            >
              <UserPlus size={13} />
              <span>+ Send New Invite</span>
            </button>
          </div>

          {directorInvitations.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Mail size={36} className="text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Pending Invitations</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                All invited Directors have either accepted their invitations or no invites are active.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Invitee</th>
                    <th className="py-3 px-3">School To Lead</th>
                    <th className="py-3 px-3">Invited By</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {directorInvitations.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <strong className="text-slate-900 font-bold block">{inv.name}</strong>
                        <span className="font-mono text-slate-500 text-[11px] block">{inv.email}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        {inv.directorateId ? (
                          <div>
                            <span className="font-mono text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              {inv.directorateId.code}
                            </span>
                            <span className="text-xs text-slate-700 font-medium block mt-0.5">
                              {inv.directorateId.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">
                        {inv.invitedBy?.name || "TPO Office"}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            inv.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : inv.status === "revoked"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : inv.status === "expired"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {inv.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {inv.status === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleResendInvitation(inv)}
                              className="px-2 py-1 text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 cursor-pointer"
                            >
                              Resend
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeInvitation(inv._id)}
                              className="px-2 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 cursor-pointer"
                            >
                              Revoke
                            </button>
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
      )}

      {/* TAB 4: DEPARTMENT READINESS OVERVIEW */}
      {activeTab === "departments" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Departmental Readiness &amp; HOD Contacts
              </h2>
              <p className="text-xs text-slate-500">
                Academic departments and HOD appointments are governed autonomously by each School's Director. TPO uses this view for institutional placement and technical ranking coordination.
              </p>
            </div>
          </div>

          {departments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-2xl">
              <GraduationCap size={32} className="mx-auto mb-2 text-slate-300" />
              <strong className="block font-bold text-slate-700">No departments configured yet</strong>
              <span>Departments will appear here once added by Directors under their respective Schools.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div key={dept._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {dept.code || "DEPT"}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">{dept.directorateId?.name || "General"}</span>
                  </div>
                  <strong className="block text-slate-800 text-xs font-bold">{dept.name}</strong>
                  <div className="pt-2 border-t border-slate-200 text-[11px] flex items-center justify-between">
                    <span className="text-slate-500">Appointed HOD:</span>
                    <strong className="text-slate-700">{dept.hodId?.name || "Unassigned"}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL 1: APPOINT / INVITE DIRECTOR */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    Appoint Director for a School
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Sends single-use setup link via real institutional email
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInviteDirector} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Which School / Directorate will this Director lead? <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={inviteForm.directorateId}
                  onChange={(e) => setInviteForm({ ...inviteForm, directorateId: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                >
                  <option value="">-- Choose School (e.g. SOCSE, SOIT) --</option>
                  {directorates.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.code} · {d.name} {d.directorId ? `(Current: ${d.directorId.name})` : "(Vacant)"}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select which academic school (e.g., SOCSE, SOIT) this Director will head.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Director Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="director.socse@rungta.org"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={inviteForm.designation}
                    onChange={(e) => setInviteForm({ ...inviteForm, designation: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{submitting ? "Dispatching Invitation..." : "Send Official Invitation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW SCHOOL */}
      {addSchoolModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building size={16} className="text-red-600" />
                Add New University School
              </h3>
              <button
                type="button"
                onClick={() => setAddSchoolModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School Code (e.g. SOCSE, SOIT, SOB) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOCSE"
                  value={schoolForm.code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-red-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full School Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. School of Computer Science & Engineering"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Building / Location</label>
                <input
                  type="text"
                  placeholder="Academic Block A - Tech Complex"
                  value={schoolForm.building}
                  onChange={(e) => setSchoolForm({ ...schoolForm, building: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Disciplines, faculty focus, or technical labs"
                  value={schoolForm.description}
                  onChange={(e) => setSchoolForm({ ...schoolForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddSchoolModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Creating School..." : "Create School"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REASSIGN DIRECTOR TO SCHOOL */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building size={16} className="text-red-600" />
                Assign Director for {assignModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Appointed Director</label>
                <select
                  value={selectedDirectorId}
                  onChange={(e) => setSelectedDirectorId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                >
                  <option value="">-- Vacant / Unassigned --</option>
                  {directorsList.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.email})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Assigning an appointed Director grants them administrative authority to lead departments and invite HODs.
                </span>
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
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE DIRECTOR CONFIRMATION */}
      {deleteDirectorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Remove Director Account?</h3>
                <span className="text-xs text-slate-500">
                  {deleteDirectorModal.name} · {deleteDirectorModal.schoolName}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Removing this Director will vacate the leadership of their assigned School. Existing departments, HODs, and student coding records will remain intact.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteDirectorModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDirector}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Removing..." : "Confirm & Remove Director"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: INVITATION SUCCESS WITH 1-CLICK COPY LINK */}
      {inviteSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Director Invitation Dispatched!
                </h3>
                <span className="text-xs text-slate-500">
                  Sent to {inviteSuccessModal.email} for {inviteSuccessModal.schoolName}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl space-y-2">
              <p className="text-xs text-emerald-800 leading-relaxed">
                An official setup invitation was emailed to <strong>{inviteSuccessModal.name}</strong> ({inviteSuccessModal.email}).
                The recipient will be prompted to set their own password upon clicking the link.
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold block">
                ⏳ Link expires in {inviteSuccessModal.expiresInHours} hours.
              </span>
            </div>

            {/* Direct fallback link for instant sharing */}
            {inviteSuccessModal.setupLink && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Direct Fallback Link (Single-Use):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteSuccessModal.setupLink}
                    className="w-full text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-300 text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(inviteSuccessModal.setupLink)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedLink ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInviteSuccessModal(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-black text-white rounded-lg cursor-pointer"
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
