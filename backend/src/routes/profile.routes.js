import { Router } from "express";
import { z } from "zod";
import Profile from "../models/Profile.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const profileSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  targetRoles: z.array(z.string()).default([]),
  targetLocations: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().min(0).default(0),
  expectedCTC: z.string().optional(),
  noticePeriod: z.string().optional(),
  resumeText: z.string().optional(),
  blockedCompanies: z.array(z.string()).default([]),
});

// Profile dekhna
router.get("/", async (req, res) => {
  const profile = await Profile.findOne();
  res.json(profile);
});

// Profile create/update (ek hi profile hogi, isliye upsert)
router.put("/", validate(profileSchema), async (req, res) => {
  const profile = await Profile.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
  });
  res.json(profile);
});

export default router;
