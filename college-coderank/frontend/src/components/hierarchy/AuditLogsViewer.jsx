"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Sparkles,
  User,
  Clock,
  ShieldCheck,
  Activity,
  Calendar
} from "lucide-react";
import api from "../../services/api.js";

const ACTION_COLORS = {
  CREATE_USER: "bg-purple-100 text-purple-800",
  UPDATE_USER: "bg-blue-100 text-blue-800",
  DELETE_USER: "bg-rose-100 text-rose-800",
  CREATE_DIRECTORATE: "bg-amber-100 text-amber-800",
  CREATE_DEPARTMENT: "bg-emerald-100 text-emerald-800",
  CREATE_SECTION: "bg-indigo-100 text-indigo-800",
  CREATE_CLASSROOM: "bg-pink-100 text-pink-800",
  ALLOCATE_TIMETABLE: "bg-teal-100 text-teal-800",
  DELETE_TIMETABLE: "bg-orange-100 text-orange-800"
};

export default function AuditLogsViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/hierarchy/audit-logs");
        setLogs(data.logs || []);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) => actionFilter === "all" || l.action === actionFilter
  );

  return (
    <div className="audit-logs-container space-y-4">
      <div className="timetable-top-bar">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
              <ShieldAlert size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Institutional Governance & Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all user appointments, role assignments, department creations, and classroom allocations.
          </p>
        </div>

        <div className="visualizer-filter-select">
          <Filter size={13} className="text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All Actions ({logs.length})</option>
            <option value="CREATE_USER">Create User</option>
            <option value="UPDATE_USER">Update User</option>
            <option value="DELETE_USER">Delete User</option>
            <option value="ALLOCATE_TIMETABLE">Allocate Timetable</option>
            <option value="DELETE_TIMETABLE">De-allocate Timetable</option>
          </select>
        </div>
      </div>

      <div className="timetable-table-card">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Sparkles size={20} className="animate-spin text-purple-500 mx-auto mb-2" />
            Loading system audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Activity size={24} className="text-slate-300 mx-auto mb-2" />
            No audit records matching selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                  <th className="py-2.5 px-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const badgeColor = ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700";
                  const dateStr = new Date(log.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <strong className="block text-slate-800 text-xs">{log.userName}</strong>
                        <span className="text-[10px] text-slate-500">{log.role}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {log.entityType}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-md">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[10px] text-slate-400">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
