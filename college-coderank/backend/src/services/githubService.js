/**
 * Clean & sanitize GitHub usernames from full URLs, leading @, or slashes.
 */
export function cleanGitHubUsername(input) {
  if (!input) return "";
  let clean = String(input).trim();
  clean = clean.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  clean = clean.replace(/^[@/]+/, "");
  clean = clean.split("?")[0].split("#")[0];
  clean = clean.split("/")[0].trim();
  return clean;
}

/**
 * Scrape GitHub user profile HTML directly.
 * Completely immune to API rate limits (60 req/hr).
 */
async function scrapeGitHubProfileHtml(username) {
  const response = await fetch(`https://github.com/${encodeURIComponent(username)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    signal: AbortSignal.timeout(10000)
  });

  if (response.status === 404) {
    throw new Error(`GitHub user "${username}" was not found.`);
  }
  if (!response.ok) {
    throw new Error(`GitHub returned HTTP ${response.status}.`);
  }

  const html = await response.text();

  // Regexes to extract repositories count
  const repoRegexes = [
    /tab=repositories[^>]*>[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*title="([0-9,]+)"/i,
    /tab=repositories[^>]*>[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /data-tab-item="repositories"[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /itemprop="owns"[^>]*>[\s\S]*?Repositories[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /([0-9,]+)\s+repositories/i
  ];

  let publicRepos = 0;
  for (const rx of repoRegexes) {
    const match = html.match(rx);
    if (match) {
      publicRepos = parseInt(match[1].replace(/,/g, ""), 10);
      break;
    }
  }

  // Regexes to extract followers count
  const followerRegexes = [
    /href="[^"]*tab=followers"[^>]*>[\s\S]*?<span[^>]*class="[^"]*text-bold[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /([0-9,]+)\s+followers/i
  ];

  let followers = 0;
  for (const rx of followerRegexes) {
    const match = html.match(rx);
    if (match) {
      followers = parseInt(match[1].replace(/,/g, ""), 10);
      break;
    }
  }

  return { publicRepos, followers };
}

/**
 * Fetch GitHub stats (public repos and followers).
 * Tries the official REST API first, falling back to the HTML scraper if rate-limited.
 */
export async function fetchGitHubStats(rawUsername) {
  const username = cleanGitHubUsername(rawUsername);
  if (!username) return null;

  // 1. Try official REST API
  try {
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "CollegeCodeRank/2.0" };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      signal: AbortSignal.timeout(8000)
    });

    if (response.ok) {
      const profile = await response.json();
      return {
        publicRepos: Number(profile.public_repos ?? 0),
        followers: Number(profile.followers ?? 0)
      };
    }

    if (response.status === 404) {
      throw new Error(`GitHub user "${username}" was not found.`);
    }

    // If rate-limited (HTTP 403 / 429) or transient error, continue to scraper
  } catch (err) {
    if (err.message.includes("was not found")) {
      throw err;
    }
    // Rate limit or network hiccup, fallback to web scraper below
  }

  // 2. Reliable HTML fallback
  return await scrapeGitHubProfileHtml(username);
}