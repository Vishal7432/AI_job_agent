import { Router } from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

const router = Router();

router.get("/", async (req, res) => {
  const [grouped, recent, topMatches, scoredJobs] = await Promise.all([
    Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Application.find({ status: { $ne: "pending_approval" } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("job"),
    Job.find({ status: { $in: ["scored", "queued"] } })
      .sort({ matchScore: -1 })
      .limit(5),
    Job.countDocuments({ status: "scored" }),
  ]);

  const c = Object.fromEntries(grouped.map((g) => [g._id, g.count]));
  res.json({
    counts: {
      pending: c.pending_approval || 0,
      approved: c.approved || 0,
      rejected: c.rejected || 0,
      applied: c.applied || 0,
    },
    scoredJobs,
    recent,
    topMatches,
  });
});

export default router;
