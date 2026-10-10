export function cleanHackerRankUsername(input) {
  if (!input) return "";
  let clean = String(input).trim();
  clean = clean.replace(/^https?:\/\/(www\.)?hackerrank\.com\/(profile\/)?/i, "");
  clean = clean.replace(/^[@/]+/, "");
  clean = clean.split("?")[0].split("#")[0];
  clean = clean.split("/")[0].trim();
  return clean;
}

export function getHackerRankProfile(username) {
  const clean = cleanHackerRankUsername(username);
  if (!clean) return null;
  return `https://www.hackerrank.com/profile/${encodeURIComponent(clean)}`;
}

export async function fetchHackerRankStats(rawUsername) {
  const username = cleanHackerRankUsername(rawUsername);
  if (!username) return null;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CollegeCodeRank/1.0",
    "Accept": "application/json"
  };

  try {
    const [scoresRes, badgesRes] = await Promise.allSettled([
      fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/scores_elo`, {
        headers,
        signal: AbortSignal.timeout(10000)
      }),
      fetch(`https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/badges`, {
        headers,
        signal: AbortSignal.timeout(10000)
      })
    ]);

    let points = 0;
    let solved = 0;
    let badgesCount = 0;

    if (scoresRes.status === "fulfilled" && scoresRes.value.ok) {
      const scoresData = await scoresRes.value.json();
      if (Array.isArray(scoresData)) {
        points = scoresData.reduce((total, track) => total + (Number(track.practice?.score) || 0), 0);
      }
    }

    if (badgesRes.status === "fulfilled" && badgesRes.value.ok) {
      const badgesData = await badgesRes.value.json();
      if (Array.isArray(badgesData?.models)) {
        badgesCount = badgesData.models.length;
        solved = badgesData.models.reduce((total, badge) => total + (Number(badge.solved) || 0), 0);
        // If scores_elo didn't give points or gave 0, badges also include points
        if (points === 0) {
          points = badgesData.models.reduce((total, badge) => total + (Number(badge.current_points) || 0), 0);
        }
      }
    }

    return {
      points: Math.max(0, points),
      solved: Math.max(0, solved),
      badges: Math.max(0, badgesCount)
    };
  } catch (error) {
    console.warn(`Could not fetch HackerRank stats for ${username}: ${error.message}`);
    return { points: 0, solved: 0, badges: 0 };
  }
}