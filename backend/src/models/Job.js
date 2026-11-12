import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["linkedin", "naukri", "indeed", "company", "other"],
      required: true,
    },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    url: { type: String, required: true, unique: true }, // unique = duplicate nahi
    description: String,
    matchScore: { type: Number, default: null },
    matchReason: String,
    status: {
      type: String,
      enum: ["new", "scored", "skipped", "queued", "applied"],
      default: "new",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Job", jobSchema);
