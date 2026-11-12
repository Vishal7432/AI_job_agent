import { Router } from "express";
import Job from "../models/Job.js";
import { runDiscovery } from "../services/discovery.service.js";
import { runScoring } from "../../scoring.service.js";

const router = Router();

router.post("/discover", async (req, res) => {
  const summary = await runDiscovery();
  res.json(summary);
});

router.get("/", async (req, res) => {
  const { status } = req.query;
  const jobs = await Job.find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(jobs);
});

router.post("/score", async (req, res) => {
  const summary = await runScoring();
  res.json(summary);
});

export default router;
