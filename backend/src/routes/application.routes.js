import { Router } from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

const router = Router();

// "scored" jobs ko approval queue mein daalo
router.post("/queue", async (req, res) => {
  const jobs = await Job.find({ status: "scored" });
  for (const job of jobs) {
    await Application.updateOne(
      { job: job._id },
      { $setOnInsert: { job: job._id } },
      { upsert: true },
    );
    job.status = "queued";
    await job.save();
  }
  res.json({ queued: jobs.length });
});

// Queue dekho (?status=pending_approval)
router.get("/", async (req, res) => {
  const { status } = req.query;
  const apps = await Application.find(status ? { status } : {})
    .populate("job")
    .sort({ createdAt: -1 });
  res.json(apps);
});

const setStatus = (status, jobStatus) => async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app) return res.status(404).json({ error: "Application nahi mili" });

  app.status = status;
  if (status === "applied") app.appliedAt = new Date();
  await app.save();

  if (jobStatus) await Job.findByIdAndUpdate(app.job, { status: jobStatus });
  res.json(app);
};

router.patch("/:id/approve", setStatus("approved"));
router.patch("/:id/reject", setStatus("rejected", "skipped"));
router.patch("/:id/applied", setStatus("applied", "applied"));

export default router;
