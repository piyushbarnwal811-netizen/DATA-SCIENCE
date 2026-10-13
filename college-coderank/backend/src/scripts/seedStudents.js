import "dotenv/config";
import { connectDatabase } from "../config/db.js";
import Student from "../models/Student.js";
import Department from "../models/Department.js";

const SAMPLE_DEPARTMENTS = [
  { name: "Computer Science", sections: ["A", "B", "C"] },
  { name: "IT", sections: ["A", "B"] },
  { name: "Data Science", sections: ["A", "B"] },
  { name: "AI", sections: ["A", "B"] },
  { name: "ECE", sections: ["A", "B"] }
];

const SEED_STUDENTS = [
  {
    studentId: "STU1057",
    name: "Diya Joshi 57",
    email: "diya.joshi57@rungta.ac.in",
    branch: "IT",
    section: "A",
    year: 3,
    score: 256.9,
    stats: {
      hackerrank: { solved: 290, points: 2900, badges: 5 },
      leetcode: { easy: 110, medium: 132, hard: 40, total: 282 },
      github: { publicRepos: 38, followers: 18 },
      codechef: { rating: 1443, stars: "2★", division: "Div 3", highestRating: 1478, problemsSolved: 75 },
      geeksforgeeks: { score: 302, problemsSolved: 92, monthlyScore: 75, instituteRank: "RISU" }
    },
    githubUsername: "diyajoshi57",
    leetcodeUsername: "diyajoshi_57",
    hackerrankUsername: "diya_joshi57",
    codechefUsername: "diyajoshi57",
    geeksforgeeksUsername: "diyajoshi57"
  },
  {
    studentId: "STU1192",
    name: "Nisha Gupta 192",
    email: "nisha.gupta192@rungta.ac.in",
    branch: "ECE",
    section: "B",
    year: 4,
    score: 251.6,
    stats: {
      hackerrank: { solved: 237, points: 2370, badges: 4 },
      leetcode: { easy: 145, medium: 175, hard: 45, total: 365 },
      github: { publicRepos: 15, followers: 12 },
      codechef: { rating: 1623, stars: "3★", division: "Div 2", highestRating: 1658, problemsSolved: 96 },
      geeksforgeeks: { score: 145, problemsSolved: 48, monthlyScore: 36, instituteRank: "RISU" }
    },
    githubUsername: "nishagupta192",
    leetcodeUsername: "nisha_192",
    hackerrankUsername: "nisha_gupta192",
    codechefUsername: "nishagupta192",
    geeksforgeeksUsername: "nishagupta192"
  },
  {
    studentId: "STU1237",
    name: "Dev Mehta 237",
    email: "dev.mehta237@rungta.ac.in",
    branch: "IT",
    section: "A",
    year: 3,
    score: 234.0,
    stats: {
      hackerrank: { solved: 189, points: 1890, badges: 3 },
      leetcode: { easy: 98, medium: 130, hard: 36, total: 264 },
      github: { publicRepos: 14, followers: 9 },
      codechef: { rating: 1401, stars: "2★", division: "Div 3", highestRating: 1436, problemsSolved: 51 },
      geeksforgeeks: { score: 282, problemsSolved: 90, monthlyScore: 70, instituteRank: "RISU" }
    },
    githubUsername: "devmehta237",
    leetcodeUsername: "devmehta_237",
    hackerrankUsername: "dev_mehta237",
    codechefUsername: "devmehta237",
    geeksforgeeksUsername: "devmehta237"
  },
  {
    studentId: "STU1169",
    name: "Tanya Singh 169",
    email: "tanya.singh169@rungta.ac.in",
    branch: "IT",
    section: "B",
    year: 2,
    score: 240.7,
    stats: {
      hackerrank: { solved: 182, points: 1820, badges: 4 },
      leetcode: { easy: 86, medium: 118, hard: 32, total: 236 },
      github: { publicRepos: 35, followers: 22 },
      codechef: { rating: 1718, stars: "3★", division: "Div 2", highestRating: 1753, problemsSolved: 39 },
      geeksforgeeks: { score: 436, problemsSolved: 139, monthlyScore: 109, instituteRank: "RISU" }
    },
    githubUsername: "tanyasingh169",
    leetcodeUsername: "tanya_169",
    hackerrankUsername: "tanya_singh169",
    codechefUsername: "tanyasingh169",
    geeksforgeeksUsername: "tanyasingh169"
  },
  {
    studentId: "STU1203",
    name: "Karan Mehta 203",
    email: "karan.mehta203@rungta.ac.in",
    branch: "Data Science",
    section: "A",
    year: 3,
    score: 232.9,
    stats: {
      hackerrank: { solved: 178, points: 1780, badges: 3 },
      leetcode: { easy: 92, medium: 115, hard: 30, total: 237 },
      github: { publicRepos: 19, followers: 14 },
      codechef: { rating: 1506, stars: "2★", division: "Div 3", highestRating: 1541, problemsSolved: 92 },
      geeksforgeeks: { score: 182, problemsSolved: 58, monthlyScore: 45, instituteRank: "RISU" }
    },
    githubUsername: "karanmehta203",
    leetcodeUsername: "karan_203",
    hackerrankUsername: "karan_mehta203",
    codechefUsername: "karanmehta203",
    geeksforgeeksUsername: "karanmehta203"
  },
  {
    studentId: "STU1180",
    name: "Aarav Sharma 180",
    email: "aarav.sharma180@rungta.ac.in",
    branch: "Computer Science",
    section: "A",
    year: 4,
    score: 278.5,
    stats: {
      hackerrank: { solved: 165, points: 1650, badges: 5 },
      leetcode: { easy: 130, medium: 180, hard: 55, total: 365 },
      github: { publicRepos: 42, followers: 31 },
      codechef: { rating: 1756, stars: "3★", division: "Div 2", highestRating: 1791, problemsSolved: 43 },
      geeksforgeeks: { score: 210, problemsSolved: 70, monthlyScore: 52, instituteRank: "RISU" }
    },
    githubUsername: "aaravsharma180",
    leetcodeUsername: "aarav_180",
    hackerrankUsername: "aarav_sharma180",
    codechefUsername: "aaravsharma180",
    geeksforgeeksUsername: "aaravsharma180"
  },
  {
    studentId: "STU1025",
    name: "Priya Verma 1025",
    email: "priya.verma1025@rungta.ac.in",
    branch: "Computer Science",
    section: "B",
    year: 3,
    score: 265.2,
    stats: {
      hackerrank: { solved: 154, points: 1540, badges: 3 },
      leetcode: { easy: 120, medium: 160, hard: 48, total: 328 },
      github: { publicRepos: 28, followers: 19 },
      codechef: { rating: 1647, stars: "3★", division: "Div 2", highestRating: 1682, problemsSolved: 43 },
      geeksforgeeks: { score: 215, problemsSolved: 70, monthlyScore: 53, instituteRank: "RISU" }
    },
    githubUsername: "priyaverma1025",
    leetcodeUsername: "priya_1025",
    hackerrankUsername: "priya_verma1025",
    codechefUsername: "priyaverma1025",
    geeksforgeeksUsername: "priyaverma1025"
  },
  {
    studentId: "STU1298",
    name: "Rohan Patel 1298",
    email: "rohan.patel1298@rungta.ac.in",
    branch: "Data Science",
    section: "B",
    year: 2,
    score: 248.0,
    stats: {
      hackerrank: { solved: 142, points: 1420, badges: 2 },
      leetcode: { easy: 105, medium: 145, hard: 38, total: 288 },
      github: { publicRepos: 22, followers: 15 },
      codechef: { rating: 1503, stars: "2★", division: "Div 3", highestRating: 1538, problemsSolved: 75 },
      geeksforgeeks: { score: 284, problemsSolved: 94, monthlyScore: 71, instituteRank: "RISU" }
    },
    githubUsername: "rohanpatel1298",
    leetcodeUsername: "rohan_1298",
    hackerrankUsername: "rohan_patel1298",
    codechefUsername: "rohanpatel1298",
    geeksforgeeksUsername: "rohanpatel1298"
  },
  {
    studentId: "STU1266",
    name: "Ananya Roy 1266",
    email: "ananya.roy1266@rungta.ac.in",
    branch: "AI",
    section: "A",
    year: 2,
    score: 242.4,
    stats: {
      hackerrank: { solved: 138, points: 1380, badges: 3 },
      leetcode: { easy: 95, medium: 135, hard: 42, total: 272 },
      github: { publicRepos: 26, followers: 17 },
      codechef: { rating: 1569, stars: "2★", division: "Div 3", highestRating: 1604, problemsSolved: 53 },
      geeksforgeeks: { score: 227, problemsSolved: 72, monthlyScore: 56, instituteRank: "RISU" }
    },
    githubUsername: "ananyaroy1266",
    leetcodeUsername: "ananya_1266",
    hackerrankUsername: "ananya_roy1266",
    codechefUsername: "ananyaroy1266",
    geeksforgeeksUsername: "ananyaroy1266"
  },
  {
    studentId: "STU1091",
    name: "Siddharth Jain 1091",
    email: "sid.jain1091@rungta.ac.in",
    branch: "Computer Science",
    section: "A",
    year: 3,
    score: 238.1,
    stats: {
      hackerrank: { solved: 128, points: 1280, badges: 2 },
      leetcode: { easy: 88, medium: 140, hard: 34, total: 262 },
      github: { publicRepos: 24, followers: 11 },
      codechef: { rating: 1677, stars: "3★", division: "Div 2", highestRating: 1712, problemsSolved: 36 },
      geeksforgeeks: { score: 404, problemsSolved: 129, monthlyScore: 101, instituteRank: "RISU" }
    },
    githubUsername: "sidjain1091",
    leetcodeUsername: "sid_1091",
    hackerrankUsername: "sid_jain1091",
    codechefUsername: "sidjain1091",
    geeksforgeeksUsername: "sidjain1091"
  },
  {
    studentId: "STU1159",
    name: "Kavya Nair 1159",
    email: "kavya.nair1159@rungta.ac.in",
    branch: "ECE",
    section: "A",
    year: 3,
    score: 225.8,
    stats: {
      hackerrank: { solved: 120, points: 1200, badges: 2 },
      leetcode: { easy: 82, medium: 112, hard: 28, total: 222 },
      github: { publicRepos: 32, followers: 20 },
      codechef: { rating: 1450, stars: "2★", division: "Div 3", highestRating: 1485, problemsSolved: 55 },
      geeksforgeeks: { score: 373, problemsSolved: 121, monthlyScore: 93, instituteRank: "RISU" }
    },
    githubUsername: "kavyanair1159",
    leetcodeUsername: "kavya_1159",
    hackerrankUsername: "kavya_nair1159",
    codechefUsername: "kavyanair1159",
    geeksforgeeksUsername: "kavyanair1159"
  },
  {
    studentId: "STU1262",
    name: "Vikram Malhotra 1262",
    email: "vikram.m1262@rungta.ac.in",
    branch: "IT",
    section: "B",
    year: 4,
    score: 231.0,
    stats: {
      hackerrank: { solved: 115, points: 1150, badges: 3 },
      leetcode: { easy: 85, medium: 120, hard: 30, total: 235 },
      github: { publicRepos: 31, followers: 16 },
      codechef: { rating: 1572, stars: "2★", division: "Div 3", highestRating: 1607, problemsSolved: 58 },
      geeksforgeeks: { score: 323, problemsSolved: 103, monthlyScore: 80, instituteRank: "RISU" }
    },
    githubUsername: "vikram1262",
    leetcodeUsername: "vikram_1262",
    hackerrankUsername: "vikram_1262",
    codechefUsername: "vikram1262",
    geeksforgeeksUsername: "vikram1262"
  }
];

async function seed() {
  try {
    await connectDatabase();
    console.log("Connected to MongoDB for seeding.");

    for (const dept of SAMPLE_DEPARTMENTS) {
      await Department.findOneAndUpdate(
        { name: dept.name },
        { $set: dept },
        { upsert: true, new: true }
      );
    }
    console.log("Departments seeded.");

    for (const student of SEED_STUDENTS) {
      await Student.findOneAndUpdate(
        { email: student.email },
        { $set: student },
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${SEED_STUDENTS.length} students successfully.`);

    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
