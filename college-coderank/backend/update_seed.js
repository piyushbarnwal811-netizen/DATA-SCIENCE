import fs from 'fs';

let code = fs.readFileSync('src/scripts/seedStudents.js', 'utf8');

code = code.replace(/githubUsername:\s*"([^"]+)",\s*leetcodeUsername:\s*"([^"]+)",\s*hackerrankUsername:\s*"([^"]+)"/g, (match, gh, lc, hr) => {
  return `githubUsername: "${gh}",\n    leetcodeUsername: "${lc}",\n    hackerrankUsername: "${hr}",\n    codechefUsername: "${gh}",\n    geeksforgeeksUsername: "${gh}"`;
});

// Add stats.geeksforgeeks and stats.codechef to SEED_STUDENTS
code = code.replace(/github:\s*\{\s*publicRepos:\s*(\d+),\s*followers:\s*(\d+)\s*\}/g, (match, repos, followers) => {
  const gfgSolved = Math.floor(45 + Math.random() * 95);
  const gfgScore = Math.floor(gfgSolved * 3 + Math.random() * 40);
  const ccSolved = Math.floor(35 + Math.random() * 75);
  const ccRating = Math.floor(1380 + Math.random() * 420);
  const stars = ccRating >= 1800 ? "4★" : ccRating >= 1600 ? "3★" : ccRating >= 1400 ? "2★" : "1★";
  const division = ccRating >= 1600 ? "Div 2" : "Div 3";

  return `github: { publicRepos: ${repos}, followers: ${followers} },\n      codechef: { rating: ${ccRating}, stars: "${stars}", division: "${division}", highestRating: ${ccRating + 35}, problemsSolved: ${ccSolved} },\n      geeksforgeeks: { score: ${gfgScore}, problemsSolved: ${gfgSolved}, monthlyScore: ${Math.floor(gfgScore / 4)}, instituteRank: "RISU" }`;
});

fs.writeFileSync('src/scripts/seedStudents.js', code);
console.log('Successfully updated seedStudents.js with CodeChef and GeeksforGeeks!');
