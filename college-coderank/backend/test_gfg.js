async function fetchUser(u) {
  try {
    const res = await fetch(`https://www.geeksforgeeks.org/profile/${u}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) return { user: u, status: res.status };
    const html = await res.text();
    const score = (html.match(/"score":\s*(\d+)/i) || html.match(/\\"score\\":\s*(\d+)/i))?.[1] || 0;
    const solved = (html.match(/"total_problems_solved":\s*(\d+)/i) || html.match(/\\"total_problems_solved\\":\s*(\d+)/i))?.[1] || 0;
    const monthly = (html.match(/"monthly_score":\s*(\d+)/i) || html.match(/\\"monthly_score\\":\s*(\d+)/i))?.[1] || 0;
    const instRank = (html.match(/"institute_rank":\s*"?([^",\\]*)"?/i) || html.match(/\\"institute_rank\\":\s*\\"?([^",\\]*)\\"?/i))?.[1] || "";
    return { user: u, score: +score, solved: +solved, monthly: +monthly, instRank };
  } catch (e) {
    return { user: u, error: e.message };
  }
}

// Try a couple of active usernames
const users = ['geeks', 'admin', 'tourist', 'errichto', 'love_babbar', 'striver'];
for (const u of users) {
  const r = await fetchUser(u);
  console.log(r);
}
