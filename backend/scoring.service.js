import Job from "./src/models/Job.js";
import Profile from "./src/models/Profile.js";
import { scoreJob } from "./src/services/ai/matcher.js";

export async function runScoring(limit = 20) {
  const profile = await Profile.findOne();
  if (!profile || !profile.resumeText)
    throw new Error("Pehle profile + resume save karo");

  const threshold = Number(process.env.MATCH_THRESHOLD) || 70;
  const jobs = await Job.find({ status: "new" }).limit(limit);

  let good = 0,
    skipped = 0;
  const errors = [];

  for (const job of jobs) {
    try {
      const r = await scoreJob(profile, job);
      job.matchScore = r.score;
      job.matchReason = `${r.reason} | Missing: ${r.missingSkills.join(", ") || "none"}`;
      job.status = r.score >= threshold ? "scored" : "skipped";
      await job.save();
      r.score >= threshold ? good++ : skipped++;
    } catch (err) {
      errors.push(`${job.title}: ${err.message}`); // ek fail ho to baaki chalti rahe
    }
  }

  return { processed: jobs.length, goodMatches: good, skipped, errors };
}
