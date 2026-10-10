export function calculateScore(stats) {
  const easy = Number(stats?.leetcode?.easy ?? 0);
  const medium = Number(stats?.leetcode?.medium ?? 0);
  const hard = Number(stats?.leetcode?.hard ?? 0);
  const repositories = Number(stats?.github?.publicRepos ?? 0);
  const hackerrankPoints = Number(stats?.hackerrank?.points ?? 0);
  const codechefSolved = Number(stats?.codechef?.problemsSolved ?? 0);
  const codechefRating = Number(stats?.codechef?.rating ?? 0);

  // CodeChef contribution: 2 pts per problem solved + rating tier bonus
  const codechefScore = codechefSolved * 2 + (codechefRating > 1000 ? Math.floor((codechefRating - 1000) / 50) : 0);

  return (
    easy +
    medium * 3 +
    hard * 5 +
    repositories * 2 +
    Math.floor(hackerrankPoints / 10) +
    codechefScore
  );
}