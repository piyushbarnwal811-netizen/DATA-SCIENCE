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
      github: { publicRepos: 38, followers: 18 }
    },
    githubUsername: "diyajoshi57",
    leetcodeUsername: "diyajoshi_57",
    hackerrankUsername: "diya_joshi57"
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
      github: { publicRepos: 15, followers: 12 }
    },
    githubUsername: "nishagupta192",
    leetcodeUsername: "nisha_192",
    hackerrankUsername: "nisha_gupta192"
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
      github: { publicRepos: 14, followers: 9 }
    },
    githubUsername: "devmehta237",
    leetcodeUsername: "devmehta_237",
    hackerrankUsername: "dev_mehta237"
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
      github: { publicRepos: 35, followers: 22 }
    },
    githubUsername: "tanyasingh169",
    leetcodeUsername: "tanya_169",
    hackerrankUsername: "tanya_singh169"
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
      github: { publicRepos: 19, followers: 14 }
    },
    githubUsername: "karanmehta203",
    leetcodeUsername: "karan_203",
    hackerrankUsername: "karan_mehta203"
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
      github: { publicRepos: 42, followers: 31 }
    },
    githubUsername: "aaravsharma180",
    leetcodeUsername: "aarav_180",
    hackerrankUsername: "aarav_sharma180"
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
      github: { publicRepos: 28, followers: 19 }
    },
    githubUsername: "priyaverma1025",
    leetcodeUsername: "priya_1025",
    hackerrankUsername: "priya_verma1025"
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
      github: { publicRepos: 22, followers: 15 }
    },
    githubUsername: "rohanpatel1298",
    leetcodeUsername: "rohan_1298",
    hackerrankUsername: "rohan_patel1298"
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
      github: { publicRepos: 26, followers: 17 }
    },
    githubUsername: "ananyaroy1266",
    leetcodeUsername: "ananya_1266",
    hackerrankUsername: "ananya_roy1266"
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
      github: { publicRepos: 24, followers: 11 }
    },
    githubUsername: "sidjain1091",
    leetcodeUsername: "sid_1091",
    hackerrankUsername: "sid_jain1091"
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
      github: { publicRepos: 32, followers: 20 }
    },
    githubUsername: "kavyanair1159",
    leetcodeUsername: "kavya_1159",
    hackerrankUsername: "kavya_nair1159"
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
      github: { publicRepos: 31, followers: 16 }
    },
    githubUsername: "vikram1262",
    leetcodeUsername: "vikram_1262",
    hackerrankUsername: "vikram_1262"
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
