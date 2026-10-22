"use client";

import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Building2,
  GraduationCap,
  Users,
  DoorOpen,
  CalendarCheck2,
  Briefcase,
  ShieldCheck,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  MapPin,
  Clock,
  Layers
} from "lucide-react";
import NodeDetailModal from "./NodeDetailModal.jsx";

const LEVEL_CONFIG = {
  super_admin: {
    title: "Level 1: Super Admin",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
    border: "border-purple-300 hover:border-purple-500",
    iconBg: "bg-purple-600 text-white",
    cardBg: "bg-purple-50/40",
    icon: ShieldCheck
  },
  tpo: {
    title: "Level 2: TPO (Placement Cell)",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
    border: "border-blue-300 hover:border-blue-500",
    iconBg: "bg-blue-600 text-white",
    cardBg: "bg-blue-50/40",
    icon: Briefcase
  },
  director: {
    title: "Level 3: Director",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-amber-300 hover:border-amber-500",
    iconBg: "bg-amber-600 text-white",
    cardBg: "bg-amber-50/40",
    icon: Building2
  },
  hod: {
    title: "Level 4: HOD (Department)",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    border: "border-emerald-300 hover:border-emerald-500",
    iconBg: "bg-emerald-600 text-white",
    cardBg: "bg-emerald-50/40",
    icon: GraduationCap
  },
  section: {
    title: "Level 5: Section / Class",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    border: "border-indigo-300 hover:border-indigo-500",
    iconBg: "bg-indigo-600 text-white",
    cardBg: "bg-indigo-50/40",
    icon: Users
  },
  teacher: {
    title: "Level 6: Teacher / Faculty",
    badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
    border: "border-sky-300 hover:border-sky-500",
    iconBg: "bg-sky-600 text-white",
    cardBg: "bg-sky-50/40",
    icon: CalendarCheck2
  },
  classroom: {
    title: "Level 7: Classroom / Lab",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    border: "border-rose-300 hover:border-rose-500",
    iconBg: "bg-rose-600 text-white",
    cardBg: "bg-rose-50/40",
    icon: DoorOpen
  }
};

