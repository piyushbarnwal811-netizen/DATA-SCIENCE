import ExcelJS from "exceljs";

/**
 * Generate a beautifully formatted Excel workbook for the Leaderboard / Student Roster.
 */
export async function generateLeaderboardWorkbook(students = [], { title = "College CodeRank Leaderboard", filters = {} } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "College CodeRank";
  workbook.lastModifiedBy = "College CodeRank System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // Worksheet 1: Leaderboard Roster
  const sheet = workbook.addWorksheet("Leaderboard", {
    views: [{ state: "frozen", ySplit: 2 }],
    properties: { tabColor: { argb: "FF4F46E5" } }
  });

  // Title Banner Row
  sheet.mergeCells("A1:W1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${title} — Generated on ${new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}`;
  titleCell.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E1B4B" } // Deep Indigo
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(1).height = 36;

  // Define Columns
  sheet.columns = [
    { header: "Rank", key: "rank", width: 10 },
    { header: "Student ID / Roll No", key: "studentId", width: 22 },
    { header: "Student Name", key: "name", width: 26 },
    { header: "Email Address", key: "email", width: 28 },
    { header: "Branch / Department", key: "branch", width: 24 },
    { header: "Section", key: "section", width: 12 },
    { header: "Year", key: "year", width: 10 },
    { header: "Total Score (pts)", key: "score", width: 18 },
    { header: "LeetCode Solved", key: "leetcodeTotal", width: 18 },
    { header: "LeetCode Easy", key: "leetcodeEasy", width: 15 },
    { header: "LeetCode Medium", key: "leetcodeMedium", width: 17 },
    { header: "LeetCode Hard", key: "leetcodeHard", width: 15 },
    { header: "LeetCode Handle", key: "leetcodeUsername", width: 20 },
    { header: "GitHub Repos", key: "githubRepos", width: 15 },
    { header: "GitHub Followers", key: "githubFollowers", width: 16 },
    { header: "GitHub Handle", key: "githubUsername", width: 20 },
    { header: "HackerRank Points", key: "hackerrankPoints", width: 18 },
    { header: "HackerRank Handle", key: "hackerrankUsername", width: 22 },
    { header: "CodeChef Rating", key: "codechefRating", width: 17 },
    { header: "CodeChef Stars", key: "codechefStars", width: 15 },
    { header: "CodeChef Solved", key: "codechefSolved", width: 16 },
    { header: "CodeChef Handle", key: "codechefUsername", width: 20 },
    { header: "Last Synced At", key: "lastSyncedAt", width: 22 }
  ];

  // Format Header Row (Row 2)
  const headerRow = sheet.getRow(2);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF312E81" } // Indigo 900
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FF475569" } },
      bottom: { style: "medium", color: { argb: "FF6366F1" } },
      right: { style: "thin", color: { argb: "FF475569" } }
    };
  });

  // Populate Data Rows
  students.forEach((student, index) => {
    const rank = student.rank ?? index + 1;
    const isEven = index % 2 === 0;

    const row = sheet.addRow({
      rank,
      studentId: student.studentId || "—",
      name: student.name,
      email: student.email,
      branch: student.branch,
      section: student.section,
      year: student.year ? `${student.year} Year` : "—",
      score: student.score ?? 0,
      leetcodeTotal: student.stats?.leetcode?.total ?? 0,
      leetcodeEasy: student.stats?.leetcode?.easy ?? 0,
      leetcodeMedium: student.stats?.leetcode?.medium ?? 0,
      leetcodeHard: student.stats?.leetcode?.hard ?? 0,
      leetcodeUsername: student.leetcodeUsername || "—",
      githubRepos: student.stats?.github?.publicRepos ?? 0,
      githubFollowers: student.stats?.github?.followers ?? 0,
      githubUsername: student.githubUsername || "—",
      hackerrankPoints: student.stats?.hackerrank?.points ?? 0,
      hackerrankUsername: student.hackerrankUsername || "—",
      codechefRating: student.stats?.codechef?.rating ?? 0,
      codechefStars: student.stats?.codechef?.stars || "1★",
      codechefSolved: student.stats?.codechef?.problemsSolved ?? 0,
      codechefUsername: student.codechefUsername || "—",
      lastSyncedAt: student.stats?.lastSyncedAt
        ? new Date(student.stats.lastSyncedAt).toLocaleString("en-IN")
        : "Not synced"
    });

    row.height = 24;

    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Segoe UI", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: [1, 6, 7, 8, 9, 10, 11, 12, 14, 15, 17].includes(colNumber) ? "center" : "left"
      };

      // Zebra striping
      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }
        };
      }

      // Border
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };

      // Highlight Top 3 ranks
      if (colNumber === 1) {
        cell.font = { name: "Segoe UI", size: 10, bold: true };
        if (rank === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF08A" } }; // Gold
        else if (rank === 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }; // Silver
        else if (rank === 3) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFED7AA" } }; // Bronze
      }

      // Highlight Score column
      if (colNumber === 8) {
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E40AF" } };
      }
    });
  });

  // Auto-fit column widths with padding
  sheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber === 1) return; // skip banner
      const columnLength = cell.value ? cell.value.toString().length : 8;
      if (columnLength > maxLength) maxLength = columnLength;
    });
    column.width = Math.max(maxLength + 4, column.width || 12);
  });

  // Worksheet 2: Summary & Metadata
  const summarySheet = workbook.addWorksheet("Summary Statistics", {
    properties: { tabColor: { argb: "FF10B981" } }
  });

  summarySheet.columns = [
    { header: "Metric / Filter", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 35 }
  ];

  const totalPoints = students.reduce((sum, s) => sum + (s.score || 0), 0);
  const avgScore = students.length ? Math.round(totalPoints / students.length) : 0;
  const topStudent = students[0];

  const summaryRows = [
    { metric: "Total Students Exported", value: students.length },
    { metric: "Total Combined Score", value: `${totalPoints} pts` },
    { metric: "Average Student Score", value: `${avgScore} pts` },
    { metric: "Campus Leader", value: topStudent ? `${topStudent.name} (${topStudent.score} pts)` : "N/A" },
    { metric: "Branch Filter", value: filters.branch || "All Branches" },
    { metric: "Section Filter", value: filters.section || "All Sections" },
    { metric: "Year Filter", value: filters.year ? `${filters.year} Year` : "All Years" },
    { metric: "Search Query", value: filters.search || "None" },
    { metric: "Export Timestamp", value: new Date().toISOString() }
  ];

  summarySheet.getRow(1).height = 28;
  summarySheet.getRow(1).eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  summaryRows.forEach((r, idx) => {
    const row = summarySheet.addRow(r);
    row.height = 22;
    row.eachCell((cell, col) => {
      cell.font = { name: "Segoe UI", size: 10, bold: col === 1 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
      if (idx % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
      }
    });
  });

  return workbook.xlsx.writeBuffer();
}

