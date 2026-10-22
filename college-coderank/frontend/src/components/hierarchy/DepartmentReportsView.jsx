"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  GraduationCap,
  Users,
  DoorOpen,
  UserX,
  AlertTriangle,
  Building,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import api from "../../services/api.js";

export default function DepartmentReportsView({ unassignedTeachers = [], vacantSections = [] }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/hierarchy/reports");
        setReports(data.departmentReports || []);
      } catch (err) {
        console.error("Failed to load department reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!reports.length) return;
    const headers = ["Department", "Code", "Directorate", "HOD", "Sections", "Faculty", "Classrooms", "Total Students", "Student-Teacher Ratio"];
    const rows = reports.map((r) => [
      `"${r.name}"`,
      r.code,
      `"${r.directorate}"`,
      `"${r.hod}"`,
      r.totalSections,
      r.totalTeachers,
      r.totalClassrooms,
      r.totalStudents,
      `"${r.studentTeacherRatio}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `department_hierarchy_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="department-reports-container space-y-5">
      {/* Top Header */}
      <div className="timetable-top-bar">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <FileSpreadsheet size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Departmental Hierarchy & Faculty Load Reports
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional statistics, student-to-teacher ratios, and capacity metrics per department.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="button button--white text-xs py-1.5 px-3 h-8 gap-1.5"
            title="Download CSV Spreadsheet"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="button button--white text-xs py-1.5 px-3 h-8 gap-1.5"
            title="Print Report"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Breakdown Table */}
      <div className="timetable-table-card">
        <div className="p-3 border-b bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Academic Departments Breakdown ({reports.length} Departments)
          </span>
          <span className="text-[11px] text-slate-500">
            Source: Live MongoDB University Atlas
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Sparkles size={20} className="animate-spin text-emerald-500 mx-auto mb-2" />
            Compiling institutional department analytics...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b">
                <tr>
                  <th className="py-2.5 px-3">Department & Code</th>
                  <th className="py-2.5 px-3">Affiliated Directorate</th>
                  <th className="py-2.5 px-3">Appointed HOD</th>
                  <th className="py-2.5 px-3 text-center">Sections</th>
                  <th className="py-2.5 px-3 text-center">Faculty</th>
                  <th className="py-2.5 px-3 text-center">Classrooms</th>
                  <th className="py-2.5 px-3 text-center">Students</th>
                  <th className="py-2.5 px-3 text-right">Student-Teacher Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3">
                      <strong className="block text-slate-800 text-xs font-bold">{dept.name}</strong>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building size={13} className="text-amber-500" />
                        <span>{dept.directorate}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap size={14} className="text-emerald-600" />
                        <span>{dept.hod}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {dept.totalSections}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {dept.totalTeachers}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {dept.totalClassrooms}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                      {dept.totalStudents}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-mono text-xs font-bold">
                        {dept.studentTeacherRatio}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unassigned Faculty & Vacant Sections Dual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unassigned Teachers Box */}
        <div className="timetable-table-card">
          <div className="p-3 border-b bg-amber-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX size={16} className="text-amber-600" />
              <strong className="text-xs text-amber-900 font-bold">
                Unassigned Faculty Members ({unassignedTeachers.length})
              </strong>
            </div>
            <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">
              Needs Attention
            </span>
          </div>

          {unassignedTeachers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-1.5" />
              All registered faculty members have active teaching or section assignments.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unassignedTeachers.map((t) => (
                <div key={t.id || t._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <strong className="text-xs text-slate-800 block">{t.name}</strong>
                    <span className="text-[11px] text-slate-500 block">
                      {t.department} · {t.designation}
                    </span>
                    <span className="text-[10px] text-slate-400">{t.email}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                    0 Slots Assigned
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vacant Sections Box */}
        <div className="timetable-table-card">
          <div className="p-3 border-b bg-rose-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600" />
              <strong className="text-xs text-rose-900 font-bold">
                Vacant / Unstaffed Cohorts ({vacantSections.length})
              </strong>
            </div>
            <span className="text-[10px] text-rose-700 uppercase font-bold tracking-wider">
              Needs Attention
            </span>
          </div>

          {vacantSections.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-1.5" />
              All sections and classes have appointed class teachers and enrolled students.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vacantSections.map((s) => (
                <div key={s.id || s._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <strong className="text-xs text-slate-800 block">{s.name}</strong>
                    <span className="text-[11px] text-slate-500 block">
                      {s.department || "Department"} · Year {s.year} (Sem {s.semester})
                    </span>
                    <span className="text-[10px] text-rose-600 font-semibold">{s.reason}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                    Vacant
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
