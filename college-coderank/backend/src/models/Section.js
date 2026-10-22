import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    directorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Directorate", index: true },
    year: { type: Number, required: true, min: 1, max: 5 },
    semester: { type: Number, required: true, min: 1, max: 10 },
    academicYear: { type: String, required: true, default: "2026-2027", trim: true },
    capacity: { type: Number, default: 60, min: 1 },
    totalStudents: { type: Number, default: 0, min: 0 },
    classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },
    primaryClassroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
    status: { type: String, enum: ["active", "vacant", "archived"], default: "active" }
  },
  { timestamps: true }
);

sectionSchema.index({ departmentId: 1, name: 1, academicYear: 1 }, { unique: true });

export default mongoose.model("Section", sectionSchema);
