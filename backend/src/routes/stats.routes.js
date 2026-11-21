import { Router } from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js";

const router = Router();
const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90, all: null };

const readPeriod = (req, res) => {
  const period = req.query.period === undefined ? "all" : req.query.period;
  if (typeof period !== "string" || !Object.hasOwn(PERIOD_DAYS, period)) {
    res.status(400).json({ error: "Invalid stats period." });
    return null;
  }

  return period;
};

const getPeriodRange = (period) => {
  const days = PERIOD_DAYS[period];
  const now = new Date();
  return days
    ? { createdAt: { $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) } }
    : {};
};

const getSummary = async (applicationFilter) => {
  const grouped = await Application.aggregate([
    { $match: applicationFilter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const c = Object.fromEntries(grouped.map((g) => [g._id, g.count]));

  return {
    counts: {
      pending: c.pending_approval || 0,
      approved: c.approved || 0,
      rejected: c.rejected || 0,
      applied: c.applied || 0,
    },
  };
};

router.get("/summary", async (req, res) => {
  const period = readPeriod(req, res);
  if (!period) return;

  res.json(await getSummary(getPeriodRange(period)));
});

router.get("/", async (req, res) => {
  const period = readPeriod(req, res);
  if (!period) return;

  const applicationFilter = getPeriodRange(period);
  const [summary, recent, topMatches, scoredJobs] = await Promise.all([
    getSummary(applicationFilter),
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

  res.json({
    ...summary,
    scoredJobs,
    recent,
    topMatches,
  });
});

export default router;
