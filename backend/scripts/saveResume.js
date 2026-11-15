import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import Profile from "../src/models/Profile.js";

const resumeText = fs.readFileSync(
  new URL("./resume.txt", import.meta.url),
  "utf8",
);

if (resumeText.trim().length < 100) {
  console.log(
    " resume.txt khali hai ya bahut chhoti hai. Pehle usme resume paste karke save karo (Ctrl+S).",
  );
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const profile = await Profile.findOneAndUpdate(
  {},
  { $set: { resumeText } },
  { returnDocument: "after" },
);

if (!profile) {
  console.log("Pehle PUT /api/profile se basic profile save karo");
} else {
  console.log(`Resume saved  (${resumeText.length} characters)`);
}

await mongoose.disconnect();
