import { Router } from "express";
import { z } from "zod";
import Job from "../models/Job.js";
import Profile from "../models/Profile.js";
import { validate } from "../middleware/validate.js";
import { analyzeResume } from "../services/resumeAnalyzer.js";
import { claudeMatchJobs } from "../services/ai/matcher.js";

const router = Router();

const bodySchema = z.object({
  resumeText: z.string().optional(),
  jdText: z.string().optional(),
  jobId: z.string().optional(),
});

const matchSchema = z.object({
  resumeText: z.string().trim().min(100).max(12000),
});

router.get("/status", (_req, res) => {
  res.json({ aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

router.post("/match", validate(matchSchema), async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "AI review needs ANTHROPIC_API_KEY configured in the backend environment.",
    });
  }

  const jobs = await Job.find({
    status: { $in: ["new", "scored"] },
    description: { $exists: true, $ne: "" },
  })
    .sort({ createdAt: -1 })
    .limit(25);
  if (jobs.length === 0) {
    return res.json({ reviewedCount: 0, matchingCount: 0, matches: [] });
  }

  const scores = await claudeMatchJobs(req.body.resumeText, jobs);
  const scoreById = new Map(scores.map(({ jobId, score }) => [jobId, score]));
  const threshold = Number(process.env.REVIEW_MIN) || 70;
  const matches = jobs
    .map((job) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location || "",
      url: job.url,
      score: scoreById.get(job._id.toString()),
    }))
    .filter((job) => job.score >= threshold)
    .sort((a, b) => b.score - a.score);

  res.json({
    reviewedCount: jobs.length,
    matchingCount: matches.length,
    matches,
  });
});

router.post("/analyze", validate(bodySchema), async (req, res) => {
  const profile = await Profile.findOne();
  const resumeText = (req.body.resumeText || profile?.resumeText || "").trim();
  if (resumeText.length < 100) {
    return res
      .status(400)
      .json({ error: "Resume text khali ya bahut chhota hai" });
  }

  let jdText = req.body.jdText || "";
  let job = null;
  if (!jdText && req.body.jobId) {
    job = await Job.findById(req.body.jobId);
    jdText = job?.description || "";
  }

  const result = analyzeResume({
    resumeText,
    jdText,
    experienceYears: profile?.experienceYears ?? 0,
  });
  res.json({
    ...result,
    job: job ? { title: job.title, company: job.company } : null,
  });
});

export default router;
