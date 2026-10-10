import Student from "../models/Student.js";
import Department from "../models/Department.js";
import { generateLeaderboardWorkbook } from "../utils/excelExporter.js";

function buildFilterFromQuery(query) {
  const filter = { isActive: true };
  for (const field of ["branch", "section"]) {
    if (query[field]) filter[field] = String(query[field]).trim();
  }
  if (query.year) {
    const year = Number(query.year);
    if (Number.isInteger(year) && year >= 1 && year <= 8) {
      filter.year = year;
    }
  }
  const search = String(query.search ?? "").trim();
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: new RegExp(escaped, "i") },
      { studentId: new RegExp(escaped, "i") }
    ];
  }
  return filter;
}

function parseLimit(limitParam, defaultLimit = 500) {
  if (limitParam === undefined || limitParam === null || limitParam === "") return defaultLimit;
  const parsed = Number(limitParam);
  if (Number.isInteger(parsed) && parsed > 0) {
    return Math.min(parsed, 5000);
  }
  return defaultLimit;
}

export async function getLeaderboard(req, res, next) {
  try {
    if (req.query.year) {
      const year = Number(req.query.year);
      if (!Number.isInteger(year) || year < 1 || year > 8) {
        return res.status(400).json({ message: "Year must be a number between 1 and 8." });
      }
    }

    const filter = buildFilterFromQuery(req.query);
    const limit = parseLimit(req.query.limit, 500);

    const students = await Student.find(filter)
      .select("name email studentId branch section year stats score githubUsername leetcodeUsername hackerrankUsername")
      .sort({ score: -1, name: 1 })
      .limit(limit)
      .lean();

    const ranked = students.map((student, index) => ({ ...student, rank: index + 1 }));
    const [totalStudents, departments] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Department.find().select("name sections").sort({ name: 1 }).lean()
    ]);
    const totalScore = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: "$score" } } }
    ]);

    return res.json({
      students: ranked,
      filters: { departments },
      summary: {
        totalStudents,
        totalPoints: totalScore[0]?.total ?? 0,
        shown: ranked.length,
        limit
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function exportLeaderboard(req, res, next) {
  try {
    const filter = buildFilterFromQuery(req.query);
    const limit = parseLimit(req.query.limit, 5000);

    const students = await Student.find(filter)
      .select("name email studentId branch section year stats score githubUsername leetcodeUsername hackerrankUsername")
      .sort({ score: -1, name: 1 })
      .limit(limit)
      .lean();

    const ranked = students.map((student, index) => ({ ...student, rank: index + 1 }));

    const buffer = await generateLeaderboardWorkbook(ranked, {
      title: req.query.limit ? `Leaderboard — Top ${limit} Students` : "College CodeRank Leaderboard",
      filters: {
        branch: req.query.branch,
        section: req.query.section,
        year: req.query.year,
        search: req.query.search
      }
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `CodeRank_Leaderboard_${timestamp}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.byteLength || buffer.length);

    return res.send(Buffer.from(buffer));
  } catch (error) {
    return next(error);
  }
}