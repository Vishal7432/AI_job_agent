import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

let client;
const getClient = () => (client ??= new Anthropic()); // ANTHROPIC_API_KEY .env se khud padhta hai

const resultSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string(),
  missingSkills: z.array(z.string()).default([]),
});

// Greenhouse description HTML hota hai, usse plain text banate hain
const cleanText = (html = "") =>
  html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function scoreJob(profile, job) {
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

  const res = await getClient().messages.create({
    model: process.env.MATCH_MODEL || "claude-haiku-5-5",
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return resultSchema.parse(JSON.parse(json));
}
