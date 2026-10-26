import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    role: {
      type: String,
      required: true,
      enum: ["tpo", "director", "hod", "teacher"],
      index: true
    },
    directorateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Directorate",
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true
    },
    acceptedAt: {
      type: Date
    },
    revokedAt: {
      type: Date
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    },
    resendCount: {
      type: Number,
      default: 0
    },
    createdUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { timestamps: true }
);

invitationSchema.index({ createdAt: -1 });

export default mongoose.model("Invitation", invitationSchema);
