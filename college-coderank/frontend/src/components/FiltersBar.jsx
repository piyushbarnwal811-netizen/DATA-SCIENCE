"use client";

import { FileSpreadsheet, RotateCcw, Search } from "lucide-react";

export default function FiltersBar({
  filters,
  onChange,
  departments = [],
  onExport,
  exporting = false
}) {
  const sections = departments.find((department) => department.name === filters.branch)?.sections ?? [];
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const quickLimits = [20, 50, 100];

  return (
    <div className="filters-bar-container">
      <div className="filters-bar">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search students or roll number"
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            aria-label="Search students"
          />
        </label>
        <label className="filter-select">
          <span className="sr-only">Branch</span>
          <select
            value={filters.branch}
            onChange={(event) => {
              onChange({ ...filters, branch: event.target.value, section: "" });
            }}
          >
            <option value="">All branches</option>
            {departments.map((department) => (
              <option key={department._id} value={department.name}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span className="sr-only">Section</span>
          <select value={filters.section} onChange={(event) => update("section", event.target.value)}>
            <option value="">All sections</option>
            {sections.map((section) => (
              <option key={section}>{section}</option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span className="sr-only">Year</span>
          <select value={filters.year} onChange={(event) => update("year", event.target.value)}>
            <option value="">All years</option>
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>
                {year} year
              </option>
            ))}
          </select>
        </label>

        {/* Custom Limit / Top N Input */}
        <label className="limit-field" title="Enter how many top students to display (e.g. 20, 100)">
          <span className="limit-prefix">Top</span>
          <input
            type="number"
            min="1"
            max="5000"
            placeholder="500"
            value={filters.limit ?? ""}
            onChange={(event) => update("limit", event.target.value ? Math.max(1, parseInt(event.target.value, 10)) : "")}
            aria-label="Number of students to show"
          />
        </label>

        <button
          className="icon-button filter-reset"
          onClick={() => onChange({ search: "", branch: "", section: "", year: "", limit: "" })}
          aria-label="Clear filters"
          title="Reset all filters"
        >
          <RotateCcw size={16} />
        </button>

        {onExport && (
          <button
            type="button"
            className="button button--excel"
            onClick={onExport}
            disabled={exporting}
            title="Download leaderboard as Excel spreadsheet (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            <span>{exporting ? "Exporting..." : "Excel (.xlsx)"}</span>
          </button>
        )}
      </div>

      {/* Quick limit pills for instant selection */}
      <div className="limit-chips">
        <span className="limit-chips__label">Show top:</span>
        {quickLimits.map((count) => {
          const isActive = Number(filters.limit) === count;
          return (
            <button
              key={count}
              type="button"
              className={`limit-chip ${isActive ? "is-active" : ""}`}
              onClick={() => update("limit", isActive ? "" : count)}
            >
              Top {count}
            </button>
          );
        })}
        <button
          type="button"
          className={`limit-chip ${!filters.limit ? "is-active" : ""}`}
          onClick={() => update("limit", "")}
        >
          All
        </button>
      </div>
    </div>
  );
}