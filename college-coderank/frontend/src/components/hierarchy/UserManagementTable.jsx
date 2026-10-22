"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ShieldCheck,
  Building,
  GraduationCap,
  Briefcase,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone
} from "lucide-react";
import api from "../../services/api.js";

const ROLE_BADGES = {
  super_admin: { label: "Super Admin", color: "bg-purple-100 text-purple-800 border-purple-200" },
  tpo: { label: "TPO", color: "bg-blue-100 text-blue-800 border-blue-200" },
  director: { label: "Director", color: "bg-amber-100 text-amber-800 border-amber-200" },
  hod: { label: "HOD", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  teacher: { label: "Teacher", color: "bg-sky-100 text-sky-800 border-sky-200" }
};

export default function UserManagementTable({ canEdit = true }) {
  const [users, setUsers] = useState([]);
  const [directorates, setDirectorates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "rungta@123",
    role: "teacher",
    employeeId: "",
    phone: "",
    designation: "",
    qualification: "",
    directorateId: "",
    departmentId: "",
    assignedSections: []
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [uRes, dirRes, deptRes, secRes] = await Promise.all([
        api.get("/hierarchy/users"),
        api.get("/hierarchy/directorates"),
        api.get("/hierarchy/departments"),
        api.get("/hierarchy/sections")
      ]);
      setUsers(uRes.data.users || []);
      setDirectorates(dirRes.data.directorates || []);
      setDepartments(deptRes.data.departments || []);
      setSections(secRes.data.sections || []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "rungta@123",
      role: "teacher",
      employeeId: "",
      phone: "",
      designation: "",
      qualification: "",
      directorateId: "",
      departmentId: "",
      assignedSections: []
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      employeeId: u.employeeId || "",
      phone: u.phone || "",
      designation: u.designation || "",
      qualification: u.qualification || "",
      directorateId: u.directorateId?._id || u.directorateId || "",
      departmentId: u.departmentId?._id || u.departmentId || "",
      assignedSections: (u.assignedSections || []).map((s) => s._id || s)
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      if (editingUser) {
        await api.put(`/hierarchy/users/${editingUser._id}`, formData);
      } else {
        await api.post("/hierarchy/users", formData);
      }
      await fetchUsers();
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Are you sure you want to delete ${u.role.toUpperCase()} "${u.name}" (${u.email})?`)) return;
    try {
      await api.delete(`/hierarchy/users/${u._id}`);
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.employeeId?.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <div className="user-management-container">
      {/* Top Header */}
      <div className="timetable-top-bar">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
              <Users size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Institutional User & Role Governance
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, update, and manage accounts for Super Admins, TPOs, Directors, HODs, and Teachers.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openCreateModal}
            className="button button--primary text-xs py-1.5 px-3 h-8 gap-1.5"
          >
            <UserPlus size={14} />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="timetable-filters-row">
        <div className="visualizer-search-box flex-1 max-w-sm">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="visualizer-filter-select">
          <Filter size={13} className="text-slate-400" />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles ({users.length})</option>
            <option value="super_admin">Super Admins</option>
            <option value="tpo">TPOs</option>
            <option value="director">Directors</option>
            <option value="hod">HODs</option>
            <option value="teacher">Teachers / Faculty</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="timetable-table-card">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Sparkles size={20} className="animate-spin text-purple-500 mx-auto mb-2" />
            Loading registered staff members...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Users size={24} className="text-slate-300 mx-auto mb-2" />
            No staff records matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b">
                <tr>
                  <th className="py-2.5 px-3">Name & Employee ID</th>
                  <th className="py-2.5 px-3">Role / Authority</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Department / Institute</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Status</th>
                  {canEdit && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const badge = ROLE_BADGES[u.role] || ROLE_BADGES.teacher;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3">
                        <strong className="block text-slate-800 text-xs">{u.name}</strong>
                        <span className="font-mono text-[10px] text-slate-500">
                          {u.employeeId || "NO-ID"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail size={11} className="text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <Phone size={10} className="text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {u.departmentId?.name ? (
                          <span className="font-semibold text-emerald-800">
                            {u.departmentId.name} ({u.departmentId.code})
                          </span>
                        ) : u.directorateId?.name ? (
                          <span className="font-semibold text-amber-800">
                            {u.directorateId.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Institution-Wide</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {u.designation || "Faculty Member"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded mr-1"
                            title="Edit User"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Modal */}
      {modalOpen && (
        <div className="hierarchy-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="hierarchy-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hierarchy-modal-header bg-gradient-to-r from-purple-600 to-indigo-700">
              <div>
                <span className="modal-level-tag">STAFF ACCOUNT DIRECTORY</span>
                <h2 className="modal-node-title">
                  {editingUser ? `Edit ${editingUser.name}` : "Create New Staff Account"}
                </h2>
                <p className="modal-node-subtitle">Assign role, department, and institutional hierarchy scope</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="hierarchy-modal-body space-y-3">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                    placeholder="e.g. Dr. Rajesh Kumar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingUser)}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white disabled:bg-slate-100"
                    placeholder="e.g. faculty@rungta.ac.in"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white font-semibold"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="tpo">TPO</option>
                    <option value="director">Director</option>
                    <option value="hod">HOD</option>
                    <option value="teacher">Teacher / Faculty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white font-mono"
                    placeholder="EMP-1024"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Directorate / Institute</label>
                  <select
                    value={formData.directorateId}
                    onChange={(e) => setFormData({ ...formData, directorateId: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                  >
                    <option value="">-- None / General --</option>
                    {directorates.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                  >
                    <option value="">-- None / Cross-Department --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                    placeholder="e.g. Professor & Head, Associate Professor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full text-xs p-2 border rounded bg-white"
                    placeholder="e.g. Ph.D. in Computer Science, M.Tech"
                  />
                </div>
              </div>

              <div className="hierarchy-modal-footer mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="button button--white">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="button button--primary">
                  {submitting ? "Saving..." : editingUser ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
