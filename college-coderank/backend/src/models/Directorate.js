import mongoose from "mongoose";

const directorateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    directorId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },
    tpoId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    building: { type: String, trim: true },
    establishedYear: { type: Number, default: 2008 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

export default mongoose.model("Directorate", directorateSchema);
