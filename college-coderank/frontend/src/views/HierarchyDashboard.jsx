"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  DoorOpen,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Building2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import RoleSwitcherBar from "../components/hierarchy/RoleSwitcherBar.jsx";
import HierarchyOverviewCards from "../components/hierarchy/HierarchyOverviewCards.jsx";
import HierarchyVisualizer from "../components/hierarchy/HierarchyVisualizer.jsx";
import ClassroomTimetableGrid from "../components/hierarchy/ClassroomTimetableGrid.jsx";
import DepartmentReportsView from "../components/hierarchy/DepartmentReportsView.jsx";
import UserManagementTable from "../components/hierarchy/UserManagementTable.jsx";
import AuditLogsViewer from "../components/hierarchy/AuditLogsViewer.jsx";
import RoleScopedPanel from "../components/hierarchy/RoleScopedPanel.jsx";

export default function HierarchyDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("tree");
  const [treeData, setTreeData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const currentRole = user?.role === "admin" ? "super_admin" : (user?.role || "super_admin");
  const isSuperAdmin = currentRole === "super_admin";
  const isTpo = currentRole === "tpo";
  const isDirector = currentRole === "director";
  const isHod = currentRole === "hod";
  const isTeacher = currentRole === "teacher";

  const fetchHierarchyData = useCallback(async () => {
    setError(null);
    try {
      const [treeRes, overRes] = await Promise.all([
        api.get("/hierarchy/tree"),
        api.get("/hierarchy/overview")
      ]);
      setTreeData(treeRes.data.tree);
      setOverview(overRes.data);
    } catch (err) {
      console.error("Hierarchy fetch error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load hierarchical structure. Please verify backend API."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchyData();
  }, [fetchHierarchyData, user?.role, user?.email]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHierarchyData();
  };

  return (
    <div className="hierarchy-page-root space-y-6">
      {/* 1. Header Banner */}
      <div className="hierarchy-hero-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="hero-pill-badge">
                <Sparkles size={12} className="text-amber-300" />
                Rungta International Skills University
              </span>
              <span className="hero-pill-badge-sub">
                Enterprise Multi-Tier Governance
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              College Hierarchical Management System
            </h1>
            <p className="text-xs text-white/80 max-w-2xl mt-1">
              Live organizational architecture enforcing strict role boundaries:{" "}
              <strong>Super Admin → TPO → Directors → HODs → Sections → Teachers → Classrooms</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="button button--white text-xs py-1.5 px-3 h-8 gap-1.5"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Sync Hierarchy"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Role Switcher / Simulator */}
      <RoleSwitcherBar onRoleSwitched={handleRefresh} />

      {/* 3. Role-Scoped Responsibility Banner */}
      <RoleScopedPanel
        user={user}
        treeData={treeData}
        overviewData={overview}
        onSwitchTab={setActiveTab}
      />

      {/* 4. High-Level Summary Metrics & Alerts */}
      <HierarchyOverviewCards
        metrics={overview?.metrics}
        unassignedTeachers={overview?.unassignedTeachers}
        vacantSections={overview?.vacantSections}
        onViewUnassigned={() => setActiveTab("reports")}
        onViewVacant={() => setActiveTab("reports")}
        onViewClassrooms={() => setActiveTab("classrooms")}
      />

      {/* 5. Navigation Tabs */}
      <div className="hierarchy-nav-tabs-wrapper">
        <div className="hierarchy-nav-tabs">
          <button
            type="button"
            onClick={() => setActiveTab("tree")}
            className={`tab-btn ${activeTab === "tree" ? "is-active" : ""}`}
          >
            <Layers size={15} />
            <span>Organizational Tree</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("classrooms")}
            className={`tab-btn ${activeTab === "classrooms" ? "is-active" : ""}`}
          >
            <DoorOpen size={15} />
            <span>Classroom & Lab Allocation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`tab-btn ${activeTab === "reports" ? "is-active" : ""}`}
          >
            <FileSpreadsheet size={15} />
            <span>Department Reports & Ratios</span>
          </button>

          {(isSuperAdmin || isTpo || isDirector || isHod) && (
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`tab-btn ${activeTab === "users" ? "is-active" : ""}`}
            >
              <Users size={15} />
              <span>User & Role Directory</span>
            </button>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`tab-btn ${activeTab === "audit" ? "is-active" : ""}`}
            >
              <ShieldAlert size={15} />
              <span>Audit Trail Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* 6. Active Tab Content */}
      <div className="hierarchy-tab-content">
        {loading && !treeData ? (
          <div className="p-16 text-center text-slate-500 text-xs">
            <Sparkles size={28} className="animate-spin text-red-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Connecting to University Database...</p>
            <span className="text-[11px] text-slate-400">
              Retrieving live MongoDB hierarchy models
            </span>
          </div>
        ) : error ? (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-800 text-xs max-w-xl mx-auto">
            <AlertTriangle size={24} className="text-rose-600 mx-auto mb-2" />
            <strong className="block font-bold text-sm mb-1">Hierarchy Error</strong>
            <span>{error}</span>
          </div>
        ) : (
          <>
            {activeTab === "tree" && (
              <HierarchyVisualizer
                treeData={treeData}
                onOpenTimetable={() => setActiveTab("classrooms")}
              />
            )}

            {activeTab === "classrooms" && (
              <ClassroomTimetableGrid
                canManage={isSuperAdmin || isDirector || isHod}
              />
            )}

            {activeTab === "reports" && (
              <DepartmentReportsView
                unassignedTeachers={overview?.unassignedTeachers || []}
                vacantSections={overview?.vacantSections || []}
              />
            )}

            {activeTab === "users" && (
              <UserManagementTable canEdit={isSuperAdmin} />
            )}

            {activeTab === "audit" && isSuperAdmin && (
              <AuditLogsViewer />
            )}
          </>
        )}
      </div>
    </div>
  );
}
