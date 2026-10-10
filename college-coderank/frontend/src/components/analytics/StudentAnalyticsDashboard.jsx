import { useState, useMemo } from "react";
import {
  BarChart3,
  BookOpen,
  Code2,
  FileSpreadsheet,
  Flame,
  Github,
  Layers,
  Radio,
  Sparkles,
  Trophy,
  Users
} from "lucide-react";
import PerformanceKPIs from "./PerformanceKPIs.jsx";
import OverallPerformanceChart from "./OverallPerformanceChart.jsx";
import HackerRankBarChart from "./HackerRankBarChart.jsx";
import LeetCodeStackedBarChart from "./LeetCodeStackedBarChart.jsx";
import GitHubReposBarChart from "./GitHubReposBarChart.jsx";
import BranchYearAnalytics from "./BranchYearAnalytics.jsx";
import InteractiveRankingsTable from "./InteractiveRankingsTable.jsx";
import PlatformDeepDive from "./PlatformDeepDive.jsx";
import FiltersBar from "../FiltersBar.jsx";
import {
  computeDashboardMetrics,
  getTopHackerRankSolvers,
  getTopLeetCodeSolvers,
  getTopGitHubBuilders,
  getOverallDistribution,
  getBranchBreakdown,
  getYearBreakdown,
  getSectionBreakdown
} from "../../utils/dashboardData.js";

