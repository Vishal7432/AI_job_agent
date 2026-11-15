import { z } from "zod";

const resultSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string(),
  missingSkills: z.array(z.string()).default([]),
});

const cleanText = (html = "") =>
  html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ---------- LOCAL SCORER (free, bina AI) ----------
const KEYWORDS = [
  "react",
  "node",
  "express",
  "mongodb",
  "javascript",
  "typescript",
  "java",
  "html",
  "css",
  "tailwind",
  "mysql",
  "sql",
  "python",
  "git",
  "docker",
  "aws",
  "redux",
  "next.js",
  "graphql",
];

const has = (text, word) =>
  new RegExp(`(^|[^a-z])${word.replace(".", "\\.")}([^a-z]|$)`).test(text);

export function localScore(profile, job) {
  const jd = cleanText(job.description).toLowerCase();
  const title = job.title.toLowerCase();
  const resume = profile.resumeText.toLowerCase();

  const required = KEYWORDS.filter((k) => has(jd, k));
  const matched = required.filter((k) => has(resume, k));
  const missing = required.filter((k) => !has(resume, k));

  let score = required.length
    ? Math.round((60 * matched.length) / required.length)
    : 20;

  if (
    /(software|developer|full.?stack|front.?end|back.?end|sde|web)/.test(title)
  )
    score += 15;
  if (
    /(intern|graduate|entry|junior|new grad|associate)/.test(title + " " + jd)
  )
    score += 15;

  // "3+ years" jaisi cheez mile to fresher ke liye score gira do
  const years = [...jd.matchAll(/(\d+)\+?\s*(?:years|yrs)/g)].map((m) =>
    Number(m[1]),
  );
  const maxYears = years.length ? Math.max(...years) : 0;
  if (maxYears >= 2) score = Math.min(score, 35);

  score = Math.min(score, 100);
  return {
    score,
    reason: `Matched: ${matched.join(", ") || "none"}${maxYears ? ` | Experience mentioned: ${maxYears}+ yrs` : ""}`,
    missingSkills: missing,
  };
}

// ---------- CLAUDE SCORER (credits aane par) ----------
async function claudeScore(profile, job) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk"); // sirf tab load hoga jab chahiye
  const client = new Anthropic();

  const prompt = `Tum ek strict recruiter ho. Candidate ke resume ko job se compare karke score do.

RULES:
- Sirf resume mein likhi cheezon ko hi candidate ki skill maano. Kuch invent mat karo.
- Candidate ek fresher hai (${profile.experienceYears} years experience). Agar job mein 2+ years experience maanga hai, score 40 se neeche rakho.
- Target roles: ${profile.targetRoles.join(", ")}
- Sirf JSON return karo, aur kuch nahi, is format mein:
{"score": 0-100, "reason": "2 line mein kyu", "missingSkills": ["skill1"]}

RESUME:
${profile.resumeText.slice(0, 6000)}

JOB TITLE: ${job.title}
COMPANY: ${job.company}
LOCATION: ${job.location}
JOB DESCRIPTION:
${cleanText(job.description).slice(0, 6000)}`;

  const res = await client.messages.create({
    model: process.env.MATCH_MODEL || "claude-haiku-5-5",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return resultSchema.parse(JSON.parse(json));
}

// ---------- Switch ----------
export async function scoreJob(profile, job) {
  const useClaude =
    process.env.MATCH_MODE === "claude" && process.env.ANTHROPIC_API_KEY;
  return useClaude ? claudeScore(profile, job) : localScore(profile, job);
}
