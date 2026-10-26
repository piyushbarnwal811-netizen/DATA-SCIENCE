// Live student platform positions & analytics computation
// Empty fallback to ensure no dummy records are ever displayed
export const SAMPLE_STUDENTS = [];

// Branch-wise analytics from actual student data
export function getBranchBreakdown(students = []) {
  const branches = {};
  for (const s of students) {
    const b = s.branch || "General";
    if (!branches[b]) {
      branches[b] = {
        name: b,
        studentsCount: 0,
        totalScore: 0,
        totalLeetCode: 0,
        totalHackerRank: 0,
        totalCodeChef: 0
      };
    }
    branches[b].studentsCount += 1;
    branches[b].totalScore += Number(s.score) || 0;
    branches[b].totalLeetCode += Number(s.stats?.leetcode?.total) || 0;
    branches[b].totalHackerRank += Number(s.stats?.hackerrank?.solved) || 0;
    branches[b].totalCodeChef += Number(s.stats?.codechef?.problemsSolved) || 0;
  }

  return Object.values(branches).map((b) => ({
    ...b,
    avgScore: b.studentsCount ? Number((b.totalScore / b.studentsCount).toFixed(1)) : 0,
    avgLeetCode: b.studentsCount ? Number((b.totalLeetCode / b.studentsCount).toFixed(1)) : 0,
    avgHackerRank: b.studentsCount ? Number((b.totalHackerRank / b.studentsCount).toFixed(1)) : 0,
    avgCodeChef: b.studentsCount ? Number((b.totalCodeChef / b.studentsCount).toFixed(1)) : 0
  })).sort((a, b) => b.avgScore - a.avgScore);
}

// Year-wise analytics (1st, 2nd, 3rd, 4th year)
export function getYearBreakdown(students = []) {
  const years = { 1: [], 2: [], 3: [], 4: [] };
  for (const s of students) {
    const y = Number(s.year) || 1;
    if (years[y]) {
      years[y].push(s);
    }
  }

  return Object.entries(years).map(([year, list]) => {
    const count = list.length;
    const avgScore = count ? Number((list.reduce((acc, c) => acc + (c.score || 0), 0) / count).toFixed(1)) : 0;
    const topStudent = count ? [...list].sort((a, b) => (b.score || 0) - (a.score || 0))[0] : null;
    return {
      year: Number(year),
      count,
      avgScore,
      topStudent: topStudent ? { name: topStudent.name, score: topStudent.score, id: topStudent.studentId } : null
    };
  });
}

// Section-wise analytics
export function getSectionBreakdown(students = []) {
  const sections = {};
  for (const s of students) {
    const sec = s.section || "A";
    if (!sections[sec]) {
      sections[sec] = { name: sec, count: 0, totalScore: 0 };
    }
    sections[sec].count += 1;
    sections[sec].totalScore += Number(s.score) || 0;
  }

  return Object.values(sections).map((sec) => ({
    ...sec,
    avgScore: sec.count ? Number((sec.totalScore / sec.count).toFixed(1)) : 0
  })).sort((a, b) => a.name.localeCompare(b.name));
}

// Compute metrics KPIs from live student records
export function computeDashboardMetrics(students = []) {
  const count = students.length;
  if (!count) {
    return {
      totalStudents: 0,
      avgLeetCode: 0,
      avgCodeChefSolved: 0,
      avgCodeChefRating: 0,
      avgGeeksforGeeksSolved: 0,
      avgGeeksforGeeksScore: 0,
      avgHackerRank: 0,
      avgGitHub: 0,
      avgScore: 0
    };
  }

  const sum = (fn) => students.reduce((acc, s) => acc + (Number(fn(s)) || 0), 0);

  return {
    totalStudents: count,
    avgLeetCode: Number((sum((s) => s.stats?.leetcode?.total) / count).toFixed(1)),
    avgCodeChefSolved: Number((sum((s) => s.stats?.codechef?.problemsSolved) / count).toFixed(1)),
    avgCodeChefRating: Number((sum((s) => s.stats?.codechef?.rating) / count).toFixed(1)),
    avgGeeksforGeeksSolved: Number((sum((s) => s.stats?.geeksforgeeks?.problemsSolved) / count).toFixed(1)),
    avgGeeksforGeeksScore: Number((sum((s) => s.stats?.geeksforgeeks?.score) / count).toFixed(1)),
    avgHackerRank: Number((sum((s) => s.stats?.hackerrank?.solved) / count).toFixed(1)),
    avgGitHub: Number((sum((s) => s.stats?.github?.publicRepos) / count).toFixed(2)),
    avgScore: Number((sum((s) => s.score) / count).toFixed(1))
  };
}

// Compute live platform distribution for top students
export function getOverallDistribution(students = [], limit = 10) {
  if (!students || !students.length) return [];
  const top = [...students].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0)).slice(0, limit);

  return top.map((s) => {
    const hr = Number(s.stats?.hackerrank?.solved) || 0;
    const lc = Number(s.stats?.leetcode?.total) || 0;
    const cc = Number(s.stats?.codechef?.problemsSolved) || 0;
    const gh = Number(s.stats?.github?.publicRepos) || 0;
    const total = hr + lc + cc + gh || 1;

    return {
      id: String(s._id || s.studentId),
      studentId: s.studentId || "STU",
      name: s.name,
      hrRaw: hr,
      hrPct: Math.round((hr / total) * 100),
      lcRaw: lc,
      lcPct: Math.round((lc / total) * 100),
      ccRaw: cc,
      ccPct: Math.round((cc / total) * 100),
      ghRaw: gh,
      ghPct: Math.round((gh / total) * 100),
      totalSolved: hr + lc + cc
    };
  });
}