export default function StudentAnalyticsDashboard({
  students = [],
  departments = [],
  filters = {},
  onFilterChange,
  onExport,
  exporting = false,
  connected = false,
  isAdmin = false
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "leetcode" | "hackerrank" | "github" | "branches"

  // Compute metrics from current filtered students
  const metrics = useMemo(() => computeDashboardMetrics(students), [students]);
  const overallDist = useMemo(() => getOverallDistribution(students, 6), [students]);
  const topHR = useMemo(() => getTopHackerRankSolvers(students, 5), [students]);
  const topLC = useMemo(() => getTopLeetCodeSolvers(students, 5), [students]);
  const topGH = useMemo(() => getTopGitHubBuilders(students, 5), [students]);
  const branchData = useMemo(() => getBranchBreakdown(students), [students]);
  const yearData = useMemo(() => getYearBreakdown(students), [students]);
  const sectionData = useMemo(() => getSectionBreakdown(students), [students]);

  return (
    <div className="perf-dashboard">
      {/* 1. Header Banner matching user's screenshot with college branding */}
      <div className="perf-banner">
        <div className="perf-banner__brand">
          <div className="perf-banner__logo">
            <span className="perf-banner__code-icon">&lt;/&gt;</span>
          </div>
          <div>
            <div className="perf-banner__eyebrow">
              RUNGTA INTERNATIONAL SKILLS UNIVERSITY · CODING INTELLIGENCE
            </div>
            <h1 className="perf-banner__title">Student Coding Performance</h1>
            <div className="perf-banner__subtitle">
              <span className="perf-pill">
                <img src="/leetcode_logo.jpeg" alt="LeetCode" className="banner-badge-img" />
                <span>Leet Code</span>
              </span>
              <span className="perf-sep">|</span>
              <span className="perf-pill">
                <img src="/codechef_logo.svg" alt="CodeChef" className="banner-badge-img" />
                <span>Code Chef</span>
              </span>
              <span className="perf-sep">|</span>
              <span className="perf-pill">
                <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="banner-badge-img" />
                <span>Hacker Rank</span>
              </span>
              <span className="perf-sep">|</span>
              <span className="perf-pill">
                <img src="/github_logo.jpeg" alt="GitHub" className="banner-badge-img" />
                <span>Git Hub</span>
              </span>
            </div>
          </div>
        </div>

        <div className="perf-banner__status">
          <div className="live-status-pill" title="Live sync active via Server-Sent Events">
            <span className={`live-dot ${connected ? "is-active" : ""}`} />
            <small>{connected ? "Live push sync active" : "Realtime ready"}</small>
          </div>
        </div>
      </div>

      {/* 2. Top 6 KPI Summary Metric Cards */}
      <PerformanceKPIs metrics={metrics} />

      {/* 3. Analytics View Navigation Tabs */}
      <div className="dashboard-nav-container">
        <div className="dashboard-nav-tabs" role="tablist">
          <button
            type="button"
            className={`dashboard-nav-tab ${activeTab === "overview" ? "is-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 size={15} />
            <span>Executive Overview</span>
          </button>
          <button
            type="button"
            className={`dashboard-nav-tab ${activeTab === "leetcode" ? "is-active" : ""}`}
            onClick={() => setActiveTab("leetcode")}
          >
            <img src="/leetcode_logo.jpeg" alt="" className="nav-tab-logo" />
            <span>LeetCode Deep-Dive</span>
          </button>
          <button
            type="button"
            className={`dashboard-nav-tab ${activeTab === "codechef" ? "is-active" : ""}`}
            onClick={() => setActiveTab("codechef")}
          >
            <img src="/codechef_logo.svg" alt="" className="nav-tab-logo" />
            <span>CodeChef Deep-Dive</span>
          </button>
          <button
            type="button"
            className={`dashboard-nav-tab ${activeTab === "hackerrank" ? "is-active" : ""}`}
            onClick={() => setActiveTab("hackerrank")}
          >
            <img src="/hackerrank_logo.jpeg" alt="" className="nav-tab-logo" />
            <span>HackerRank Deep-Dive</span>
          </button>
          <button
            type="button"
            className={`dashboard-nav-tab ${activeTab === "github" ? "is-active" : ""}`}
            onClick={() => setActiveTab("github")}
          >
            <img src="/github_logo.jpeg" alt="" className="nav-tab-logo" />
            <span>GitHub Repositories</span>
          </button>
          <button
            type="button"
            className={`dashboard-nav-tab ${activeTab === "branches" ? "is-active" : ""}`}
            onClick={() => setActiveTab("branches")}
          >
            <Layers size={15} />
            <span>Branch & Year Insights</span>
          </button>
        </div>
      </div>

      {/* 4. Tab Content: 4 Core Charts in 2x2 Grid (matching user's screenshot) or Deep Dive */}
      {activeTab === "overview" && (
        <div className="charts-2x2-grid">
          {/* Top Left: Overall Performance (100% Horizontal Stacked Bar) */}
          <OverallPerformanceChart data={overallDist} />

          {/* Top Right: HackerRank_Solved by Student_ID */}
          <HackerRankBarChart data={topHR} />

          {/* Bottom Left: Leet Code_Solved (Stacked Bars) */}
          <LeetCodeStackedBarChart data={topLC} />

          {/* Bottom Right: GitHub_Repositories by Student_ID */}
          <GitHubReposBarChart data={topGH} />
        </div>
      )}

      {/* LeetCode Dedicated View */}
      {activeTab === "leetcode" && (
        <PlatformDeepDive platform="leetcode" students={students} />
      )}

      {/* CodeChef Dedicated View */}
      {activeTab === "codechef" && (
        <PlatformDeepDive platform="codechef" students={students} />
      )}

      {/* HackerRank Dedicated View */}
      {activeTab === "hackerrank" && (
        <PlatformDeepDive platform="hackerrank" students={students} />
      )}

      {/* GitHub Dedicated View */}
      {activeTab === "github" && (
        <PlatformDeepDive platform="github" students={students} />
      )}

      {/* Branch & Year Intelligence Hub */}
      {activeTab === "branches" && (
        <BranchYearAnalytics
          branchData={branchData}
          yearData={yearData}
          sectionData={sectionData}
        />
      )}

      {/* 5. Comprehensive Sortable Rankings Table Card */}
      <section className="section-card leaderboard-table-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow"><Flame size={12} /> STUDENT CODING DOSSIER</span>
            <h2>
              Rankings & Performance Ledger{" "}
              <span className="count-pill">{students.length} students</span>
            </h2>
          </div>
          <div className="heading-actions">
            <span className="table-caption">
              Click any column header to sort instant ascending / descending
            </span>
          </div>
        </div>

        {/* Filters Bar: Branch, Section, Year, Search, Limit, Excel Export */}
        <FiltersBar
          filters={filters}
          onChange={onFilterChange}
          departments={departments}
          onExport={onExport}
          exporting={exporting}
        />

        {/* Sortable Table */}
        <InteractiveRankingsTable
          students={students}
          isAdmin={isAdmin}
          emptyMessage="No students match the selected filter criteria."
        />

        <div className="table-footer">
          <span>Displaying {students.length} students</span>
          <span className="table-footer__meta">
            Avg Score: {metrics.avgScore} pts · Total Campus Repos: {metrics.totalGitHubRepos}
          </span>
        </div>
      </section>
    </div>
  );
}
