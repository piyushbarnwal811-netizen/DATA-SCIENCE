import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    credits: { type: Number, default: 4, min: 1 },
    type: {
      type: String,
      enum: ["Theory", "Lab / Practical", "Seminar", "Elective"],
      default: "Theory"
    },
    semester: { type: Number, default: 5, min: 1, max: 10 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);
