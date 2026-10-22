import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    building: { type: String, required: true, trim: true },
    floor: { type: String, required: true, trim: true, default: "1st Floor" },
    type: {
      type: String,
      enum: ["Classroom", "Lecture Hall", "Computer Lab", "Hardware Lab", "Seminar Hall", "Auditorium"],
      default: "Classroom"
    },
    capacity: { type: Number, required: true, min: 10, default: 60 },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", index: true },
    directorateId: { type: mongoose.Schema.Types.ObjectId, ref: "Directorate", index: true },
    hasProjector: { type: Boolean, default: true },
    hasSmartBoard: { type: Boolean, default: true },
    hasAirConditioning: { type: Boolean, default: true },
    workstationsCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    maintenanceStatus: {
      type: String,
      enum: ["Operational", "Under Maintenance", "Reserved"],
      default: "Operational"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Classroom", classroomSchema);
