import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import Profile from "../src/models/Profile.js";

const resumeText = fs.readFileSync(
  new URL("./resume.txt", import.meta.url),
  "utf8",
);

await mongoose.connect(process.env.MONGO_URI);

const profile = await Profile.findOneAndUpdate(
  {},
  { $set: { resumeText } },
  { new: true },
);

if (!profile) {
  console.log("Pehle PUT /api/profile se basic profile save karo");
} else {
  console.log(`Resume saved (${resumeText.length} characters)`);
}

await mongoose.disconnect();
