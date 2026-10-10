import { useState } from "react";

export default function LeetCodeStackedBarChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No LeetCode data available.</p>
      </div>
    );
  }

  // Find max total to scale the vertical bars accurately
  const maxTotal = Math.max(...data.map((d) => d.total), 50);
  const yMax = Math.ceil(maxTotal / 50) * 50 || 300;
  const yTicks = [yMax, Math.round(yMax * 0.66), Math.round(yMax * 0.33), 0];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">
          <img src="/leetcode_logo.jpeg" alt="LeetCode" className="chart-title-logo" />
          <span>Leet Code_Solved</span>
        </h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color legend-color--lc-medium" />
            <span>LeetCode_Medium</span>
          </span>
          <span className="legend-item">
            <span className="legend-color legend-color--lc-easy" />
            <span>LeetCode_Easy</span>
          </span>
          <span className="legend-item">
            <span className="legend-color legend-color--lc-hard" />
            <span>LeetCode_Hard</span>
          </span>
        </div>
      </div>

      <div className="chart-body chart-body--vertical">
        <div className="vchart-layout">
          {/* Y-axis labels */}
          <div className="vchart-yaxis">
            {yTicks.map((tick) => (
              <span key={tick} className="yaxis-tick">{tick}</span>
            ))}
          </div>

          {/* Stacked Bars area */}
          <div className="vchart-bars-area">
            {/* Guide lines */}
            <div className="vchart-gridlines">
              <div className="gridline" />
              <div className="gridline" />
              <div className="gridline" />
              <div className="gridline" />
            </div>

            {/* Bars container */}
            <div className="vchart-bars">
              {data.map((item, index) => {
                const totalPct = Math.min(100, Math.round((item.total / yMax) * 100));
                const sum = item.total || 1;
                const mediumPct = (item.medium / sum) * 100;
                const easyPct = (item.easy / sum) * 100;
                const hardPct = (item.hard / sum) * 100;
                const isHovered = hovered?.id === item.id;

                return (
                  <div
                    key={item.id || index}
                    className="vchart-bar-col"
                    onMouseEnter={() => setHovered(item)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="vbar-track">
                      <div
                        className={`vbar-stacked-wrap ${isHovered ? "is-hovered" : ""}`}
                        style={{ height: `${totalPct}%` }}
                      >
                        {/* Top: Hard */}
                        <div
                          className="vbar-stack-segment vbar-stack--hard"
                          style={{ height: `${hardPct}%` }}
                          title={`Hard: ${item.hard}`}
                        />
                        {/* Middle: Easy */}
                        <div
                          className="vbar-stack-segment vbar-stack--easy"
                          style={{ height: `${easyPct}%` }}
                          title={`Easy: ${item.easy}`}
                        />
                        {/* Bottom: Medium */}
                        <div
                          className="vbar-stack-segment vbar-stack--medium"
                          style={{ height: `${mediumPct}%` }}
                          title={`Medium: ${item.medium}`}
                        />
                        <span className="vbar-val vbar-val--top">{item.total}</span>
                      </div>
                    </div>
                    <span className="vbar-label" title={item.name}>
                      {item.studentId || item.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hovered && (
          <div className="chart-tooltip">
            <strong>{hovered.name}</strong>
            <span className="chart-tooltip-sub">{hovered.studentId} · {hovered.branch}</span>
            <div className="chart-tooltip-grid">
              <div className="tooltip-stat">
                <span className="legend-color legend-color--lc-medium" />
                <span>Medium: <b>{hovered.medium}</b></span>
              </div>
              <div className="tooltip-stat">
                <span className="legend-color legend-color--lc-easy" />
                <span>Easy: <b>{hovered.easy}</b></span>
              </div>
              <div className="tooltip-stat">
                <span className="legend-color legend-color--lc-hard" />
                <span>Hard: <b>{hovered.hard}</b></span>
              </div>
              <div className="tooltip-stat" style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 4, marginTop: 4 }}>
                <span>Total Solved: <b>{hovered.total}</b></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
