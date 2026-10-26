"use client";

import {
  X,
  Mail,
  Phone,
  Building,
  User,
  GraduationCap,
  Calendar,
  DoorOpen,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  BookOpen,
  Laptop
} from "lucide-react";

export default function NodeDetailModal({ node, onClose, onActionClick }) {
  if (!node) return null;

  const d = node.details || {};
  const s = node.stats || {};

  const getLevelColor = (level) => {
    switch (level) {
      case "super_admin":
        return { bg: "bg-red-100 text-red-800 border-red-300", header: "from-red-600 to-rose-700" };
      case "tpo":
        return { bg: "bg-blue-100 text-blue-800 border-blue-300", header: "from-blue-600 to-cyan-600" };
      case "director":
        return { bg: "bg-amber-100 text-amber-800 border-amber-300", header: "from-amber-600 to-orange-600" };
      case "hod":
        return { bg: "bg-emerald-100 text-emerald-800 border-emerald-300", header: "from-emerald-600 to-teal-600" };
      case "section":
        return { bg: "bg-indigo-100 text-indigo-800 border-indigo-300", header: "from-indigo-600 to-blue-600" };
      case "teacher":
        return { bg: "bg-sky-100 text-sky-800 border-sky-300", header: "from-sky-600 to-cyan-600" };
      case "classroom":
        return { bg: "bg-rose-100 text-rose-800 border-rose-300", header: "from-rose-600 to-pink-600" };
      default:
        return { bg: "bg-slate-100 text-slate-800 border-slate-300", header: "from-slate-700 to-slate-900" };
    }
  };

  const colors = getLevelColor(node.level);

  return (
    <div className="hierarchy-modal-backdrop" onClick={onClose}>
      <div className="hierarchy-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`hierarchy-modal-header bg-gradient-to-r ${colors.header}`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="modal-level-tag">{node.role?.toUpperCase() || node.level?.toUpperCase()}</span>
              {node.badge && (
                <span className="modal-badge-tag">{node.badge}</span>
              )}
            </div>
            <h2 className="modal-node-title">{node.name}</h2>
            {node.subTitle && (
              <p className="modal-node-subtitle">{node.subTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="hierarchy-modal-body">
          {/* Metadata Grid */}
          <div className="modal-meta-grid">
            {d.email && (
              <div className="meta-item">
                <span className="meta-icon"><Mail size={14} /></span>
                <div>
                  <label>Email Address</label>
                  <a href={`mailto:${d.email}`} className="text-blue-600 hover:underline">{d.email}</a>
                </div>
              </div>
            )}
            {d.phone && (
              <div className="meta-item">
                <span className="meta-icon"><Phone size={14} /></span>
                <div>
                  <label>Contact Phone</label>
                  <span>{d.phone}</span>
                </div>
              </div>
            )}
            {d.employeeId && (
              <div className="meta-item">
                <span className="meta-icon"><User size={14} /></span>
                <div>
                  <label>Employee ID</label>
                  <span className="font-mono font-bold text-slate-700">{d.employeeId}</span>
                </div>
              </div>
            )}
            {d.designation && (
              <div className="meta-item">
                <span className="meta-icon"><GraduationCap size={14} /></span>
                <div>
                  <label>Designation</label>
                  <span>{d.designation}</span>
                </div>
              </div>
            )}
            {(d.building || d.buildingBlock) && (
              <div className="meta-item">
                <span className="meta-icon"><MapPin size={14} /></span>
                <div>
                  <label>Campus Location</label>
                  <span>
                    {d.building || d.buildingBlock}
                    {d.floor ? ` · ${d.floor}` : ""}
                  </span>
                </div>
              </div>
            )}
            {d.roomNumber && (
              <div className="meta-item">
                <span className="meta-icon"><DoorOpen size={14} /></span>
                <div>
                  <label>Room Number & Type</label>
                  <span className="font-bold">{d.roomNumber} ({d.roomType || "Classroom"})</span>
                </div>
              </div>
            )}
            {d.capacity && (
              <div className="meta-item">
                <span className="meta-icon"><User size={14} /></span>
                <div>
                  <label>Capacity</label>
                  <span>{d.capacity} Persons</span>
                </div>
              </div>
            )}
            {d.classTeacher && (
              <div className="meta-item">
                <span className="meta-icon"><GraduationCap size={14} /></span>
                <div>
                  <label>Class Teacher</label>
                  <span className="font-semibold text-emerald-700">{d.classTeacher}</span>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Subjects / Amenities if any */}
          {d.assignedSubjects && d.assignedSubjects.length > 0 && (
            <div className="modal-section-block">
              <label className="section-block-title">
                <BookOpen size={14} /> Assigned Subjects / Specializations
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {d.assignedSubjects.map((sub, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-semibold text-slate-700">
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Classroom Amenities */}
          {node.level === "classroom" && (
            <div className="modal-section-block">
              <label className="section-block-title">
                <Sparkles size={14} /> Facility & Infrastructure Amenities
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border text-xs">
                  <CheckCircle2 size={14} className={d.hasProjector ? "text-emerald-600" : "text-slate-300"} />
                  <span>Interactive Projector: <strong>{d.hasProjector ? "Available" : "No"}</strong></span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border text-xs">
                  <CheckCircle2 size={14} className={d.hasSmartBoard ? "text-emerald-600" : "text-slate-300"} />
                  <span>Smart Digital Board: <strong>{d.hasSmartBoard ? "Yes" : "No"}</strong></span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border text-xs">
                  <CheckCircle2 size={14} className={d.hasAirConditioning ? "text-emerald-600" : "text-slate-300"} />
                  <span>Air Conditioning (AC): <strong>{d.hasAirConditioning ? "Equipped" : "No"}</strong></span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border text-xs">
                  <Laptop size={14} className={d.workstationsCount > 0 ? "text-blue-600" : "text-slate-300"} />
                  <span>Workstations: <strong>{d.workstationsCount || 0} Systems</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Allocated Section Status */}
          {d.allocatedSection && (
            <div className="modal-section-block">
              <label className="section-block-title">
                <DoorOpen size={14} /> Section Cohort Allocation
              </label>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 mt-2 font-semibold">
                {d.status || `Primary room assigned for Section ${d.allocatedSection}`}
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          {Object.keys(s).length > 0 && (
            <div className="modal-section-block">
              <label className="section-block-title">
                <Layers size={14} /> Subordinate Statistics
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {Object.entries(s).map(([key, val]) => (
                  <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-center">
                    <strong className="block text-base font-bold text-slate-800">{val}</strong>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="hierarchy-modal-footer">
          <button type="button" onClick={onClose} className="button button--white">
            Close
          </button>
          {onActionClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onActionClick(node);
              }}
              className="button button--primary"
            >
              Classroom & Lab Inventory
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
