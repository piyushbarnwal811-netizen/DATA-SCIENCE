"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Users,
  RefreshCw,
  AlertCircle,
  Award,
  Calendar,
  Building,
  Mail,
  Phone,
  Clock
} from "lucide-react";
import api, { errorMessage } from "../../services/api.js";

export default function TeacherDashboardView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api.get("/hierarchy/teacher/my-schedule");
      setData(res);
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

  const teacher = data?.teacher;
  const department = data?.department;
  const directorate = data?.directorate;
  const hod = data?.hod;
  const classTeacherOf = data?.classTeacherOf || [];
  const timetable = data?.timetable || [];

  const assignedSections = teacher?.assignedSections || [];
  const assignedSubjects = teacher?.assignedSubjects || [];

  return (
    <div className="space-y-6">
      {/* Teacher Profile Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-sky-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                <BookOpen size={13} /> Faculty Member Portal
              </span>
              <span className="text-[11px] text-slate-300">
                {department ? department.name : "Department Faculty"}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {teacher?.name || "Teacher Academic Schedule"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {teacher?.designation || "Faculty Member"} · {department?.name || "Academic Department"} · {directorate?.name || "University Faculty"}
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
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Sections</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{assignedSections.length}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Subjects</span>
            <strong className="text-2xl font-extrabold text-white mt-1 block">{assignedSubjects.length}</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class Teacher Of</span>
            <strong className="text-2xl font-extrabold text-amber-400 mt-1 block">{classTeacherOf.length} Cohort(s)</strong>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Slots</span>
            <strong className="text-2xl font-extrabold text-emerald-400 mt-1 block">{timetable.length} Slots</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Department & HOD Information Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Administration</span>
          <h3 className="font-extrabold text-slate-800 text-sm">
            {department ? `${department.name} (${department.code || "DEPT"})` : "General Engineering"}
          </h3>
          <p className="text-xs text-slate-500">
            {department?.buildingBlock ? `Location: ${department.buildingBlock} · ${department.floor || ""}` : "Campus Complex"}
          </p>
        </div>

        {hod ? (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              HOD
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Head of Department</span>
              <strong className="text-slate-800 text-xs block">{hod.name}</strong>
              <span className="text-[11px] font-mono text-slate-500">{hod.email}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">No HOD currently appointed</div>
        )}
      </div>

      {/* Sections and Subjects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Layers size={17} className="text-sky-600" />
              <span>My Assigned Sections</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{assignedSections.length} Sections</span>
          </div>

          {assignedSections.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              <Layers size={28} className="mx-auto mb-2 text-slate-300" />
              <strong className="block font-bold text-slate-700">No sections assigned yet</strong>
              <span>Your Head of Department (HOD) will assign your teaching sections</span>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedSections.map((sec) => {
                const isClassTeacher = classTeacherOf.some((c) => String(c._id) === String(sec._id));
                return (
                  <div key={sec._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-extrabold text-sm">{sec.name}</strong>
                      <div className="flex items-center gap-1.5">
                        {isClassTeacher && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <Award size={10} /> Class Teacher
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                          Year {sec.year} · Sem {sec.semester}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>Total Students: <strong>{sec.totalStudents}</strong></span>
                      <span>Academic Year: <strong>{sec.academicYear || "2026-2027"}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assigned Subjects */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <BookOpen size={17} className="text-sky-600" />
              <span>Teaching Subjects</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{assignedSubjects.length} Subjects</span>
          </div>

          {assignedSubjects.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              <BookOpen size={28} className="mx-auto mb-2 text-slate-300" />
              <strong className="block font-bold text-slate-700">No subjects assigned yet</strong>
              <span>Subjects allocated by your HOD will appear here</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedSubjects.map((sub, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Subject Course</span>
                  <strong className="text-slate-900 font-extrabold text-xs block">{sub}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timetable Schedule Section if available */}
      {timetable.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar size={17} className="text-sky-600" />
            <span>Weekly Class Timetable</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Time Slot</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((slot) => (
                  <tr key={slot._id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-700">{slot.dayOfWeek}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {slot.timeSlot}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{slot.subjectName}</td>
                    <td className="py-3 px-3 text-slate-600">{slot.sectionId?.name || "Section"}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{slot.classroomId?.roomNumber || "Assigned Room"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
