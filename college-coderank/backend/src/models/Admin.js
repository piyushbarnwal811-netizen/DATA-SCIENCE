import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super_admin", "admin", "tpo", "director", "hod", "teacher"],
      default: "super_admin",
      index: true
    },
    employeeId: { type: String, trim: true, unique: true, sparse: true, index: true },
    phone: { type: String, trim: true },
    designation: { type: String, trim: true },
    qualification: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "on_leave", "inactive"],
      default: "active"
    },
    directorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Directorate", index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", index: true },
    assignedSections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
    assignedSubjects: [{ type: String, trim: true }],
    maxWeeklyHours: { type: Number, default: 20 },
    avatar: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);