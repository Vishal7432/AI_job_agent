import { Router } from "express";
import Job from "../models/Job.js";
import { runDiscovery } from "../services/discovery.service.js";
import { runScoring } from "../services/scoring.service.js";

const router = Router();

router.post("/discover", async (req, res) => {
  const summary = await runDiscovery();
  res.json(summary);
});

router.get("/", async (req, res) => {
  const { status, sort } = req.query;
  const order = sort === "score" ? { matchScore: -1 } : { createdAt: -1 };
  const jobs = await Job.find(status ? { status } : {})
    .sort(order)
    .limit(100);
  res.json(jobs);
});
// for ek bar ke liye score karne ke liye (credits aane ke baad kaam aayega)
// router.post("/score", async (req, res) => {
//   const summary = await runScoring();
//   res.json(summary);
// });

router.post("/score", async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const summary = await runScoring(limit);
  res.json(summary);
});

// Claude se dobara score karwane ke liye (credits aane ke baad kaam aayega)
router.post("/reset-scores", async (req, res) => {
  const r = await Job.updateMany(
    { status: { $in: ["scored", "skipped"] } },
    { $set: { status: "new", matchScore: null, matchReason: "" } },
  );
  res.json({ reset: r.modifiedCount });
});

export default router;
