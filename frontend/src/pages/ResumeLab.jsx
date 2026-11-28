import { useCallback, useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, FileUp, LoaderCircle, TrendingUp } from "lucide-react";
import { api, post, postJson } from "../api/client";

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 20;
const MAX_RESUME_TEXT = 12000;
const DAILY_INTERVAL = 24 * 60 * 60 * 1000;

async function extractResumeText(file) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please upload a PDF file.");
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new Error("PDF must be 10 MB or smaller.");
  }

  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const loadingTask = pdfjs.getDocument({
    data: await file.arrayBuffer(),
  });
  const document = await loadingTask.promise;

  try {
    if (document.numPages > MAX_PDF_PAGES) {
      throw new Error(`PDF must have ${MAX_PDF_PAGES} pages or fewer.`);
    }

    const pages = await Promise.all(
      Array.from({ length: document.numPages }, async (_, index) => {
        const page = await document.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
      }),
    );
    const text = pages.join("\n").trim();

    if (text.length < 100) {
      throw new Error(
        "No readable text found. Upload a text-based PDF, not a scanned image.",
      );
    }
    if (text.length > MAX_RESUME_TEXT) {
      throw new Error("Resume text is too long. Use a shorter PDF.");
    }

    return text;
  } finally {
    await loadingTask.destroy();
  }
}

export default function ResumeLab() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [automationActive, setAutomationActive] = useState(false);
  const [automationChecking, setAutomationChecking] = useState(false);
  const [automationStatus, setAutomationStatus] = useState("");
  const [error, setError] = useState(null);
  const runInProgress = useRef(false);

  const reviewResume = useCallback(async () => {
    const result = await postJson("/resume/match", { resumeText });
    setReview(result);
    return result;
  }, [resumeText]);

  useEffect(() => {
    if (!automationActive || !resumeText) return undefined;

    let active = true;
    const runDailyReview = async () => {
      if (runInProgress.current) return;
      runInProgress.current = true;
      setAutomationStatus("Finding new jobs and reviewing resume matches...");
      setError(null);

      try {
        await post("/jobs/discover");
        const result = await reviewResume();
        if (active) {
          setReview(result);
          setAutomationStatus(
            `Reviewed ${result.reviewedCount} jobs; found ${result.matchingCount} matches.`,
          );
        }
      } catch (e) {
        if (active) {
          setError(e.message);
          setAutomationStatus("Automation needs attention.");
        }
      } finally {
        runInProgress.current = false;
      }
    };

    runDailyReview();
    const timer = window.setInterval(runDailyReview, DAILY_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [automationActive, reviewResume, resumeText]);

  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setReview(null);
    setAutomationActive(false);
    setAutomationStatus("");

    try {
      const text = await extractResumeText(file);
      setResumeText(text);
      setFileName(file.name);
    } catch (e) {
      setResumeText("");
      setFileName("");
      setError(e.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const analyze = async () => {
    setBusy(true);
    setError(null);
    try {
      await reviewResume();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleAutomation = async (event) => {
    const enabled = event.target.checked;
    if (!enabled) {
      setAutomationActive(false);
      setAutomationStatus("Automation is off. No future runs will start.");
      return;
    }

    setError(null);
    setAutomationChecking(true);
    try {
      const status = await api("/resume/status");
      if (!status.aiConfigured) {
        throw new Error(
          "Configure ANTHROPIC_API_KEY in the backend before enabling AI automation.",
        );
      }
      setAutomationActive(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setAutomationChecking(false);
    }
  };

  return (
    <section className="resume-lab">
      <header className="resume-lab-heading">
        <div>
          <h1 className="page-title">Resume Lab</h1>
          <p className="muted">
            Upload a PDF to find the jobs that best match your resume.
          </p>
        </div>
        <div className="automation-control">
          <label className="automation-toggle">
            <span>
              <span className={`automation-indicator ${automationActive ? "active" : ""}`} />
              Automation {automationActive ? "Active" : "Off"}
            </span>
            <input
              type="checkbox"
              checked={automationActive}
              onChange={toggleAutomation}
              disabled={!resumeText || busy || automationChecking}
              aria-label="Enable daily resume matching automation"
            />
          </label>
          <p className="muted">
            Runs now, then daily while this page stays open. Turning it off or
            leaving the page stops future runs.
          </p>
        </div>
      </header>

      <div className="resume-lab-grid">
        <section className="panel resume-upload-panel">
          <h2>Resume PDF</h2>
          <p className="muted">
            PDF text is extracted in your browser. A review sends that text to
            your backend and Anthropic.
          </p>
          <label className="resume-upload">
            <FileUp size={24} aria-hidden="true" />
            <span>{fileName || "Choose a resume PDF"}</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={uploadResume}
              disabled={busy}
            />
          </label>
          {resumeText && (
            <p className="muted" role="status">
              PDF ready for review.
            </p>
          )}
          <button
            className="btn-primary resume-review-button"
            disabled={!resumeText || busy}
            onClick={analyze}
          >
            {busy ? (
              <>
                <LoaderCircle size={16} className="spin" /> Reviewing...
              </>
            ) : (
              "Review resume"
            )}
          </button>
        </section>

        <section className="panel resume-matches-panel" aria-live="polite">
          <div className="resume-matches-heading">
            <div>
              <h2>Matching jobs</h2>
              {review && (
                <p className="muted">
                  {review.matchingCount} matches from {review.reviewedCount} jobs reviewed
                </p>
              )}
            </div>
            <BriefcaseBusiness size={20} aria-hidden="true" />
          </div>
          {!review && (
            <p className="resume-empty muted">
              Upload your resume and select “Review resume” to see matching jobs.
            </p>
          )}
          {review?.matches.length === 0 && (
            <p className="resume-empty muted">
              No matching jobs found. Try again after discovering more jobs.
            </p>
          )}
          {review?.matches.map((job) => (
            <a
              className="resume-match"
              key={job.id}
              href={job.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="resume-match-icon" aria-hidden="true">
                <TrendingUp size={17} />
              </span>
              <span className="resume-match-copy">
                <strong>{job.title}</strong>
                <span className="muted">
                  {job.company}{job.location ? ` · ${job.location}` : ""}
                </span>
              </span>
              <strong className="resume-match-score">{job.score}%</strong>
            </a>
          ))}
          {automationStatus && (
            <p className="resume-automation-status" role="status">
              {automationStatus}
            </p>
          )}
        </section>
      </div>

      {error && (
        <p className="msg error" role="alert">
          {error}
        </p>
      )}

      <div className="resume-apply">
        <p className="muted">
          Greenhouse submission integration is not configured. Applications
          will not be submitted automatically.
        </p>
        <button disabled title="Available after authorized Greenhouse integration">
          Apply (integration pending)
        </button>
      </div>
    </section>
  );
}
