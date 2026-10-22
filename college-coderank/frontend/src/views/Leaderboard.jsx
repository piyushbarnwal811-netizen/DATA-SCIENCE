"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Download, FileSpreadsheet, Radio, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Loader from "../components/Loader.jsx";
import StudentAnalyticsDashboard from "../components/analytics/StudentAnalyticsDashboard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api, { errorMessage } from "../services/api.js";
import { useRealtimeSync } from "../services/realtime.js";
import { SAMPLE_STUDENTS } from "../utils/dashboardData.js";

export default function Leaderboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams?.get("search") ?? "",
    branch: "",
    section: "",
    year: "",
    limit: searchParams?.get("limit") ?? ""
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [liveNotice, setLiveNotice] = useState("");

  const fetchLeaderboard = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );
    return api.get("/leaderboard", { params })
      .then(({ data: response }) => {
        setData(response);
        setError("");
      })
      .catch((requestError) => {
        // Fallback to sample data gracefully if backend is offline
        if (!silent) {
          console.warn("Backend leaderboard API offline, using interactive campus dataset:", requestError.message);
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchLeaderboard(false);
    }, filters.search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [filters, fetchLeaderboard]);

  // Periodic background auto-update every 25 seconds
  useEffect(() => {
    const autoInterval = window.setInterval(() => {
      fetchLeaderboard(true);
    }, 25000);
    return () => window.clearInterval(autoInterval);
  }, [fetchLeaderboard]);

  // Real-time live auto-update listener via SSE
  const { connected } = useRealtimeSync({
    onStudentUpdated: (payload) => {
      setLiveNotice(`${payload.name} updated · score: ${payload.score} pts`);
      fetchLeaderboard(true);
      setTimeout(() => setLiveNotice(""), 4000);
    },
    onLeaderboardRefresh: () => {
      fetchLeaderboard(true);
    }
  });

  const handleExportExcel = async () => {
    setExporting(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      );
      const response = await api.get("/leaderboard/export", {
        params,
        responseType: "blob"
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const limitText = filters.limit ? `_Top${filters.limit}` : "";
      link.setAttribute("download", `Leaderboard${limitText}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not export Excel spreadsheet."));
    } finally {
      setExporting(false);
    }
  };

  // Determine students list: either live from backend, or fallback to sample data filtered
  const activeStudents = useMemo(() => {
    if (data && Array.isArray(data.students)) {
      return data.students;
    }

    // Filter fallback sample students
    let filtered = [...SAMPLE_STUDENTS];
    if (filters.branch) {
      filtered = filtered.filter((s) => s.branch === filters.branch);
    }
    if (filters.section) {
      filtered = filtered.filter((s) => s.section === filters.section);
    }
    if (filters.year) {
      filtered = filtered.filter((s) => s.year === Number(filters.year));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.studentId && s.studentId.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    filtered = filtered.map((s, index) => ({ ...s, rank: index + 1 }));

    if (filters.limit) {
      const lim = Number(filters.limit);
      if (lim > 0) filtered = filtered.slice(0, lim);
    }

    return filtered;
  }, [data, filters]);

  // Departments for filters dropdown
  const departments = useMemo(() => {
    if (data?.filters?.departments && data.filters.departments.length > 0) {
      return data.filters.departments;
    }
    // Default university engineering branches
    return [
      { _id: "cse", name: "Computer Science", sections: ["A", "B", "C"] },
      { _id: "it", name: "IT", sections: ["A", "B"] },
      { _id: "ds", name: "Data Science", sections: ["A", "B"] },
      { _id: "ai", name: "AI", sections: ["A", "B"] },
      { _id: "ece", name: "ECE", sections: ["A", "B"] }
    ];
  }, [data]);

  if (!data && loading && activeStudents.length === 0) {
    return <Loader label="Compiling multi-platform intelligence rankings..." />;
  }

  return (
    <>
      {liveNotice && (
        <div className="live-toast" role="status">
          <Radio size={14} className="pulse-icon" />
          <span>{liveNotice}</span>
        </div>
      )}

      {error && <div className="inline-error" role="alert">{error}</div>}

      <StudentAnalyticsDashboard
        students={activeStudents}
        departments={departments}
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExportExcel}
        exporting={exporting}
        connected={connected}
        isAdmin={user?.role === "admin"}
      />
    </>
  );
}