/**
 * Generate a detailed Excel workbook for an individual student.
 */
export async function generateStudentWorkbook(student) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "College CodeRank";
  workbook.created = new Date();

  // Sheet 1: Student Dossier
  const sheet = workbook.addWorksheet("Student Profile", {
    properties: { tabColor: { argb: "FF6366F1" } }
  });

  sheet.mergeCells("A1:D1");
  const banner = sheet.getCell("A1");
  banner.value = `Student Dossier: ${student.name}`;
  banner.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  banner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1B4B" } };
  banner.alignment = { vertical: "middle", horizontal: "center" };
  sheet.getRow(1).height = 36;

  sheet.columns = [
    { key: "field", width: 25 },
    { key: "val", width: 35 },
    { key: "platformField", width: 25 },
    { key: "platformVal", width: 25 }
  ];

  const details = [
    ["Roll Number / ID", student.studentId || "—", "Total Campus Score", `${student.score || 0} pts`],
    ["Full Name", student.name, "LeetCode Solved (Total)", student.stats?.leetcode?.total ?? 0],
    ["Email Address", student.email, "LeetCode Easy", student.stats?.leetcode?.easy ?? 0],
    ["Branch / Department", student.branch, "LeetCode Medium", student.stats?.leetcode?.medium ?? 0],
    ["Section", student.section, "LeetCode Hard", student.stats?.leetcode?.hard ?? 0],
    ["Academic Year", `${student.year} Year`, "LeetCode Username", student.leetcodeUsername || "—"],
    ["GitHub Username", student.githubUsername || "—", "GitHub Repositories", student.stats?.github?.publicRepos ?? 0],
    ["HackerRank Username", student.hackerrankUsername || "—", "GitHub Followers", student.stats?.github?.followers ?? 0],
    ["CodeChef Username", student.codechefUsername || "—", "HackerRank Points", student.stats?.hackerrank?.points ?? 0],
    ["CodeChef Rating", student.stats?.codechef?.rating ? `${student.stats.codechef.rating} (${student.stats.codechef.stars || "1★"})` : "Unrated", "CodeChef Solved", student.stats?.codechef?.problemsSolved ?? 0],
    ["Account Status", student.isActive ? "Active" : "Inactive", "Profile Generated", new Date().toLocaleString("en-IN")],
    ["Last Synced At", student.stats?.lastSyncedAt ? new Date(student.stats.lastSyncedAt).toLocaleString("en-IN") : "Never", "CodeChef Division", student.stats?.codechef?.division || "—"]
  ];

  details.forEach(([f1, v1, f2, v2], idx) => {
    const row = sheet.addRow({ field: f1, val: v1, platformField: f2, platformVal: v2 });
    row.height = 24;
    row.eachCell((cell, col) => {
      cell.font = { name: "Segoe UI", size: 10, bold: col % 2 === 1 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
      if (idx % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
  });

  // Sheet 2: Recent Solved Problems
  const recentSheet = workbook.addWorksheet("Recent Solved Problems", {
    properties: { tabColor: { argb: "FFEC4899" } }
  });

  recentSheet.columns = [
    { header: "#", key: "num", width: 8 },
    { header: "Problem Title", key: "title", width: 35 },
    { header: "Difficulty", key: "difficulty", width: 16 },
    { header: "Solved At", key: "solvedAt", width: 22 },
    { header: "LeetCode Link", key: "link", width: 45 }
  ];

  recentSheet.getRow(1).height = 28;
  recentSheet.getRow(1).eachCell((cell) => {
    cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF831843" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const recentProblems = student.stats?.recentAccepted ?? [];
  recentProblems.forEach((problem, index) => {
    const row = recentSheet.addRow({
      num: index + 1,
      title: problem.title,
      difficulty: problem.difficulty || "Unknown",
      solvedAt: problem.solvedAt ? new Date(problem.solvedAt).toLocaleDateString("en-IN") : "—",
      link: problem.titleSlug ? `https://leetcode.com/problems/${problem.titleSlug}/` : "—"
    });
    row.height = 22;
    row.eachCell((cell, col) => {
      cell.font = { name: "Segoe UI", size: 10 };
      cell.alignment = { vertical: "middle", horizontal: col === 1 || col === 3 ? "center" : "left" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
      if (col === 3) {
        if (problem.difficulty === "Easy") cell.font = { bold: true, color: { argb: "FF16A34A" } };
        else if (problem.difficulty === "Medium") cell.font = { bold: true, color: { argb: "FFEA580C" } };
        else if (problem.difficulty === "Hard") cell.font = { bold: true, color: { argb: "FFDC2626" } };
      }
    });
  });

  return workbook.xlsx.writeBuffer();
}
