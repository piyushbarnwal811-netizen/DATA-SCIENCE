/**
 * CodeChef Service: profile link generator, username sanitization, and profile scraping.
 */

export function cleanCodeChefUsername(input) {
  if (!input) return "";
  let clean = String(input).trim();
  clean = clean.replace(/^https?:\/\/(www\.)?codechef\.com\/users\//i, "");
  clean = clean.replace(/^[@/]+/, "");
  clean = clean.split("?")[0].split("#")[0];
  clean = clean.split("/")[0].trim();
  return clean;
}

export function getCodeChefProfile(username) {
  const clean = cleanCodeChefUsername(username);
  if (!clean) return null;
  return `https://www.codechef.com/users/${encodeURIComponent(clean)}`;
}

export async function fetchCodeChefStats(rawUsername) {
  const username = cleanCodeChefUsername(rawUsername);
  if (!username) return null;

  try {
    const response = await fetch(`https://www.codechef.com/users/${encodeURIComponent(username)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (response.status === 404) {
      throw new Error(`CodeChef user "${username}" was not found.`);
    }
    if (!response.ok) {
      throw new Error(`CodeChef returned HTTP ${response.status}.`);
    }

    const html = await response.text();

    if (html.includes("User not found") || html.includes("could not be found") || html.includes("404 - Not Found")) {
      throw new Error(`CodeChef user "${username}" was not found.`);
    }

    // 1. Current Rating
    const ratingMatch = html.match(/class="rating-number"[^>]*>\s*(\d+)/i) ||
                        html.match(/rating-number">([0-9]+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;

    // 2. Stars
    const starsDiv = html.match(/class="rating-star"[^>]*>([\s\S]*?)<\/div>/i);
    let stars = "1★";
    if (starsDiv) {
      const starCount = (starsDiv[1].match(/&#9733;|★/g) || []).length;
      if (starCount > 0) stars = `${starCount}★`;
    }

    // 3. Division
    const divMatch = html.match(/\(Div\s*(\d+)\)/i);
    const division = divMatch ? `Div ${divMatch[1]}` : "";

    // 4. Highest Rating
    const highestMatch = html.match(/Highest Rating\s*<small>\((\d+)\)<\/small>/i) ||
                         html.match(/Highest Rating[^<]*\((\d+)\)/i);
    const highestRating = highestMatch ? parseInt(highestMatch[1], 10) : rating;

    // 5. Problems Solved
    const solvedMatch = html.match(/Total Problems Solved:\s*(\d+)/i) ||
                        html.match(/Fully Solved\s*\(([0-9,]+)\)/i) ||
                        html.match(/<h3>Total Problems Solved:\s*(\d+)<\/h3>/i);
    const problemsSolved = solvedMatch ? parseInt(solvedMatch[1].replace(/,/g, ""), 10) : 0;

    // 6. Global Rank
    const globalMatch = html.match(/<a[^>]*href="\/ratings\/all"[^>]*>\s*<strong>\s*(\d+)\s*<\/strong>/i);
    const globalRank = globalMatch ? parseInt(globalMatch[1], 10) : 0;

    // 7. Country Rank
    const countryMatch = html.match(/<a[^>]*href="\/ratings\/all\?filterBy=Country[^"]*"[^>]*>\s*<strong>\s*(\d+)\s*<\/strong>/i);
    const countryRank = countryMatch ? parseInt(countryMatch[1], 10) : 0;

    return {
      rating,
      stars,
      division,
      highestRating,
      problemsSolved,
      globalRank,
      countryRank
    };
  } catch (error) {
    if (error.message.includes("was not found")) throw error;
    console.warn(`[CodeChef] Could not scrape stats for ${username}: ${error.message}`);
    return {
      rating: 0,
      stars: "1★",
      division: "",
      highestRating: 0,
      problemsSolved: 0,
      globalRank: 0,
      countryRank: 0
    };
  }
}
