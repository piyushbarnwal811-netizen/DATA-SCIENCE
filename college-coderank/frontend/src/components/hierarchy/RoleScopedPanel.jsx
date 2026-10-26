"use client";

import {
  ShieldCheck,
  Briefcase,
  Building,
  GraduationCap,
  BookOpen,
  Calendar,
  DoorOpen,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  AlertCircle
} from "lucide-react";

export default function RoleScopedPanel({ user, treeData, overviewData, onSwitchTab }) {
  const role = user?.role === "admin" ? "super_admin" : (user?.role || "super_admin");

  // 1. Super Admin View
  if (role === "super_admin") {
    return (
      <div className="role-panel-card bg-gradient-to-r from-red-900/10 via-rose-900/5 to-transparent border-red-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded uppercase">
                  Super Administrator
                </span>
                <span className="text-xs text-slate-500 font-medium">Universal Control Center</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                Full Institutional Authority across University Hierarchy
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSwitchTab("users")}
              className="button button--white text-xs py-1 px-3 h-8"
            >
              Manage Users
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab("classrooms")}
              className="button button--primary text-xs py-1 px-3 h-8"
            >
              Classrooms & Labs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TPO View
  if (role === "tpo") {
    return (
      <div className="role-panel-card bg-gradient-to-r from-blue-900/10 via-cyan-900/5 to-transparent border-blue-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Briefcase size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded uppercase">
                  TPO Placement Oversight
                </span>
                <span className="text-xs text-slate-500 font-medium">Read-Only Campus Hierarchy</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                {user?.name || "Dr. Alok Verma"} · Training & Placement Head
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                You have institution-wide inspection rights across all Directors, HODs, student cohorts, and classroom allocations for campus recruitment drives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSwitchTab("reports")}
              className="button button--primary text-xs py-1 px-3 h-8"
            >
              View Institutional Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Director View
  if (role === "director") {
    const directorateName = user?.directorate?.name || "Assigned Directorate";
    return (
      <div className="role-panel-card bg-gradient-to-r from-amber-900/10 via-orange-900/5 to-transparent border-amber-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Building size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase">
                  Director Authority
                </span>
                <span className="text-xs text-slate-500 font-medium">Scoped to Directorate</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                {user?.name} · {directorateName}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Authorized to inspect HODs, academic departments, classroom allocations, and generate unit performance metrics within your institute.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSwitchTab("classrooms")}
              className="button button--white text-xs py-1 px-3 h-8"
            >
              Classrooms & Labs
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab("reports")}
              className="button button--primary text-xs py-1 px-3 h-8"
            >
              Directorate Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. HOD View
  if (role === "hod") {
    const deptName = user?.department?.name || "Assigned Department";
    return (
      <div className="role-panel-card bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-transparent border-emerald-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                  Head of Department (HOD)
                </span>
                <span className="text-xs text-slate-500 font-medium">Department Control</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                {user?.name} · Department of {deptName}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Manage section cohorts, assign class teachers, and allocate lecture classrooms and computer labs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSwitchTab("classrooms")}
              className="button button--primary text-xs py-1 px-3 h-8"
            >
              Classroom & Lab Allocation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Teacher View
  if (role === "teacher") {
    const assignedSecs = user?.assignedSections || [];
    const subjects = user?.assignedSubjects || [];
    return (
      <div className="role-panel-card bg-gradient-to-r from-sky-900/10 via-blue-900/5 to-transparent border-sky-200">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                <BookOpen size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded uppercase">
                    Faculty Dashboard
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Scoped Teaching Portal</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                  {user?.name} ({user?.employeeId || "Faculty"})
                </h3>
                <span className="text-xs text-slate-600">
                  {user?.designation || "Assistant Professor"} · {user?.department?.name || "Engineering"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchTab("classrooms")}
              className="button button--primary text-xs py-1 px-3 h-8"
            >
              My Classrooms & Labs
            </button>
          </div>

          {/* Teacher Scope Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-sky-200/60 text-xs">
            <div className="p-2 bg-white/80 rounded border border-sky-100">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Associated Hierarchy</span>
              <strong className="text-slate-800 block mt-0.5">
                HOD: {user?.department?.name ? `Head of ${user.department.name}` : "Assigned HOD"}
              </strong>
              <span className="text-[11px] text-slate-500">
                Director: {user?.directorate?.name || "Institute Director"}
              </span>
            </div>

            <div className="p-2 bg-white/80 rounded border border-sky-100">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Authorized Sections</span>
              <strong className="text-indigo-700 block mt-0.5">
                {assignedSecs.length > 0 ? `${assignedSecs.length} Cohort(s) Assigned` : "No Sections Assigned"}
              </strong>
              <span className="text-[11px] text-slate-500">
                Restricted strictly from unauthorized student batches
              </span>
            </div>

            <div className="p-2 bg-white/80 rounded border border-sky-100">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Teaching Subjects</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {subjects.length > 0 ? (
                  subjects.map((sub, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-sky-50 text-sky-800 text-[10px] font-semibold rounded border border-sky-200">
                      {sub}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-amber-700 font-medium">Pending subject assignment</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
