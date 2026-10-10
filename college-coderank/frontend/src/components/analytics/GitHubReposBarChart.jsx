import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export default function GitHubReposBarChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No GitHub repository data available.</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 20);
  const yMax = Math.ceil(maxVal / 25) * 25 || 100;
  const yTicks = [yMax, Math.round(yMax * 0.5), 0];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">
          <img src="/github_logo.jpeg" alt="GitHub" className="chart-title-logo" />
          <span>GitHub_Repositories by Student_ID</span>
        </h3>
        <div className="chart-legend">
          <span className="legend-item">
            <img src="/github_logo.jpeg" alt="" className="legend-mini-logo" />
            <span>GitHub_Repositories</span>
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

          {/* Bars grid */}
          <div className="vchart-bars-area">
            {/* Guide lines */}
            <div className="vchart-gridlines">
              <div className="gridline" />
              <div className="gridline" />
              <div className="gridline" />
            </div>

            {/* Bars container */}
            <div className="vchart-bars">
              {data.map((item, index) => {
                const heightPct = Math.min(100, Math.round((item.value / yMax) * 100));
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
                        className={`vbar-fill vbar-fill--green ${isHovered ? "is-hovered" : ""}`}
                        style={{ height: `${heightPct}%` }}
                      >
                        <span className="vbar-val">{item.value}</span>
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
            <div className="tooltip-stat">
              <span className="legend-color legend-color--green" />
              <span>Public Repositories: <b>{hovered.value}</b> repos</span>
            </div>
            {hovered.username && (
              <div className="tooltip-link">
                <span>@{hovered.username}</span>
                <ArrowUpRight size={11} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
