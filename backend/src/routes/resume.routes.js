import { Router } from "express";
import { z } from "zod";
import Job from "../models/Job.js";
import Profile from "../models/Profile.js";
import { validate } from "../middleware/validate.js";
import { analyzeResume } from "../services/resumeAnalyzer.js";

const router = Router();

const bodySchema = z.object({
  resumeText: z.string().optional(),
  jdText: z.string().optional(),
  jobId: z.string().optional(),
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
