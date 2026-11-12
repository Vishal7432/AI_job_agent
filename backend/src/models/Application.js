import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, unique: true },
    tailoredResume: String,
    coverLetter: String,
    status: {
      type: String,
      enum: ["pending_approval", "approved", "rejected", "applied", "failed", "interview", "offer"],
      default: "pending_approval",
    },
    appliedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);