"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  Mail,
  Phone,
  Building,
  User,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Building2,
  Users,
  CalendarCheck2,
  BookOpen,
  DoorOpen,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Code2,
  CheckCircle2,
  Search
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";

const ROLE_THEMES = {
  super_admin: {
    title: "Super Administrator",
    badge: "Institutional Authority",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    headerGrad: "from-red-600 via-rose-700 to-red-800",
    avatarBg: "bg-red-100 text-red-700",
    borderClass: "border-red-200"
  },
  tpo: {
    title: "Head - Training & Placement Office (TPO)",
    badge: "Placement & Corporate Affairs",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    headerGrad: "from-rose-600 via-red-700 to-rose-900",
    avatarBg: "bg-rose-100 text-rose-700",
    borderClass: "border-rose-200"
  },
  director: {
    title: "Director of School / Faculty",
    badge: "Academic Leadership",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    headerGrad: "from-amber-600 via-orange-600 to-amber-700",
    avatarBg: "bg-amber-100 text-amber-800",
    borderClass: "border-amber-200"
  },
  hod: {
    title: "Head of Department (HOD)",
    badge: "Department Executive",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    headerGrad: "from-emerald-600 via-teal-600 to-emerald-700",
    avatarBg: "bg-emerald-100 text-emerald-700",
    borderClass: "border-emerald-200"
  },
  teacher: {
    title: "Teacher / Faculty Member",
    badge: "Faculty Academic Staff",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
    headerGrad: "from-sky-600 via-blue-600 to-sky-700",
    avatarBg: "bg-sky-100 text-sky-700",
    borderClass: "border-sky-200"
  },
  student: {
    title: "Student",
    badge: "Student Member",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    headerGrad: "from-indigo-600 via-purple-600 to-indigo-700",
    avatarBg: "bg-indigo-100 text-indigo-700",
    borderClass: "border-indigo-200"
  }
};

