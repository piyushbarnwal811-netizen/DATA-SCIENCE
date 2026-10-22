"use client";

import { useState } from "react";

export default function OverallPerformanceChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No student data available for overall distribution.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Overall Performance</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color legend-color--purple" />
            <span>HackerRank_Solved</span>
          </span>
          <span className="legend-item">
            <span className="legend-color legend-color--blue" />
            <span>LeetCode_Solved</span>
          </span>
          <span className="legend-item">
            <span className="legend-color legend-color--brown" />
            <span>CodeChef_Solved</span>
          </span>
          <span className="legend-item">
            <span className="legend-color legend-color--green" />
            <span>GitHub_Repositories</span>
          </span>
        </div>
      </div>

      <div className="chart-body chart-body--horizontal">
        <div className="chart-horizontal-bars">
          {data.map((item, index) => {
            const isHovered = hovered?.id === item.id;
            return (
              <div
                key={item.id || index}
                className={`hbar-row ${isHovered ? "is-hovered" : ""}`}
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="hbar-label" title={item.name}>
                  <strong>{item.studentId || item.id}</strong>
                  <span className="hbar-label-sub">{item.name?.split(" ")[0]}</span>
                </div>

                <div className="hbar-track">
                  {/* HackerRank slice */}
                  <div
                    className="hbar-slice hbar-slice--purple"
                    style={{ width: `${item.hrPct}%` }}
                    title={`HackerRank: ${item.hrRaw} solved (${item.hrPct}%)`}
                  >
                    {item.hrPct >= 12 && <span>{item.hrPct}%</span>}
                  </div>

                  {/* LeetCode slice */}
                  <div
                    className="hbar-slice hbar-slice--blue"
                    style={{ width: `${item.lcPct}%` }}
                    title={`LeetCode: ${item.lcRaw} solved (${item.lcPct}%)`}
                  >
                    {item.lcPct >= 12 && <span>{item.lcPct}%</span>}
                  </div>

                  {/* CodeChef slice */}
                  <div
                    className="hbar-slice hbar-slice--brown"
                    style={{ width: `${item.ccPct || 0}%` }}
                    title={`CodeChef: ${item.ccRaw || 0} solved (${item.ccPct || 0}%)`}
                  >
                    {(item.ccPct || 0) >= 10 && <span>{item.ccPct}%</span>}
                  </div>

                  {/* GitHub slice */}
                  <div
                    className="hbar-slice hbar-slice--green"
                    style={{ width: `${item.ghPct}%` }}
                    title={`GitHub: ${item.ghRaw} repos (${item.ghPct}%)`}
                  >
                    {item.ghPct >= 8 && <span>{item.ghPct}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis with percentage markers */}
        <div className="chart-xaxis">
          <div className="chart-xaxis-ticks">
            <span>0%</span>
            <span>20%</span>
            <span>40%</span>
            <span>60%</span>
            <span>80%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Floating tooltip */}
        {hovered && (
          <div className="chart-tooltip">
            <strong>{hovered.name} ({hovered.studentId})</strong>
            <span className="chart-tooltip-dept">{hovered.branch}</span>
            <div className="chart-tooltip-grid">
              <div className="tooltip-stat">
                <span className="legend-color legend-color--purple" />
                <span>HackerRank: <b>{hovered.hrRaw}</b> ({hovered.hrPct}%)</span>
              </div>
              <div className="tooltip-stat">
                <span className="legend-color legend-color--blue" />
                <span>LeetCode: <b>{hovered.lcRaw}</b> ({hovered.lcPct}%)</span>
              </div>
              <div className="tooltip-stat">
                <span className="legend-color legend-color--brown" />
                <span>CodeChef: <b>{hovered.ccRaw || 0}</b> ({hovered.ccPct || 0}%)</span>
              </div>
              <div className="tooltip-stat">
                <span className="legend-color legend-color--green" />
                <span>GitHub Repos: <b>{hovered.ghRaw}</b> ({hovered.ghPct}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
