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
  Edit2
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";

export default function TpoDashboardView() {
  const [data, setData] = useState(null);
  const [directorsList, setDirectorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [assignModal, setAssignModal] = useState(null); // { directorateId, name, currentDirectorId }
  const [selectedDirectorId, setSelectedDirectorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tpoRes, dirRes] = await Promise.all([
        api.get("/hierarchy/tpo/overview"),
        api.get("/hierarchy/directors")
      ]);
      setData(tpoRes.data);
      setDirectorsList(dirRes.data.directors || []);
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
      refreshAll();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const metrics = data?.metrics || {
    totalDirectorates: 0,
    totalDepartments: 0,
    totalStudents: 0,
    vacantDirectorates: 0
  };

  const directorates = data?.directorates || [];
  const departments = data?.departments || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Briefcase size={13} /> Training &amp; Placement Office
              </span>
              <span className="text-[11px] text-slate-300">
                Placement Governance &amp; Directorate Oversight
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              TPO Placement &amp; Directorate Management
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Inspect university faculties, manage Director organizational assignments according to college policy, and monitor department-level coding profile readiness.
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

        {/* Real Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Academic Directorates</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.totalDirectorates}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Academic Departments</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{metrics.totalDepartments}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Placement-Eligible Students</span>
            <strong className="text-2xl font-extrabold text-emerald-400 mt-1 block">{metrics.totalStudents}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Vacant Directorates</span>
            <strong className={`text-2xl font-extrabold mt-1 block ${metrics.vacantDirectorates > 0 ? "text-amber-400" : "text-white"}`}>
              {metrics.vacantDirectorates}
            </strong>
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

      {/* Main Directorate Management Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Directorate &amp; Director Assignments</h2>
          <p className="text-xs text-slate-500">
            View directorates across the university and manage Director assignments per college policy.
          </p>
        </div>

        {directorates.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Building size={36} className="text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Directorates Registered</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No faculty directorates found in the database. Contact the Super Admin to establish academic faculties.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Faculty / Directorate</th>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Campus Building</th>
                  <th className="py-3 px-3">Appointed Director</th>
                  <th className="py-3 px-3">Director Email</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directorates.map((dir) => (
                  <tr key={dir._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <strong className="text-slate-800 font-bold block">{dir.name}</strong>
                      <span className="text-[11px] text-slate-400">{dir.description || "—"}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-indigo-700">{dir.code}</td>
                    <td className="py-3.5 px-3 text-slate-600">{dir.building || "Main Tower"}</td>
                    <td className="py-3.5 px-3">
                      {dir.directorId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <strong className="text-slate-800 font-semibold">{dir.directorId.name}</strong>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200">
                          Vacant Position
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-500">{dir.directorId?.email || "—"}</td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignModal({
                            directorateId: dir._id,
                            name: dir.name,
                            currentDirectorId: dir.directorId?._id || ""
                          });
                          setSelectedDirectorId(dir.directorId?._id || "");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 cursor-pointer transition-all"
                      >
                        <Edit2 size={12} />
                        <span>Assign Director</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Department Readiness Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Departmental Readiness &amp; HOD Contacts</h2>
          <p className="text-xs text-slate-500">
            Departments participating in university training and placements.
          </p>
        </div>

        {departments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <GraduationCap size={32} className="mx-auto mb-2 text-slate-300" />
            <strong className="block font-bold text-slate-700">No departments configured yet</strong>
            <span>Departments will appear here once added by Directors or Super Admin</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {dept.code || "DEPT"}
                  </span>
                  <span className="text-[11px] text-slate-400">{dept.directorateId?.name || "General"}</span>
                </div>
                <strong className="block text-slate-800 text-xs font-bold">{dept.name}</strong>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                  <span>HOD:</span>
                  <strong className="text-slate-700">{dept.hodId?.name || "Unassigned"}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Assign Director */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building size={16} className="text-indigo-600" />
                Assign Director for {assignModal.name}
              </h3>
              <button type="button" onClick={() => setAssignModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Director</label>
                <select
                  value={selectedDirectorId}
                  onChange={(e) => setSelectedDirectorId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Vacant / Unassigned --</option>
                  {directorsList.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.email})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select an authorized Director to lead this academic faculty.
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
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