export default function HierarchyProfileInspectorModal({ targetId, onClose }) {
  // Navigation stack for deep hierarchical drill-down
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState(targetId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  const fetchInspection = useCallback(async (idToFetch) => {
    if (!idToFetch) return;
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.get(`/hierarchy/inspect/${idToFetch}`);
      setData(res);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (targetId) {
      setCurrentId(targetId);
      setHistory([]);
      fetchInspection(targetId);
    }
  }, [targetId, fetchInspection]);

  const drillDownTo = (nextId, label) => {
    if (!nextId) return;
    setHistory((prev) => [...prev, { id: currentId, label: data?.profile?.name || "Previous Profile" }]);
    setCurrentId(nextId);
    setFilterQuery("");
    fetchInspection(nextId);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prevEntry = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setCurrentId(prevEntry.id);
    setFilterQuery("");
    fetchInspection(prevEntry.id);
  };

  const navigateToBreadcrumb = (index) => {
    if (index >= history.length) return;
    const targetHistory = history[index];
    setHistory((prev) => prev.slice(0, index));
    setCurrentId(targetHistory.id);
    setFilterQuery("");
    fetchInspection(targetHistory.id);
  };

  if (!targetId && !currentId) return null;

  const profile = data?.profile;
  const role = profile?.role || data?.role || "super_admin";
  const theme = ROLE_THEMES[role] || ROLE_THEMES.super_admin;
  const summary = data?.summary || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Dynamic Role Header */}
        <div className={`px-6 py-4.5 bg-gradient-to-r ${theme.headerGrad} text-white shrink-0`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                {theme.title}
              </span>
              <span className="text-white/80 text-xs hidden sm:inline">· Hierarchy Inspector</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchInspection(currentId)}
                disabled={loading}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-all disabled:opacity-50"
                title="Refresh details"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-all"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Drill-down Breadcrumbs */}
          {history.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/15 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-bold cursor-pointer transition-all shrink-0"
              >
                <ArrowLeft size={12} />
                <span>Back</span>
              </button>
              <span className="text-white/40">|</span>
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateToBreadcrumb(i)}
                    className="hover:underline text-white/80 hover:text-white font-medium"
                  >
                    {h.label}
                  </button>
                  <ChevronRight size={12} className="text-white/40" />
                </div>
              ))}
              <span className="font-extrabold text-white underline underline-offset-2 shrink-0">
                {profile?.name || "Current"}
              </span>
            </div>
          )}

          {/* Profile Name & Tagline */}
          <div className="flex items-center gap-3.5 mt-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black text-lg shadow-inner">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{profile?.name || (loading ? "Loading profile..." : "Account Details")}</span>
                {profile?.status === "active" && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    <CheckCircle2 size={10} /> Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {profile?.designation || theme.title}
                {profile?.directorate?.name && ` · ${profile.directorate.name} (${profile.directorate.code})`}
                {profile?.department?.name && ` · Department of ${profile.department.name}`}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50/40">
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw size={28} className="animate-spin text-red-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Gathering institutional subordinates &amp; downward hierarchy...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-2">
              <strong className="block font-bold">Failed to load profile details:</strong>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => fetchInspection(currentId)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Profile Contact & Administrative Grid */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Official Credentials &amp; Campus Location
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {profile?.email && (
                    <div className="flex items-start gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                        <Mail size={13} />
                      </span>
                      <div className="min-w-0">
                        <label className="text-[10px] text-slate-400 font-semibold block">Institutional Email</label>
                        <a href={`mailto:${profile.email}`} className="font-mono text-slate-800 hover:text-red-700 hover:underline truncate block">
                          {profile.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile?.phone && (
                    <div className="flex items-start gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                        <Phone size={13} />
                      </span>
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block">Official Phone</label>
                        <a href={`tel:${profile.phone}`} className="font-mono text-slate-800 hover:underline block">
                          {profile.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile?.employeeId && (
                    <div className="flex items-start gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                        <User size={13} />
                      </span>
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block">Employee ID</label>
                        <span className="font-mono font-bold text-slate-800 block">{profile.employeeId}</span>
                      </div>
                    </div>
                  )}

                  {profile?.directorate && (
                    <div className="flex items-start gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                        <Building size={13} />
                      </span>
                      <div className="min-w-0">
                        <label className="text-[10px] text-slate-400 font-semibold block">School / Directorate</label>
                        <span className="font-semibold text-slate-800 truncate block">
                          {profile.directorate.name} ({profile.directorate.code})
                        </span>
                      </div>
                    </div>
                  )}

                  {profile?.department && (
                    <div className="flex items-start gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                        <GraduationCap size={13} />
                      </span>
                      <div className="min-w-0">
                        <label className="text-[10px] text-slate-400 font-semibold block">Department</label>
                        <span className="font-semibold text-slate-800 truncate block">
                          {profile.department.name} ({profile.department.code})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Aggregated Subordinate KPIs */}
              {Object.keys(summary).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {summary.totalDirectors !== undefined && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <strong className="block text-xl font-black text-rose-700">{summary.totalDirectors}</strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Directors</span>
                    </div>
                  )}
                  {summary.totalSchools !== undefined && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <strong className="block text-xl font-black text-slate-800">{summary.totalSchools}</strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Schools</span>
                    </div>
                  )}
                  {(summary.totalDepartments !== undefined || summary.departmentsCount !== undefined) && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <strong className="block text-xl font-black text-slate-800">
                        {summary.totalDepartments ?? summary.departmentsCount}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Departments</span>
                    </div>
                  )}
                  {(summary.totalHods !== undefined || summary.hodsCount !== undefined) && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <strong className="block text-xl font-black text-emerald-700">
                        {summary.totalHods ?? summary.hodsCount}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">HODs</span>
                    </div>
                  )}
                  {(summary.totalTeachers !== undefined || summary.teachersCount !== undefined) && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <strong className="block text-xl font-black text-sky-700">
                        {summary.totalTeachers ?? summary.teachersCount}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Teachers</span>
                    </div>
                  )}
                  {(summary.totalStudents !== undefined || summary.studentsCount !== undefined) && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <strong className="block text-xl font-black text-indigo-700">
                        {summary.totalStudents ?? summary.studentsCount}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Students</span>
                    </div>
                  )}
                  {summary.sectionsCount !== undefined && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
                      <strong className="block text-xl font-black text-amber-700">{summary.sectionsCount}</strong>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sections</span>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBORDINATES VIEW: TPO INSPECTION (DIRECTORS & SCHOOLS) */}
              {/* ============================================================== */}
              {data?.type === "tpo" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Users size={14} className="text-rose-600" />
                        <span>Governed School Directors (Click to Inspect)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        All Directors appointed across university faculties under TPO supervision.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                      {data.directors?.length || 0} Appointed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(data.directors || []).map((dir) => (
                      <div
                        key={dir.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-rose-300 hover:shadow-xs transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {dir.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-slate-900 block">{dir.name}</strong>
                              <span className="text-[10px] font-mono text-slate-400">{dir.email}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => drillDownTo(dir.id, dir.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-all shrink-0"
                          >
                            <span>Inspect</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>

                        {dir.school ? (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                            <span className="font-semibold text-slate-700 truncate">{dir.school.name}</span>
                            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[10px]">
                              {dir.school.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            Unassigned School
                          </span>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>{dir.departmentsCount || 0} Departments</span>
                          <span>{dir.teachersCount || 0} Faculty Teachers</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* University Schools Summary */}
                  {data.schools && data.schools.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        All University Schools ({data.schools.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {data.schools.map((sc) => (
                          <div key={sc.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                            <div>
                              <strong className="block text-slate-800 text-[11px]">{sc.name}</strong>
                              <span className="text-[10px] text-slate-400">
                                {sc.director ? `Director: ${sc.director.name}` : "Vacant Leadership"}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                              {sc.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBORDINATES VIEW: DIRECTOR INSPECTION (DEPARTMENTS & HODS) */}
              {/* ============================================================== */}
              {data?.type === "director" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-amber-600" />
                        <span>Academic Departments &amp; Appointed HODs</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Autonomously governed by this Director under {summary.schoolName} ({summary.schoolCode}).
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                      {data.departments?.length || 0} Departments
                    </span>
                  </div>

                  {data.departments?.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                      No departments have been added to this School yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.departments.map((dept) => (
                        <div
                          key={dept.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-black uppercase text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {dept.code}
                                </span>
                                <h4 className="text-sm font-extrabold text-slate-900">{dept.name}</h4>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">
                                {dept.buildingBlock || "Academic Complex"} {dept.floor ? `· ${dept.floor}` : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-semibold text-slate-600">
                                <strong>{dept.teachersCount || 0}</strong> Teachers
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="font-semibold text-slate-600">
                                <strong>{dept.studentsCount || 0}</strong> Students
                              </span>
                            </div>
                          </div>

                          {/* HOD Card in Department */}
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/40 border border-amber-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                {dept.hod ? dept.hod.name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Head of Department (HOD)</span>
                                <strong className="text-xs text-slate-800">
                                  {dept.hod?.name || "Vacant HOD Position"}
                                </strong>
                                {dept.hod?.email && (
                                  <span className="text-[10px] font-mono text-slate-500 block">{dept.hod.email}</span>
                                )}
                              </div>
                            </div>

                            {dept.hod ? (
                              <button
                                type="button"
                                onClick={() => drillDownTo(dept.hod.id, dept.hod.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer shadow-2xs transition-all"
                              >
                                <span>Inspect HOD &amp; Teachers</span>
                                <ChevronRight size={12} />
                              </button>
                            ) : (
                              <span className="text-[10px] text-amber-700 italic">No HOD appointed</span>
                            )}
                          </div>

                          {/* Department Teachers List Preview */}
                          {dept.teachers && dept.teachers.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Faculty Teachers under this Department ({dept.teachers.length}):
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {dept.teachers.map((tch) => (
                                  <div
                                    key={tch.id}
                                    className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <strong className="block text-slate-800 truncate">{tch.name}</strong>
                                      <span className="text-[10px] text-slate-400 truncate block">{tch.email}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => drillDownTo(tch.id, tch.name)}
                                      className="p-1 hover:bg-white rounded text-slate-500 hover:text-sky-700 cursor-pointer transition-all"
                                      title="Inspect Teacher"
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBORDINATES VIEW: HOD INSPECTION (TEACHERS & SECTIONS) */}
              {/* ============================================================== */}
              {data?.type === "hod" && (
                <div className="space-y-4">
                  {/* Teachers in Department */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Users size={14} className="text-emerald-600" />
                        <span>Faculty Teachers in {summary.departmentName}</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {data.teachers?.length || 0} Faculty
                      </span>
                    </div>

                    {data.teachers?.length === 0 ? (
                      <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                        No teachers currently assigned to this department.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {data.teachers.map((tch) => (
                          <div
                            key={tch.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <strong className="text-xs font-bold text-slate-900 block">{tch.name}</strong>
                                <span className="text-[10px] text-slate-400 font-mono">{tch.email}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => drillDownTo(tch.id, tch.name)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 cursor-pointer transition-all"
                              >
                                <span>Inspect</span>
                                <ChevronRight size={11} />
                              </button>
                            </div>

                            {tch.assignedSubjects && tch.assignedSubjects.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {tch.assignedSubjects.map((sub, idx) => (
                                  <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sections in Department */}
                  {data.sections && data.sections.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Academic Sections &amp; Class Batches ({data.sections.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {data.sections.map((sec) => (
                          <div key={sec.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <strong className="block text-slate-800 text-[11px]">
                                {sec.name} (Year {sec.year})
                              </strong>
                              <span className="text-[10px] text-slate-400">
                                {sec.classTeacher ? `Class Teacher: ${sec.classTeacher.name}` : "No mentor assigned"}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                              {sec.totalStudents || 0} Students
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBORDINATES VIEW: TEACHER INSPECTION (CLASSES & STUDENTS) */}
              {/* ============================================================== */}
              {data?.type === "teacher" && (
                <div className="space-y-4">
                  {/* Assigned Sections */}
                  {data.sections && data.sections.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-sky-600" />
                        <span>Assigned Teaching Sections</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {data.sections.map((sec) => (
                          <div key={sec.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                            <strong className="block text-slate-800 font-bold">{sec.name}</strong>
                            <span className="text-[10px] text-slate-400 block">Year {sec.year}</span>
                            <span className="text-[11px] font-bold text-sky-700 mt-1 block">
                              {sec.totalStudents || 0} Enrolled Students
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Enrolled Students */}
                  {data.studentsSample && data.studentsSample.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Enrolled Students Sample ({data.studentsSample.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {data.studentsSample.map((std) => (
                          <div
                            key={std.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
                          >
                            <div>
                              <strong className="block text-slate-800 text-xs">{std.name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {std.studentId || std.email} · Sec {std.section}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => drillDownTo(std.id, std.name)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                            >
                              Inspect Student
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SUBORDINATES VIEW: STUDENT INSPECTION (CODING RATINGS) */}
              {/* ============================================================== */}
              {data?.type === "student" && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Coding Profiles &amp; Performance
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                        <strong className="block text-xl font-black text-indigo-700">
                          {data.codingStats?.totalSolved || 0}
                        </strong>
                        <span className="text-[10px] font-bold text-indigo-900 uppercase">Total Solved</span>
                      </div>
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                        <strong className="block text-xl font-black text-emerald-700">
                          {data.codingStats?.rankingScore || 0}
                        </strong>
                        <span className="text-[10px] font-bold text-emerald-900 uppercase">Ranking Score</span>
                      </div>
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                        <strong className="block text-xl font-black text-amber-700">
                          {data.codingStats?.verifiedBadgesCount || 0}
                        </strong>
                        <span className="text-[10px] font-bold text-amber-900 uppercase">Verified Badges</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <strong className="block text-xs font-bold text-slate-800 mt-1">
                          {data.profile?.branch || "N/A"}
                        </strong>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sec {data.profile?.section || "A"}</span>
                      </div>
                    </div>

                    {/* Handles List */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                      {data.codingStats?.leetcodeUsername && (
                        <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                          <span className="font-semibold text-slate-700">LeetCode</span>
                          <span className="font-mono text-amber-800 font-bold">{data.codingStats.leetcodeUsername}</span>
                        </div>
                      )}
                      {data.codingStats?.githubUsername && (
                        <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                          <span className="font-semibold text-slate-700">GitHub</span>
                          <span className="font-mono text-slate-800 font-bold">{data.codingStats.githubUsername}</span>
                        </div>
                      )}
                      {data.codingStats?.codechefUsername && (
                        <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                          <span className="font-semibold text-slate-700">CodeChef</span>
                          <span className="font-mono text-slate-800 font-bold">{data.codingStats.codechefUsername}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            {history.length > 0 ? (
              <span>Drill-down depth: {history.length + 1} levels</span>
            ) : (
              <span>Institutional Authority Scope</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

