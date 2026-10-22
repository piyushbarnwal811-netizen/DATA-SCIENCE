"use client";

import {
  Building2,
  GraduationCap,
  Users,
  DoorOpen,
  CalendarCheck2,
  AlertTriangle,
  UserX,
  TrendingUp,
  Sparkles,
  Percent
} from "lucide-react";

export default function HierarchyOverviewCards({
  metrics,
  unassignedTeachers = [],
  vacantSections = [],
  onViewUnassigned,
  onViewVacant,
  onViewClassrooms
}) {
  const m = metrics || {
    totalDirectors: 2,
    totalHODs: 4,
    totalTeachers: 8,
    totalSections: 9,
    totalClassrooms: 10,
    totalStudents: 414,
    allocatedClassroomsCount: 6,
    allocationRate: 60,
    unassignedTeachersCount: 1,
    vacantSectionsCount: 1
  };

  const allocationRate = m.allocationRate || 0;

  return (
    <div className="hierarchy-overview-grid">
      {/* 1. Institutes / Directors */}
      <div className="hierarchy-kpi-card">
        <div className="kpi-top">
          <div className="kpi-icon-wrap kpi-icon--amber">
            <Building2 size={20} />
          </div>
          <span className="kpi-badge kpi-badge--amber">Level 3</span>
        </div>
        <div className="kpi-data">
          <strong className="kpi-value">{m.totalDirectors ?? 2}</strong>
          <span className="kpi-title">Directorates / Institutes</span>
          <p className="kpi-sub">Led by University Directors</p>
        </div>
      </div>

      {/* 2. Departments & HODs */}
      <div className="hierarchy-kpi-card">
        <div className="kpi-top">
          <div className="kpi-icon-wrap kpi-icon--emerald">
            <GraduationCap size={20} />
          </div>
          <span className="kpi-badge kpi-badge--emerald">Level 4</span>
        </div>
        <div className="kpi-data">
          <strong className="kpi-value">{m.totalHODs ?? 4}</strong>
          <span className="kpi-title">Academic Departments</span>
          <p className="kpi-sub">Headed by Department HODs</p>
        </div>
      </div>

      {/* 3. Sections & Enrolled Students */}
      <div className="hierarchy-kpi-card">
        <div className="kpi-top">
          <div className="kpi-icon-wrap kpi-icon--blue">
            <Users size={20} />
          </div>
          <span className="kpi-badge kpi-badge--blue">Level 5</span>
        </div>
        <div className="kpi-data">
          <div className="flex items-baseline gap-2">
            <strong className="kpi-value">{m.totalSections ?? 9}</strong>
            <span className="text-xs text-slate-500 font-medium">({m.totalStudents ?? 414} Students)</span>
          </div>
          <span className="kpi-title">Class Cohorts & Sections</span>
          <p className="kpi-sub">Across 4 Engineering Years</p>
        </div>
      </div>

      {/* 4. Teachers */}
      <div className="hierarchy-kpi-card">
        <div className="kpi-top">
          <div className="kpi-icon-wrap kpi-icon--sky">
            <CalendarCheck2 size={20} />
          </div>
          <span className="kpi-badge kpi-badge--sky">Level 6</span>
        </div>
        <div className="kpi-data">
          <strong className="kpi-value">{m.totalTeachers ?? 8}</strong>
          <span className="kpi-title">Active Faculty Members</span>
          <p className="kpi-sub">Professors & Instructors</p>
        </div>
      </div>

      {/* 5. Classroom Allocation Rate & Status */}
      <div className="hierarchy-kpi-card hierarchy-kpi-card--action" onClick={onViewClassrooms}>
        <div className="kpi-top">
          <div className="kpi-icon-wrap kpi-icon--rose">
            <DoorOpen size={20} />
          </div>
          <span className="kpi-badge kpi-badge--rose">{allocationRate}% Allocated</span>
        </div>
        <div className="kpi-data">
          <div className="flex items-baseline gap-2">
            <strong className="kpi-value">{m.allocatedClassroomsCount ?? 6}</strong>
            <span className="text-xs text-slate-500 font-medium">/ {m.totalClassrooms ?? 10} Rooms</span>
          </div>
          <span className="kpi-title">Classroom & Lab Allocation</span>
          <div className="allocation-progress-bar">
            <div
              className="allocation-progress-fill"
              style={{ width: `${Math.min(allocationRate, 100)}%` }}
            />
          </div>
          <p className="kpi-sub">Click to view classroom & lab inventory</p>
        </div>
      </div>

      {/* 6. Unassigned Teachers Alert */}
      <div
        className={`hierarchy-kpi-card ${
          (m.unassignedTeachersCount || unassignedTeachers.length) > 0
            ? "hierarchy-kpi-card--warning"
            : ""
        }`}
        onClick={onViewUnassigned}
      >
        <div className="kpi-top">
          <div className="kpi-icon-wrap kpi-icon--warning">
            <UserX size={20} />
          </div>
          <span className="kpi-badge kpi-badge--warning">
            {(m.unassignedTeachersCount || unassignedTeachers.length)} Alert
          </span>
        </div>
        <div className="kpi-data">
          <strong className="kpi-value">
            {m.unassignedTeachersCount ?? unassignedTeachers.length}
          </strong>
          <span className="kpi-title">Unassigned Faculty</span>
          <p className="kpi-sub text-amber-700">
            {(m.unassignedTeachersCount || unassignedTeachers.length) > 0
              ? "Faculty with no assigned section cohorts"
              : "All teachers have assigned cohorts"}
          </p>
        </div>
      </div>

      {/* 7. Vacant Sections Alert */}
      <div
        className={`hierarchy-kpi-card ${
          (m.vacantSectionsCount || vacantSections.length) > 0
            ? "hierarchy-kpi-card--warning"
            : ""
        }`}
        onClick={onViewVacant}
      >
        <div className="kpi-top">
          <div className="kpi-icon-wrap kpi-icon--warning">
            <AlertTriangle size={20} />
          </div>
          <span className="kpi-badge kpi-badge--warning">
            {(m.vacantSectionsCount || vacantSections.length)} Alert
          </span>
        </div>
        <div className="kpi-data">
          <strong className="kpi-value">
            {m.vacantSectionsCount ?? vacantSections.length}
          </strong>
          <span className="kpi-title">Vacant / Unstaffed Sections</span>
          <p className="kpi-sub text-amber-700">
            {(m.vacantSectionsCount || vacantSections.length) > 0
              ? "0 students or no class teacher"
              : "All sections fully staffed"}
          </p>
        </div>
      </div>
    </div>
  );
}
