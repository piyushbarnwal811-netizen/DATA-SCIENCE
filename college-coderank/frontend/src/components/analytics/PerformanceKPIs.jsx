import { GraduationCap, Code } from "lucide-react";

export default function PerformanceKPIs({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="kpi-grid">
      {/* 1. TOTAL STUDENTS */}
      <div className="kpi-card kpi-card--students">
        <div className="kpi-card__top">
          <span className="kpi-card__icon kpi-card__icon--blue">
            <GraduationCap size={22} strokeWidth={2} />
          </span>
          <span className="kpi-card__trend">Campus Active</span>
        </div>
        <div className="kpi-card__content">
          <div className="kpi-card__value">
            {metrics.totalStudents.toFixed(1)}
          </div>
          <div className="kpi-card__label">TOTAL STUDENTS</div>
        </div>
      </div>

      {/* 2. AVG LeetCode Solved */}
      <div className="kpi-card kpi-card--leetcode">
        <div className="kpi-card__top">
          <span className="kpi-card__icon kpi-card__icon--img">
            <img src="/leetcode_logo.jpeg" alt="LeetCode" className="kpi-logo-img" />
          </span>
          <span className="kpi-card__sublabel">E/M/H Solved</span>
        </div>
        <div className="kpi-card__content">
          <div className="kpi-card__value">
            {metrics.avgLeetCode.toFixed(1)}
          </div>
          <div className="kpi-card__label kpi-card__label--lc">
            AVG LeetCode Solved
          </div>
        </div>
      </div>

      {/* 3. AVG CodeChef Rating & Solved */}
      <div className="kpi-card kpi-card--codechef">
        <div className="kpi-card__top">
          <span className="kpi-card__icon kpi-card__icon--img">
            <img src="/codechef_logo.svg" alt="CodeChef" className="kpi-logo-img" />
          </span>
          <span className="kpi-card__sublabel">{metrics.avgCodeChefSolved ? `${metrics.avgCodeChefSolved} Solved` : "Rating & Div"}</span>
        </div>
        <div className="kpi-card__content">
          <div className="kpi-card__value">
            {metrics.avgCodeChefRating > 0 ? metrics.avgCodeChefRating : (metrics.avgCodeChefSolved || 0)}
          </div>
          <div className="kpi-card__label kpi-card__label--cc">
            {metrics.avgCodeChefRating > 0 ? "AVG CodeChef Rating" : "AVG CodeChef Solved"}
          </div>
        </div>
      </div>

      {/* 4. AVG GeeksforGeeks Solved & Score */}
      <div className="kpi-card kpi-card--geeksforgeeks">
        <div className="kpi-card__top">
          <span className="kpi-card__icon kpi-card__icon--img">
            <img src="/gfg_logo.svg" alt="GeeksforGeeks" className="kpi-logo-img" />
          </span>
          <span className="kpi-card__sublabel">{metrics.avgGeeksforGeeksScore ? `${metrics.avgGeeksforGeeksScore} Score` : "Practice"}</span>
        </div>
        <div className="kpi-card__content">
          <div className="kpi-card__value">
            {(metrics.avgGeeksforGeeksSolved || 0).toFixed(1)}
          </div>
          <div className="kpi-card__label kpi-card__label--gfg">
            AVG GeeksforGeeks Solved
          </div>
        </div>
      </div>

      {/* 4. AVG HackerRank Solved */}
      <div className="kpi-card kpi-card--hackerrank">
        <div className="kpi-card__top">
          <span className="kpi-card__icon kpi-card__icon--img">
            <img src="/hackerrank_logo.jpeg" alt="HackerRank" className="kpi-logo-img" />
          </span>
          <span className="kpi-card__sublabel">Practice Solved</span>
        </div>
        <div className="kpi-card__content">
          <div className="kpi-card__value">
            {metrics.avgHackerRank.toFixed(1)}
          </div>
          <div className="kpi-card__label kpi-card__label--hr">
            AVG HackerRank Solved
          </div>
        </div>
      </div>

      {/* 4. AVG GitHub Repositories */}
      <div className="kpi-card kpi-card--github">
        <div className="kpi-card__top">
          <span className="kpi-card__icon kpi-card__icon--img">
            <img src="/github_logo.jpeg" alt="GitHub" className="kpi-logo-img" />
          </span>
          <span className="kpi-card__sublabel">Public Repos</span>
        </div>
        <div className="kpi-card__content">
          <div className="kpi-card__value">
            {metrics.avgGitHub.toFixed(2)}
          </div>
          <div className="kpi-card__label kpi-card__label--gh">
            AVG GitHub Repositories
          </div>
        </div>
      </div>

      {/* 5. AVG Overall Performance Score */}
      <div className="kpi-card kpi-card--overall">
        <div className="kpi-card__top">
          <span className="kpi-card__icon kpi-card__icon--red">
            <Code size={22} strokeWidth={2.2} />
          </span>
          <span className="kpi-card__trend kpi-card__trend--red">Composite</span>
        </div>
        <div className="kpi-card__content">
          <div className="kpi-card__value">
            {metrics.avgScore.toFixed(1)}
          </div>
          <div className="kpi-card__label kpi-card__label--score">
            AVG Overall Performance Score
          </div>
        </div>
      </div>
    </div>
  );
}