function TreeNodeCard({ node, expanded, onToggle, onSelect, depth = 0 }) {
  const config = LEVEL_CONFIG[node.level] || LEVEL_CONFIG.super_admin;
  const Icon = config.icon;
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = Boolean(expanded[node.id]);

  return (
    <div className="tree-node-wrapper">
      <div
        className={`tree-node-card ${config.border} ${config.cardBg}`}
        onClick={() => onSelect(node)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`node-icon-box ${config.iconBg}`}>
            <Icon size={16} />
          </div>

          <div className="node-text-group">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`node-level-pill ${config.badgeBg}`}>
                {node.role || node.level}
              </span>
              {node.badge && (
                <span className="node-custom-badge">
                  {node.badge}
                </span>
              )}
            </div>
            <strong className="node-name" title={node.name}>
              {node.name}
            </strong>
            {node.subTitle && (
              <span className="node-sub">{node.subTitle}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Quick Stats Pill */}
          {node.stats?.totalStudents !== undefined && (
            <span className="text-[11px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded border">
              {node.stats.totalStudents} Students
            </span>
          )}
          {node.stats?.capacity !== undefined && (
            <span className="text-[11px] font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded border">
              Cap: {node.stats.capacity}
            </span>
          )}

          {/* Expand/Collapse Toggle Button */}
          {hasChildren ? (
            <button
              type="button"
              className="node-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              aria-label={isExpanded ? "Collapse branch" : "Expand branch"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span className="text-[11px] font-bold">
                {isExpanded ? "Hide" : `+${node.children.length}`}
              </span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 italic px-2">Terminal</span>
          )}
        </div>
      </div>

      {/* Children Nodes Branch */}
      {hasChildren && isExpanded && (
        <div className="tree-children-container">
          <div className="tree-connector-line" />
          <div className="tree-children-list">
            {node.children.map((child) => (
              <TreeNodeCard
                key={child.id}
                node={child}
                expanded={expanded}
                onToggle={onToggle}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HierarchyVisualizer({ treeData, onOpenTimetable }) {
  const [expanded, setExpanded] = useState({
    "root-super-admin": true,
    "dir-6ada1618a6cc111e8cdc8f82": true, // Faculty of Eng
    "dir-6ada1618a6cc111e8cdc8f83": true, // School of CS
    "hod-6ada1618a6cc111e8cdc8f84": true, // CSE
    "hod-6ada1618a6cc111e8cdc8f85": true  // DS
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  const handleToggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to collect all IDs in tree
  const getAllIds = (node) => {
    let ids = [node.id];
    if (node.tpoNodes) {
      node.tpoNodes.forEach((t) => {
        ids.push(t.id);
      });
    }
    if (node.children) {
      node.children.forEach((c) => {
        ids = ids.concat(getAllIds(c));
      });
    }
    return ids;
  };

  const handleExpandAll = () => {
    if (!treeData) return;
    const allIds = getAllIds(treeData);
    const newExpanded = {};
    allIds.forEach((id) => {
      newExpanded[id] = true;
    });
    setExpanded(newExpanded);
  };

  const handleCollapseAll = () => {
    setExpanded({ "root-super-admin": true });
  };

  // Filter tree recursively
  const filteredTree = useMemo(() => {
    if (!treeData) return null;
    if (!searchQuery.trim() && selectedDeptFilter === "all") return treeData;

    const query = searchQuery.toLowerCase().trim();

    const matchesNode = (n) => {
      const matchName = n.name?.toLowerCase().includes(query);
      const matchSub = n.subTitle?.toLowerCase().includes(query);
      const matchBadge = n.badge?.toLowerCase().includes(query);
      const matchEmail = n.details?.email?.toLowerCase().includes(query);
      const matchRoom = n.details?.roomNumber?.toLowerCase().includes(query);
      return matchName || matchSub || matchBadge || matchEmail || matchRoom;
    };

    const filterNode = (n) => {
      // Dept filter check
      if (selectedDeptFilter !== "all" && n.level === "hod") {
        if (!n.name?.toLowerCase().includes(selectedDeptFilter.toLowerCase())) {
          return null;
        }
      }

      let filteredChildren = [];
      if (n.children && n.children.length > 0) {
        filteredChildren = n.children
          .map((c) => filterNode(c))
          .filter(Boolean);
      }

      if (matchesNode(n) || filteredChildren.length > 0) {
        return {
          ...n,
          children: filteredChildren
        };
      }
      return null;
    };

    return filterNode(treeData) || treeData;
  }, [treeData, searchQuery, selectedDeptFilter]);

  if (!treeData) {
    return (
      <div className="hierarchy-empty-state">
        <Sparkles size={24} className="animate-spin text-red-500" />
        <p>Building college organizational hierarchy tree...</p>
      </div>
    );
  }

  return (
    <div className="hierarchy-visualizer-card">
      {/* Visualizer Top Control Bar */}
      <div className="visualizer-header">
        <div className="visualizer-header-title">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
              <Layers size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Interactive Organizational Tree
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any node to inspect role profile, room allocations, teaching loads, and contact info.
          </p>
        </div>

        {/* Global Toolbar: Search, Dept Filter, Expand/Collapse */}
        <div className="visualizer-actions-bar">
          {/* Search bar */}
          <div className="visualizer-search-box">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty, room, section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="visualizer-filter-select">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science (CSE)</option>
              <option value="Data Science">Data Science (DS)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="Mechanical">Mechanical Eng (ME)</option>
            </select>
          </div>

          {/* Expand/Collapse Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExpandAll}
              className="button button--white text-xs py-1 px-2.5 h-8 gap-1"
              title="Expand all levels"
            >
              <Maximize2 size={13} />
              <span>Expand All</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="button button--white text-xs py-1 px-2.5 h-8 gap-1"
              title="Collapse to top"
            >
              <Minimize2 size={13} />
              <span>Collapse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Level Color Code Legend */}
      <div className="hierarchy-legend-bar">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">Hierarchy Chain:</span>
        <span className="legend-chip legend--purple">1. Super Admin</span>
        <span className="legend-arrow">→</span>
        <span className="legend-chip legend--blue">2. TPO</span>
        <span className="legend-arrow">→</span>
        <span className="legend-chip legend--amber">3. Directors</span>
        <span className="legend-arrow">→</span>
        <span className="legend-chip legend--emerald">4. HODs</span>
        <span className="legend-arrow">→</span>
        <span className="legend-chip legend--indigo">5. Sections</span>
        <span className="legend-arrow">→</span>
        <span className="legend-chip legend--sky">6. Teachers</span>
        <span className="legend-arrow">→</span>
        <span className="legend-chip legend--rose">7. Classrooms</span>
      </div>

      {/* Main Tree Visualization Canvas */}
      <div className="hierarchy-tree-canvas">
        {/* TPO Node Banner (Placement Authority right under Super Admin) */}
        {treeData.tpoNodes && treeData.tpoNodes.length > 0 && (
          <div className="tpo-branch-container">
            <div className="tpo-branch-badge">
              <Briefcase size={13} className="text-blue-600" />
              <span>Central Training & Placement Cell (Direct Oversight)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {treeData.tpoNodes.map((tpo) => (
                <div
                  key={tpo.id}
                  className="tree-node-card border-blue-300 bg-blue-50/50 cursor-pointer hover:border-blue-500"
                  onClick={() => setSelectedNode(tpo)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="node-icon-box bg-blue-600 text-white">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="node-level-pill bg-blue-100 text-blue-800 border-blue-200">
                          TPO Head
                        </span>
                        <span className="node-custom-badge">Institution-Wide</span>
                      </div>
                      <strong className="node-name">{tpo.name}</strong>
                      <span className="node-sub">{tpo.details?.email} · {tpo.details?.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Root Node (Super Admin) & Children (Directors → HODs → Sections → Teachers → Classrooms) */}
        {filteredTree && (
          <TreeNodeCard
            node={filteredTree}
            expanded={expanded}
            onToggle={handleToggle}
            onSelect={setSelectedNode}
          />
        )}
      </div>

      {/* Node Details Inspection Modal */}
      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onActionClick={onOpenTimetable}
        />
      )}
    </div>
  );
}
