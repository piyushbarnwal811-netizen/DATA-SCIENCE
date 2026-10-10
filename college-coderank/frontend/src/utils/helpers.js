export function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

export function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CC";
}

export function getScore(stats = {}) {
  const codechefSolved = Number(stats?.codechef?.problemsSolved ?? 0);
  const codechefRating = Number(stats?.codechef?.rating ?? 0);
  const codechefScore = codechefSolved * 2 + (codechefRating > 1000 ? Math.floor((codechefRating - 1000) / 50) : 0);

  return (
    (stats.leetcode?.easy ?? 0) +
    (stats.leetcode?.medium ?? 0) * 3 +
    (stats.leetcode?.hard ?? 0) * 5 +
    (stats.github?.publicRepos ?? 0) * 2 +
    Math.floor((stats.hackerrank?.points ?? 0) / 10) +
    codechefScore
  );
}

export function displayYear(year) {
  const suffix = ["th", "st", "nd", "rd"];
  const value = Number(year) || 0;
  return `${value}${suffix[(value % 100 > 10 && value % 100 < 14) ? 0 : value % 10] ?? "th"} year`;
}