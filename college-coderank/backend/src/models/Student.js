import mongoose from "mongoose";

const platformStatsSchema = new mongoose.Schema(
  {
    leetcode: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    recentAccepted: [{
      title: { type: String, trim: true },
      titleSlug: { type: String, trim: true },
      difficulty: { type: String, trim: true },
      solvedAt: { type: Date }
    }],
    github: {
      publicRepos: { type: Number, default: 0 },
      followers: { type: Number, default: 0 }
    },
    hackerrank: {
      points: { type: Number, default: 0 },
      solved: { type: Number, default: 0 },
      badges: { type: Number, default: 0 }
    },
    codechef: {
      rating: { type: Number, default: 0 },
      stars: { type: String, default: "1★" },
      division: { type: String, default: "" },
      highestRating: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      globalRank: { type: Number, default: 0 },
      countryRank: { type: Number, default: 0 }
    },
    geeksforgeeks: {
      score: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      monthlyScore: { type: Number, default: 0 },
      instituteRank: { type: String, default: "" }
    },
    lastSyncedAt: { type: Date, default: null }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    studentId: { type: String, trim: true, unique: true, sparse: true, index: true },
    password: { type: String, select: false },
    branch: { type: String, required: true, trim: true, index: true },
    section: { type: String, required: true, trim: true, index: true },
    year: { type: Number, required: true, min: 1, max: 8, index: true },
    leetcodeUsername: { type: String, trim: true, default: "" },
    githubUsername: { type: String, trim: true, default: "" },
    hackerrankUsername: { type: String, trim: true, default: "" },
    codechefUsername: { type: String, trim: true, default: "" },
    geeksforgeeksUsername: { type: String, trim: true, default: "" },
    stats: { type: platformStatsSchema, default: () => ({}) },
    score: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
    mustChangePassword: {
      type: Boolean,
      default: false,
      alias: "must_change_password"
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
      default: null,
      alias: "reset_password_token_hash"
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
      default: null,
      alias: "reset_password_expires_at"
    },
    resetPasswordUsed: {
      type: Boolean,
      select: false,
      default: false,
      alias: "reset_password_used"
    },
    tokenVersion: {
      type: Number,
      default: 0,
      alias: "token_version"
    }
  },
  { timestamps: true }
);

studentSchema.index({ score: -1, name: 1 });
studentSchema.index({ resetPasswordTokenHash: 1 }, { sparse: true });

export default mongoose.model("Student", studentSchema);