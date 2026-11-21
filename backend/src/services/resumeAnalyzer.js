const SKILLS = {
  javascript: ["javascript", "es6"],
  typescript: ["typescript"],
  react: ["react", "react.js", "reactjs"],
  redux: ["redux"],
  "next.js": ["next.js", "nextjs"],
  "node.js": ["node.js", "nodejs", "node"],
  express: ["express", "express.js", "expressjs"],
  mongodb: ["mongodb", "mongo"],
  mysql: ["mysql"],
  postgresql: ["postgresql", "postgres"],
  sql: ["sql"],
  java: ["java"],
  spring: ["spring boot", "spring framework"],
  python: ["python"],
  django: ["django"],
  flask: ["flask"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  tailwind: ["tailwind"],
  git: ["git", "github"],
  docker: ["docker"],
  kubernetes: ["kubernetes", "k8s"],
  aws: ["aws", "amazon web services"],
  azure: ["azure"],
  gcp: ["gcp", "google cloud"],
  "rest api": ["restful", "rest api"],
  graphql: ["graphql"],
  jwt: ["jwt"],
  microservices: ["microservices"],
  "ci/cd": ["ci/cd", "jenkins", "github actions"],
  linux: ["linux"],
  redis: ["redis"],
  kafka: ["kafka"],
  agile: ["agile", "scrum"],
  testing: ["jest", "junit", "unit testing", "test-driven"],
  dsa: ["data structures", "dsa", "algorithms"],
  oop: ["oop", "oops", "object-oriented", "object oriented"],
  "c++": ["c++"],
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (text, alts) =>
  alts.some((a) => new RegExp(`(?<![a-z0-9])${esc(a)}(?![a-z0-9])`).test(text));

// Greenhouse description HTML hota hai, usse plain text banate hain
const stripHtml = (html = "") =>
  html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function analyzeResume({
  resumeText,
  jdText = "",
  experienceYears = 0,
}) {
  const auto = Number(process.env.AUTO_APPLY_MIN) || 80;
  const review = Number(process.env.REVIEW_MIN) || 70;

  const resume = resumeText.toLowerCase();
  const jd = stripHtml(jdText).toLowerCase();

  // ---------- 1. Resume health (65 points) ----------
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const bullets = lines.filter((l) => /^[•\-*●▪]/.test(l));
  const numberedBullets = bullets.filter((l) => /\d/.test(l));
  const words = resumeText.split(/\s+/).filter(Boolean).length;

  const checks = [];
  let health = 0;
  const check = (ok, pts, pass, fail) => {
    if (ok) health += pts;
    checks.push({ ok, text: ok ? pass : fail });
  };

  check(
    /[\w.+-]+@[\w-]+\.[\w.]+/.test(resumeText),
    5,
    "Email mila",
    "Email address resume mein dikh nahi raha",
  );
  check(
    /\+?\d[\d\s-]{8,}\d/.test(resumeText),
    5,
    "Phone number mila",
    "Phone number dikh nahi raha",
  );
  check(
    /(linkedin|github)/.test(resume),
    5,
    "LinkedIn/GitHub link mila",
    "LinkedIn ya GitHub link jodo",
  );
  check(
    /skills/.test(resume),
    5,
    "Skills section mila",
    "'Technical Skills' naam ka section jodo",
  );
  check(
    /(experience|internship|work history)/.test(resume),
    5,
    "Experience/Internship section mila",
    "'Experience' ya 'Internship' section jodo",
  );
  check(
    /education/.test(resume),
    5,
    "Education section mila",
    "'Education' section jodo",
  );
  check(
    /projects?/.test(resume),
    5,
    "Projects section mila",
    "'Projects' section jodo",
  );
  check(
    words >= 300 && words <= 900,
    10,
    `Length theek hai (${words} words)`,
    `Resume ${words} words ka hai. 300 se 900 ke beech rakho (fresher ke liye 1 page)`,
  );
  check(
    bullets.length >= 6,
    10,
    "Bullet points use hue hain",
    "Kaam ko bullet points mein likho (kam se kam 6). PDF se copy karne par bullets kat sakte hain, to check kar lena",
  );
  check(
    numberedBullets.length >= 3,
    10,
    "Numbers/impact wale bullets hain",
    "Kam se kam 3 bullets mein numbers jodo (jaise 'API response time 40% kam kiya')",
  );

  // ---------- 2. JD match ----------
  const required = Object.keys(SKILLS).filter((k) => has(jd, SKILLS[k]));
  const matched = required.filter((k) => has(resume, SKILLS[k]));
  const missing = required.filter((k) => !has(resume, SKILLS[k]));
  const reliable = required.length >= 3;

  const expMatches = [
    ...jd.matchAll(
      /(\d+)\s*(?:\+|-\s*\d+|to\s*\d+)?\s*(?:years|yrs)\s*(?:of\s*)?(?:relevant\s*|professional\s*|industry\s*|hands-on\s*|software\s*|work\s*)?(?:experience|exp)/g,
    ),
  ].map((m) => Number(m[1]));
  const minYears = expMatches.length ? Math.min(...expMatches) : 0;

  let matchPct = reliable
    ? Math.round((100 * matched.length) / required.length)
    : null;
  const notes = [];
  if (matchPct !== null && minYears > experienceYears + 1) {
    matchPct = Math.min(matchPct, 40);
    notes.push(
      `JD mein ${minYears}+ saal ka experience maanga hai, isliye match 40% par cap kiya`,
    );
  }
  if (jd && !reliable)
    notes.push(
      "JD mein tech skills kam mile, isliye match % reliable nahi hai",
    );

  // ---------- 3. ATS score ----------
  const healthPct = Math.round((health / 65) * 100);
  const atsScore = reliable
    ? health + Math.round(35 * (matched.length / required.length))
    : healthPct;

  // ---------- 4. Tips ----------
  const tips = checks.filter((c) => !c.ok).map((c) => c.text);
  if (missing.length) {
    tips.push(
      `JD mein ye skills hain jo resume mein nahi dikhi: ${missing.join(", ")}. Jo tumhe sach mein aati hain wahi add karo, baaki mat likho`,
    );
  }

  // ---------- 5. Lane ----------
  let verdict = "unknown";
  if (matchPct !== null)
    verdict =
      matchPct >= auto ? "auto" : matchPct >= review ? "review" : "skip";

  return {
    atsScore,
    healthScore: healthPct,
    matchPct,
    reliable,
    matched,
    missing,
    minYears,
    verdict,
    thresholds: { auto, review },
    checks,
    tips,
    notes,
  };
}
