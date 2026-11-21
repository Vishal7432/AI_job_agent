import { Router } from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

const router = Router();
const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90, all: null };

router.get("/", async (req, res) => {
  const period = req.query.period === undefined ? "all" : req.query.period;
  if (typeof period !== "string" || !Object.hasOwn(PERIOD_DAYS, period)) {
    return res.status(400).json({ error: "Invalid stats period." });
  }

  const days = PERIOD_DAYS[period];
  const applicationFilter = days
    ? { createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
    : {};

  const [grouped, recent, topMatches, scoredJobs] = await Promise.all([
    Application.aggregate([
      { $match: applicationFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Application.find({
      ...applicationFilter,
      status: { $ne: "pending_approval" },
    })
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
