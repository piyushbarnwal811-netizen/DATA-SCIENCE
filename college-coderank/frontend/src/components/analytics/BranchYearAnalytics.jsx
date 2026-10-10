import { Award, BookOpen, Layers, Users, Zap } from "lucide-react";

export default function BranchYearAnalytics({ branchData = [], yearData = [], sectionData = [] }) {
  const maxBranchScore = Math.max(...branchData.map((b) => b.avgScore), 100);

  return (
    <div className="dept-analytics-container">
      {/* 1. Branch-wise Comparison */}
      <section className="analytics-card">
        <div className="analytics-card__head">
          <div className="analytics-title-group">
            <span className="analytics-pill"><Layers size={13} /> Branch Intelligence</span>
            <h3>Department / Branch-wise Coding Benchmark</h3>
            <p>Comparative average performance and student density across engineering streams</p>
          </div>
        </div>

        <div className="branch-bars-list">
          {branchData.map((dept, index) => {
            const widthPct = Math.min(100, Math.round((dept.avgScore / maxBranchScore) * 100));
            const isLeader = index === 0;

            return (
              <div key={dept.name} className="branch-bar-row">
                <div className="branch-bar-meta">
                  <div className="branch-bar-title">
                    <strong>{dept.name}</strong>
                    {isLeader && <span className="branch-leader-badge"><Award size={11} /> Highest Avg</span>}
                  </div>
                  <div className="branch-bar-stats">
                    <span>{dept.studentsCount} students</span>
                    <span>·</span>
                    <span>Avg LC: {dept.avgLeetCode}</span>
                    <span>·</span>
                    <span>Avg CC: {dept.avgCodeChef || 0}</span>
                    <span>·</span>
                    <strong className="branch-score-val">{dept.avgScore} <small>pts</small></strong>
                  </div>
                </div>

                <div className="branch-progress-track">
                  <div
                    className={`branch-progress-fill ${isLeader ? "branch-progress-fill--gold" : ""}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Year-wise and Section-wise Grid */}
      <div className="dept-subgrid">
        {/* Year-wise Breakdown */}
        <section className="analytics-card">
          <div className="analytics-card__head">
            <div className="analytics-title-group">
              <span className="analytics-pill"><BookOpen size={13} /> Academic Cohorts</span>
              <h3>Year-wise Performance</h3>
            </div>
          </div>

          <div className="year-cards-grid">
            {yearData.map((item) => {
              const yearSuffix = item.year === 1 ? "1st" : item.year === 2 ? "2nd" : item.year === 3 ? "3rd" : `${item.year}th`;
              return (
                <div key={item.year} className="year-mini-card">
                  <div className="year-mini-header">
                    <span className="year-pill">{yearSuffix} Year</span>
                    <span className="year-count">{item.count} students</span>
                  </div>
                  <div className="year-score">
                    <strong>{item.avgScore}</strong>
                    <small>avg score</small>
                  </div>
                  {item.topStudent && (
                    <div className="year-top-scorer">
                      <Zap size={11} className="year-top-icon" />
                      <span>Lead: <b>{item.topStudent.name?.split(" ")[0]}</b> ({item.topStudent.score} pts)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section-wise Breakdown */}
        <section className="analytics-card">
          <div className="analytics-card__head">
            <div className="analytics-title-group">
              <span className="analytics-pill"><Users size={13} /> Classroom Sections</span>
              <h3>Section-wise Comparison</h3>
            </div>
          </div>

          <div className="section-cards-grid">
            {sectionData.map((sec) => (
              <div key={sec.name} className="sec-mini-card">
                <div className="sec-name-badge">Section {sec.name}</div>
                <div className="sec-metrics">
                  <div>
                    <strong>{sec.count}</strong>
                    <small>Students</small>
                  </div>
                  <div className="sec-divider" />
                  <div>
                    <strong className="sec-avg-val">{sec.avgScore}</strong>
                    <small>Avg Pts</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
