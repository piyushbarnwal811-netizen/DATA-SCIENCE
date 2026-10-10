const endpoint = "https://leetcode.com/graphql";

export function cleanLeetCodeUsername(input) {
  if (!input) return "";
  let clean = String(input).trim();
  clean = clean.replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, "");
  clean = clean.replace(/^[@/]+/, "");
  clean = clean.split("?")[0].split("#")[0];
  clean = clean.split("/")[0].trim();
  return clean;
}

export async function fetchLeetCodeStats(rawUsername) {
  const username = cleanLeetCodeUsername(rawUsername);
  if (!username) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "CollegeCodeRank/1.0" },
    body: JSON.stringify({
      query: `query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStats { acSubmissionNum { difficulty count } }
        }
      }`,
      variables: { username }
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) throw new Error(`LeetCode returned HTTP ${response.status}.`);
  const payload = await response.json();
  const matchedUser = payload?.data?.matchedUser;
  if (!matchedUser) throw new Error(`LeetCode user "${username}" was not found.`);

  const counts = matchedUser.submitStats.acSubmissionNum;
  const countFor = (difficulty) =>
    Number(counts.find((entry) => entry.difficulty === difficulty)?.count ?? 0);

  return {
    easy: countFor("Easy"),
    medium: countFor("Medium"),
    hard: countFor("Hard"),
    total: countFor("All")
  };
}

export async function fetchLeetCodeProfile(rawUsername, { recentLimit = 50 } = {}) {
  const username = cleanLeetCodeUsername(rawUsername);
  if (!username) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "CollegeCodeRank/1.0" },
    body: JSON.stringify({
      query: `query userCodingProfile($username: String!, $limit: Int!) {
        matchedUser(username: $username) {
          submitStats { acSubmissionNum { difficulty count } }
        }
        recentAcSubmissionList(username: $username, limit: $limit) {
          title
          titleSlug
          timestamp
        }
      }`,
      variables: { username, limit: recentLimit }
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) throw new Error(`LeetCode returned HTTP ${response.status}.`);
  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(`LeetCode could not load this profile: ${payload.errors[0].message}`);
  }
  const matchedUser = payload?.data?.matchedUser;
  if (!matchedUser) throw new Error(`LeetCode user "${username}" was not found.`);

  const counts = matchedUser.submitStats.acSubmissionNum;
  const countFor = (difficulty) =>
    Number(counts.find((entry) => entry.difficulty === difficulty)?.count ?? 0);
  const submissions = [];
  const seenSlugs = new Set();
  for (const submission of payload.data.recentAcSubmissionList ?? []) {
    if (!submission.titleSlug || seenSlugs.has(submission.titleSlug)) continue;
    seenSlugs.add(submission.titleSlug);
    submissions.push(submission);
  }
  const slugs = [...new Set(submissions.map((submission) => submission.titleSlug).filter(Boolean))];
  let difficultyBySlug = new Map();

  if (slugs.length) {
    const questionFields = slugs
      .map((slug, index) => `problem${index}: question(titleSlug: ${JSON.stringify(slug)}) { difficulty }`)
      .join("\n");
    const detailResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "CollegeCodeRank/1.0" },
      body: JSON.stringify({ query: `query recentProblemDifficulties { ${questionFields} }` }),
      signal: AbortSignal.timeout(15000)
    });
    if (!detailResponse.ok) {
      throw new Error(`LeetCode returned HTTP ${detailResponse.status} for problem details.`);
    }
    const details = await detailResponse.json();
    if (details.errors?.length) {
      throw new Error(`LeetCode could not load problem details: ${details.errors[0].message}`);
    }
    difficultyBySlug = new Map(
      slugs.map((slug, index) => [slug, details.data?.[`problem${index}`]?.difficulty ?? "Unknown"])
    );
  }

  return {
    leetcode: {
      easy: countFor("Easy"),
      medium: countFor("Medium"),
      hard: countFor("Hard"),
      total: countFor("All")
    },
    recentAccepted: submissions.map((submission) => ({
      title: submission.title,
      titleSlug: submission.titleSlug,
      difficulty: difficultyBySlug.get(submission.titleSlug) ?? "Unknown",
      solvedAt: new Date(Number(submission.timestamp) * 1000)
    }))
  };
}