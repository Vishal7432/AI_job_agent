import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    github: String,
    linkedin: String,
    portfolio: String,

    targetRoles: [String],        // ["SDE-1", "MERN Developer"]
    targetLocations: [String],    // ["Bangalore", "Remote"]
    skills: [String],
    experienceYears: { type: Number, default: 0 },
    expectedCTC: String,
    noticePeriod: { type: String, default: "Immediate" },

    resumeText: { type: String, default: "" }, // AI isi se tailor karega
    blockedCompanies: [String],                // inpe kabhi apply nahi
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);