import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    code: { type: String, uppercase: true, trim: true },
    directorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Directorate", index: true },
    hodId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },
    buildingBlock: { type: String, trim: true },
    floor: { type: String, trim: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    sections: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);