import { ArrowUpRight, Code2 } from "lucide-react";

const difficultyTone = (difficulty) => {
  switch (difficulty) {
    case "Easy": return "easy";
    case "Medium": return "medium";
    case "Hard": return "hard";
    default: return "unknown";
  }
};

export default function RecentSolvedProblems({ problems = [], emptyMessage = "No accepted LeetCode submissions found yet." }) {
  return (
    <section className="section-card solved-problems">
      <div className="section-heading">
        <div><span className="eyebrow">LATEST ACCEPTED SUBMISSIONS</span><h2>Solved problems</h2></div>
        <span className="table-caption">Most recent {problems.length}</span>
      </div>
      {problems.length ? (
        <div className="solved-problem-list">
          {problems.map((problem, index) => (
            <a
              className="solved-problem-row"
              href={`https://leetcode.com/problems/${encodeURIComponent(problem.titleSlug)}/`}
              target="_blank"
              rel="noreferrer"
              key={`${problem.titleSlug}-${problem.solvedAt}-${index}`}
            >
              <span className="solved-problem-icon"><Code2 size={16} /></span>
              <span className="solved-problem-name"><strong>{problem.title}</strong><small>{new Date(problem.solvedAt).toLocaleString()}</small></span>
              <span className={`difficulty-pill difficulty-pill--${difficultyTone(problem.difficulty)}`}>{problem.difficulty}</span>
              <ArrowUpRight className="solved-problem-open" size={14} />
            </a>
          ))}
        </div>
      ) : (
        <div className="empty-state empty-state--compact"><strong>No recent problems yet</strong><p>{emptyMessage}</p></div>
      )}
      <p className="solved-problem-note">LeetCode makes recent accepted submissions available publicly. The list is limited to the latest 50.</p>
    </section>
  );
}
