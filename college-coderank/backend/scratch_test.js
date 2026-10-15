async function test() {
  const username = 'palakkumari31052008-boop';
  const res = await fetch(`https://github.com/${username}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  
  // Look for Repositories counter in HTML
  const repoRegexes = [
    /tab=repositories[^>]*>[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*title="([0-9,]+)"/i,
    /tab=repositories[^>]*>[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /data-tab-item="repositories"[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /itemprop="owns"[^>]*>[\s\S]*?Repositories[\s\S]*?<span[^>]*class="[^"]*Counter[^"]*"[^>]*>([0-9,]+)<\/span>/i
  ];

  let repos = null;
  for (const rx of repoRegexes) {
    const m = html.match(rx);
    if (m) {
      repos = parseInt(m[1].replace(/,/g, ''), 10);
      break;
    }
  }

  // Look for followers counter
  const followerRegexes = [
    /href="[^"]*tab=followers"[^>]*>[\s\S]*?<span[^>]*class="[^"]*text-bold[^"]*"[^>]*>([0-9,]+)<\/span>/i,
    /([0-9,]+)\s*followers/i
  ];
  let followers = 0;
  for (const rx of followerRegexes) {
    const m = html.match(rx);
    if (m) {
      followers = parseInt(m[1].replace(/,/g, ''), 10);
      break;
    }
  }

  console.log('Scraped result:', { repos, followers });
}

test().catch(console.error);
