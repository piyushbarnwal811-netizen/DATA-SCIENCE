/**
 * GeeksforGeeks Service: profile URL generation, username sanitization, and profile stats extraction.
 */

export function cleanGeeksforGeeksUsername(input) {
  if (!input) return "";
  let clean = String(input).trim();
  clean = clean.replace(/^https?:\/\/(www\.|auth\.)?geeksforgeeks\.org\/(user|profile)\//i, "");
  clean = clean.replace(/^[@/]+/, "");
  clean = clean.split("?")[0].split("#")[0];
  clean = clean.split("/")[0].trim();
  return clean;
}

export function getGeeksforGeeksProfile(username) {
  const clean = cleanGeeksforGeeksUsername(username);
  if (!clean) return null;
  return `https://www.geeksforgeeks.org/user/${encodeURIComponent(clean)}/`;
}

export async function fetchGeeksforGeeksStats(rawUsername) {
  const username = cleanGeeksforGeeksUsername(rawUsername);
  if (!username) return null;

  try {
    // 1. Fetch the user profile page from geeksforgeeks.org
    const response = await fetch(`https://www.geeksforgeeks.org/profile/${encodeURIComponent(username)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (response.status === 404) {
      throw new Error(`GeeksforGeeks user "${username}" was not found.`);
    }

    if (!response.ok) {
      throw new Error(`GeeksforGeeks returned HTTP ${response.status}.`);
    }

    const html = await response.text();

    if (
      html.includes("User not found") ||
      html.includes("User does not exist") ||
      html.includes("404 - Not Found") ||
      html.includes("NEXT_REDIRECT;replace;/connect/explore")
    ) {
      throw new Error(`GeeksforGeeks user "${username}" was not found.`);
    }

    // Helper regex extractor supporting raw JSON and escaped strings in RSC stream
    const extractNumber = (pattern) => {
      const match = html.match(pattern);
      if (!match) return 0;
      const num = parseInt(match[1], 10);
      return Number.isNaN(num) ? 0 : num;
    };

    const extractString = (pattern) => {
      const match = html.match(pattern);
      return match ? String(match[1]).trim() : "";
    };

    // 1. Total Problems Solved
    const problemsSolved =
      extractNumber(/"total_problems_solved":\s*(\d+)/i) ||
      extractNumber(/\\"total_problems_solved\\":\s*(\d+)/i) ||
      extractNumber(/class="[^\"]*solved_problems_count[^\"]*"[^>]*>([0-9,]+)/i);

    // 2. Coding Score
    const score =
      extractNumber(/"score":\s*(\d+)/i) ||
      extractNumber(/\\"score\\":\s*(\d+)/i) ||
      extractNumber(/class="[^\"]*score_card_value[^\"]*"[^>]*>([0-9,]+)/i);

    // 3. Monthly Score
    const monthlyScore =
      extractNumber(/"monthly_score":\s*(\d+)/i) ||
      extractNumber(/\\"monthly_score\\":\s*(\d+)/i);

    // 4. Institute Rank
    const instituteRank =
      extractString(/"institute_rank":\s*"?([^",\\]*)"?/i) ||
      extractString(/\\"institute_rank\\":\s*\\"?([^",\\]*)\\"?/i);

    return {
      score,
      problemsSolved,
      monthlyScore,
      instituteRank
    };
  } catch (error) {
    if (error.message.includes("was not found")) throw error;
    console.warn(`[GeeksforGeeks] Could not fetch stats for ${username}: ${error.message}`);
    return {
      score: 0,
      problemsSolved: 0,
      monthlyScore: 0,
      instituteRank: ""
    };
  }
}
