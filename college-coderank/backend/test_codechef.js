function parseCodeChefHtml(html, username) {
  if (html.includes("User not found") || html.includes("could not be found") || html.includes("404 - Not Found")) {
    throw new Error(`CodeChef user "${username}" was not found.`);
  }

  // 1. Current Rating
  const ratingMatch = html.match(/class="rating-number"[^>]*>\s*(\d+)/i);
  const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;

  // 2. Stars (★ count from &#9733; or literal ★)
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
  const problemsSolved = solvedMatch ? parseInt(solvedMatch[1].replace(/,/g, ''), 10) : 0;

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
}

async function test() {
  for (const user of ['tourist', 'piyush_123', 'admin']) {
    try {
      const res = await fetch(`https://www.codechef.com/users/${user}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) {
        console.log(user, 'status:', res.status);
        continue;
      }
      const html = await res.text();
      console.log(user, parseCodeChefHtml(html, user));
    } catch (e) {
      console.log(user, 'error:', e.message);
    }
  }
}

test();