// Top solvers per platform
export function getTopHackerRankSolvers(students = [], limit = 5) {
  if (!students || !students.length) return [];
  return [...students]
    .sort((a, b) => (Number(b.stats?.hackerrank?.solved) || 0) - (Number(a.stats?.hackerrank?.solved) || 0))
    .slice(0, limit);
}

export function getTopLeetCodeSolvers(students = [], limit = 5) {
  if (!students || !students.length) return [];
  return [...students]
    .sort((a, b) => (Number(b.stats?.leetcode?.total) || 0) - (Number(a.stats?.leetcode?.total) || 0))
    .slice(0, limit);
}

export function getTopGitHubBuilders(students = [], limit = 5) {
  if (!students || !students.length) return [];
  return [...students]
    .sort((a, b) => (Number(b.stats?.github?.publicRepos) || 0) - (Number(a.stats?.github?.publicRepos) || 0))
    .slice(0, limit);
}

// Compute student's rank/position across every individual platform (LeetCode, CodeChef, HackerRank, GFG, GitHub, and Overall)
export function computeStudentPlatformPositions(student, allStudents = []) {
  if (!student) return null;
  const pool = allStudents && allStudents.length > 0 ? allStudents : [student];
  const targetId = student._id || student.studentId || student.email || student.name;
  const isTarget = (s) =>
    (s._id && s._id === targetId) ||
    (s.studentId && s.studentId === student.studentId) ||
    (s.email && s.email === student.email) ||
    s.name === student.name;

  let list = [...pool];
  if (!list.some(isTarget)) {
    list.push(student);
  }

  const total = list.length;
  const branchPool = list.filter((s) => s.branch === student.branch);
  const branchTotal = branchPool.length || 1;

  // 1. Overall campus score rank
  const overallSorted = [...list].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  const overallRank = Math.max(1, overallSorted.findIndex(isTarget) + 1);

  // 2. Branch rank
  const branchSorted = [...branchPool].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  const branchRank = Math.max(1, branchSorted.findIndex(isTarget) + 1);

  // 3. LeetCode rank
  const getLc = (s) =>
    s.stats?.leetcode?.total ??
    ((s.stats?.leetcode?.easy || 0) + (s.stats?.leetcode?.medium || 0) + (s.stats?.leetcode?.hard || 0));
  const lcSorted = [...list].sort((a, b) => {
    const diff = getLc(b) - getLc(a);
    if (diff !== 0) return diff;
    return (b.stats?.leetcode?.hard || 0) - (a.stats?.leetcode?.hard || 0);
  });
  const leetcodeRank = Math.max(1, lcSorted.findIndex(isTarget) + 1);

  // 4. CodeChef rank
  const ccSorted = [...list].sort((a, b) => {
    const rDiff = (b.stats?.codechef?.rating || 0) - (a.stats?.codechef?.rating || 0);
    if (rDiff !== 0) return rDiff;
    return (b.stats?.codechef?.problemsSolved || 0) - (a.stats?.codechef?.problemsSolved || 0);
  });
  const codechefRank = Math.max(1, ccSorted.findIndex(isTarget) + 1);

  // 5. HackerRank rank
  const hrSorted = [...list].sort((a, b) => {
    const sDiff = (b.stats?.hackerrank?.solved || 0) - (a.stats?.hackerrank?.solved || 0);
    if (sDiff !== 0) return sDiff;
    return (b.stats?.hackerrank?.points || 0) - (a.stats?.hackerrank?.points || 0);
  });
  const hackerrankRank = Math.max(1, hrSorted.findIndex(isTarget) + 1);

  // 6. GeeksforGeeks rank
  const gfgSorted = [...list].sort((a, b) => {
    const sDiff = (b.stats?.geeksforgeeks?.problemsSolved || 0) - (a.stats?.geeksforgeeks?.problemsSolved || 0);
    if (sDiff !== 0) return sDiff;
    return (b.stats?.geeksforgeeks?.score || 0) - (a.stats?.geeksforgeeks?.score || 0);
  });
  const geeksforgeeksRank = Math.max(1, gfgSorted.findIndex(isTarget) + 1);

  // 7. GitHub rank
  const ghSorted = [...list].sort((a, b) => {
    const rDiff = (b.stats?.github?.publicRepos || 0) - (a.stats?.github?.publicRepos || 0);
    if (rDiff !== 0) return rDiff;
    return (b.stats?.github?.followers || 0) - (a.stats?.github?.followers || 0);
  });
  const githubRank = Math.max(1, ghSorted.findIndex(isTarget) + 1);

  return {
    totalStudents: total,
    branchTotal,
    overall: overallRank,
    branch: branchRank,
    leetcode: leetcodeRank,
    codechef: codechefRank,
    hackerrank: hackerrankRank,
    geeksforgeeks: geeksforgeeksRank,
    github: githubRank
  };
}
