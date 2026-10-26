"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Briefcase,
  Building,
  GraduationCap,
  BookOpen,
  Sparkles,
  ChevronRight,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const DEMO_ACCOUNTS = [
  {
    role: "super_admin",
    label: "Super Admin",
    subLabel: "Universal Access",
    name: "College Super Admin",
    email: "piyushbarnwal811@gmail.com",
    badge: "👑 Full Control",
    icon: ShieldCheck,
    color: "from-red-600 to-rose-700",
    bgActive: "bg-red-900/30 text-red-300 border-red-500/50"
  },
  {
    role: "tpo",
    label: "TPO",
    subLabel: "Training & Placement",
    name: "Dr. Alok Verma",
    email: "tpo@rungta.ac.in",
    badge: "🎯 College Oversight",
    icon: Briefcase,
    color: "from-blue-600 to-cyan-600",
    bgActive: "bg-blue-900/30 text-blue-300 border-blue-500/50"
  },
  {
    role: "director",
    label: "Director (Eng)",
    subLabel: "Faculty of Eng & Tech",
    name: "Dr. Sunita Rao",
    email: "director.eng@rungta.ac.in",
    badge: "🏛️ Eng Directorate",
    icon: Building,
    color: "from-amber-600 to-orange-600",
    bgActive: "bg-amber-900/30 text-amber-300 border-amber-500/50"
  },
  {
    role: "director",
    label: "Director (CS)",
    subLabel: "School of Computing",
    name: "Dr. Rajesh Sharma",
    email: "director.cs@rungta.ac.in",
    badge: "🏛️ CS Directorate",
    icon: Building,
    color: "from-amber-600 to-orange-600",
    bgActive: "bg-amber-900/30 text-amber-300 border-amber-500/50"
  },
  {
    role: "hod",
    label: "HOD (CSE)",
    subLabel: "Computer Science Dept",
    name: "Dr. Anand Mishra",
    email: "hod.cse@rungta.ac.in",
    badge: "🔬 CSE Dept",
    icon: GraduationCap,
    color: "from-emerald-600 to-teal-600",
    bgActive: "bg-emerald-900/30 text-emerald-300 border-emerald-500/50"
  },
  {
    role: "hod",
    label: "HOD (Data Science)",
    subLabel: "Data Science Dept",
    name: "Dr. Neha Kapoor",
    email: "hod.ds@rungta.ac.in",
    badge: "🔬 DS Dept",
    icon: GraduationCap,
    color: "from-emerald-600 to-teal-600",
    bgActive: "bg-emerald-900/30 text-emerald-300 border-emerald-500/50"
  },
  {
    role: "teacher",
    label: "Teacher (Prof. Amit)",
    subLabel: "CSE · Cloud & OS",
    name: "Prof. Amit Sen",
    email: "amit.sen@rungta.ac.in",
    badge: "👨‍🏫 Assigned Faculty",
    icon: BookOpen,
    color: "from-sky-600 to-blue-500",
    bgActive: "bg-sky-900/30 text-sky-300 border-sky-500/50"
  },
  {
    role: "teacher",
    label: "Teacher (Unassigned)",
    subLabel: "Prof. Manoj Tiwari",
    name: "Prof. Manoj Tiwari",
    email: "manoj.tiwari@rungta.ac.in",
    badge: "⚠️ Unassigned Teacher",
    icon: AlertCircle,
    color: "from-rose-600 to-pink-600",
    bgActive: "bg-rose-900/30 text-rose-300 border-rose-500/50"
  }
];

export default function RoleSwitcherBar({ onRoleSwitched }) {
  const { user, login } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSwitch = async (account) => {
    if (user?.email === account.email) return;
    setSwitching(true);
    setErrorMsg("");
    try {
      await login({
        email: account.email,
        password: "rungta@123"
      });
      if (onRoleSwitched) onRoleSwitched(account.role);
    } catch (err) {
      console.error("Role switch error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to switch role. Ensure backend is running.");
    } finally {
      setSwitching(false);
    }
  };

  const currentRole = user?.role === "admin" ? "super_admin" : (user?.role || "super_admin");

  return (
    <div className="hierarchy-role-switcher-container">
      <div className="hierarchy-role-switcher-header">
        <div className="flex items-center gap-2">
          <span className="hierarchy-role-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive Role Simulator & RBAC Inspector
          </span>
          <span className="text-[11px] text-slate-500">
            (Switch between all 5 hierarchy levels in real-time)
          </span>
        </div>
        <div className="flex items-center gap-3">
          {switching && (
            <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              Switching Persona...
            </span>
          )}
          {errorMsg && (
            <span className="text-xs text-rose-500 font-medium">{errorMsg}</span>
          )}
          <div className="current-user-badge">
            <span className="text-slate-500 text-[11px]">Logged in as:</span>
            <strong className="text-slate-800 text-xs font-bold">{user?.name || "Super Admin"}</strong>
            <span className="role-tag-pill">{currentRole.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="role-switcher-buttons-scroll">
        {DEMO_ACCOUNTS.map((acc, idx) => {
          const isActive = user?.email === acc.email;
          const Icon = acc.icon;
          return (
            <button
              key={`${acc.email}-${idx}`}
              type="button"
              disabled={switching}
              onClick={() => handleSwitch(acc)}
              className={`role-switcher-chip ${isActive ? "is-active" : ""}`}
              title={`Switch to ${acc.name} (${acc.email})`}
            >
              <div className={`chip-icon-box ${isActive ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                <Icon size={14} />
              </div>
              <div className="chip-content">
                <span className="chip-label">{acc.label}</span>
                <span className="chip-sub">{acc.subLabel}</span>
              </div>
              {isActive && (
                <span className="active-dot" title="Current Active Role" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
