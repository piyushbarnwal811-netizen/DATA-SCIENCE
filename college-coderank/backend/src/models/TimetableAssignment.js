import mongoose from "mongoose";

const timetableAssignmentSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true, index: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    directorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Directorate", index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, required: true, trim: true },
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true
    },
    slotType: {
      type: String,
      enum: ["Lecture", "Lab", "Tutorial"],
      default: "Lecture"
    },
    academicYear: { type: String, default: "2026-2027", trim: true },
    semester: { type: Number, default: 5 }
  },
  { timestamps: true }
);

// Prevent double booking of classroom at same day & timeSlot
timetableAssignmentSchema.index({ classroomId: 1, dayOfWeek: 1, timeSlot: 1, academicYear: 1 });

// Prevent double booking of teacher at same day & timeSlot
timetableAssignmentSchema.index({ teacherId: 1, dayOfWeek: 1, timeSlot: 1, academicYear: 1 });

export default mongoose.model("TimetableAssignment", timetableAssignmentSchema);
