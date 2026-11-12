import Job from "../models/Job.js";
import Profile from "../models/Profile.js";
import { fetchGreenhouse } from "./sources/greenhouse.js";
import { fetchLever } from "./sources/lever.js";
import {
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  TITLE_KEYWORDS,
  TITLE_EXCLUDE,
} from "../config/companies.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRelevant = (job, profile) => {
  const title = job.title.toLowerCase();
  const loc = job.location.toLowerCase();

  if (!TITLE_KEYWORDS.some((k) => title.includes(k))) return false;
  if (TITLE_EXCLUDE.some((k) => title.includes(k))) return false;

  // Location: remote, India, ya tumhari target locations
  const wanted = [
    ...profile.targetLocations.map((l) => l.toLowerCase()),
    "remote",
    "india",
  ];
  if (loc && !wanted.some((w) => loc.includes(w))) return false;

  if (
    profile.blockedCompanies
      .map((c) => c.toLowerCase())
      .includes(job.company.toLowerCase())
  )
    return false;

  return true;
};

export async function runDiscovery() {
  const profile = await Profile.findOne();
  if (!profile) throw new Error("Pehle profile save karo (PUT /api/profile)");

  const tasks = [
    ...GREENHOUSE_COMPANIES.map((c) => ({
      name: c,
      fn: () => fetchGreenhouse(c),
    })),
    ...LEVER_COMPANIES.map((c) => ({ name: c, fn: () => fetchLever(c) })),
  ];

  let fetched = 0,
    relevant = 0,
    saved = 0;
  const errors = [];

  for (const t of tasks) {
    try {
      const jobs = await t.fn();
      fetched += jobs.length;

      const good = jobs.filter((j) => isRelevant(j, profile));
      relevant += good.length;

      if (good.length) {
        // $setOnInsert = sirf nayi job insert hogi, purani ko chhedega nahi (dedup)
        const result = await Job.bulkWrite(
          good.map((j) => ({
            updateOne: {
              filter: { url: j.url },
              update: { $setOnInsert: j },
              upsert: true,
            },
          })),
        );
        saved += result.upsertedCount;
      }
    } catch (err) {
      errors.push(err.message); // ek company fail ho to baaki chalti rahe
    }
    await sleep(1000); // servers par pressure nahi, polite rehna
  }

  return { fetched, relevant, newJobsSaved: saved, errors };
}
