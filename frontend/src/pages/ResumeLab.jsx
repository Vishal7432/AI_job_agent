import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { api, postJson } from "../api/client";

const VERDICT = {
  auto: {
    cls: "good",
    title: "Auto lane",
    text: "Match auto limit se upar hai. Ye job top priority mein rakho.",
  },
  review: {
    cls: "warn",
    title: "Review lane",
    text: "Achha match hai. Padh ke approve karo aur apply karo.",
  },
  skip: {
    cls: "bad",
    title: "Skip",
    text: "Match kam hai. Is job mein time mat lagao.",
  },
  unknown: {
    cls: "",
    title: "Match n/a",
    text: "JD mein skills kam mile, isliye match % reliable nahi.",
  },
};

export default function ResumeLab() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/profile")
      .then((p) => setResumeText(p?.resumeText || ""))
      .catch(() => {});
    api("/jobs?status=scored&sort=score")
      .then(setJobs)
      .catch(() => {});
  }, []);

  const analyze = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(
        await postJson("/resume/analyze", {
          resumeText,
          jdText,
          jobId: jobId || undefined,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const v = result ? VERDICT[result.verdict] : null;

  return (
    <>
      <h1 className="page-title">Resume lab</h1>
      <p className="muted">
        Resume aur job description daalo, ATS score, JD match aur improvement
        tips milenge. Ye keyword aur resume-health par based hai, kisi company
        ke asli ATS ka score nahi.
      </p>

      {error && <div className="msg error">{error}</div>}

      <div className="lab-grid">
        <div>
          <h2>Resume (text)</h2>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Resume ka text yahan paste karo"
          />
        </div>
        <div>
          <h2>Job description</h2>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">Ya apni scored jobs mein se chuno…</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.company} · {j.title} ({j.matchScore})
              </option>
            ))}
          </select>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Ya JD yahan paste karo (paste kiya to wahi use hoga)"
          />
        </div>
      </div>

      <button className="btn-primary" disabled={busy} onClick={analyze}>
        {busy ? "Check ho raha hai…" : "Analyze karo"}
      </button>

      {result && (
        <>
          {result.job && (
            <p className="muted">
              Job: {result.job.company} · {result.job.title}
            </p>
          )}

          <div className="stats">
            <div className="stat">
              <div>
                <div className="stat-value">{result.atsScore}</div>
                <div className="stat-label">ATS score (out of 100)</div>
              </div>
            </div>
            <div className="stat">
              <div>
                <div className="stat-value">
                  {result.matchPct === null ? "n/a" : `${result.matchPct}%`}
                </div>
                <div className="stat-label">JD match</div>
              </div>
            </div>
            <div className={`stat verdict ${v.cls}`}>
              <div>
                <div className="stat-value small-val">{v.title}</div>
                <div className="stat-label">{v.text}</div>
              </div>
            </div>
          </div>

          {result.notes.map((n) => (
            <div className="msg" key={n}>
              {n}
            </div>
          ))}

          <div className="panel">
            <h2>Skills jo match hui</h2>
            <div className="chips">
              {result.matched.length === 0 && (
                <span className="muted">Koi nahi</span>
              )}
              {result.matched.map((s) => (
                <span className="chip good" key={s}>
                  {s}
                </span>
              ))}
            </div>
            <h2 style={{ marginTop: 16 }}>
              JD mein hain par resume mein nahi dikhi
            </h2>
            <div className="chips">
              {result.missing.length === 0 && (
                <span className="muted">Koi nahi</span>
              )}
              {result.missing.map((s) => (
                <span className="chip bad" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="panel">
              <h2>Improvement tips</h2>
              {result.tips.length === 0 && (
                <p className="muted">Sab theek hai.</p>
              )}
              <ul className="tiplist">
                {result.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h2>Resume checks</h2>
              <ul className="checks">
                {result.checks.map((c) => (
                  <li key={c.text} className={c.ok ? "ok" : "no"}>
                    {c.ok ? <Check size={16} /> : <X size={16} />} {c.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
}
