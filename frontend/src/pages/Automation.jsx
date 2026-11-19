import { useState } from "react";
import { post } from "../api/client";

const STEPS = [
  {
    id: "discover",
    number: "1",
    title: "Find job openings",
    description:
      "Check configured job boards and save new openings that match your profile.",
    button: "Discover jobs",
    runningLabel: "Finding jobs...",
    run: () => post("/jobs/discover"),
    summarize: (result) =>
      `${result.newJobsSaved} new jobs saved · ${result.relevant} relevant from ${result.fetched} found`,
  },
  {
    id: "score",
    number: "2",
    title: "Match jobs to your profile",
    description:
      "Compare new jobs with your resume and show the strongest matches.",
    button: "Score jobs",
    runningLabel: "Scoring jobs...",
    run: () => post("/jobs/score?limit=300"),
    summarize: (result) =>
      `${result.goodMatches} strong matches · ${result.skipped} below your match threshold · ${result.processed} checked`,
  },
  {
    id: "queue",
    number: "3",
    title: "Review your matches",
    description:
      "Move scored matches to your approval queue. Nothing is submitted automatically.",
    button: "Add matches to approval queue",
    runningLabel: "Adding matches...",
    run: () => post("/applications/queue"),
    summarize: (result) =>
      result.queued > 0
        ? `${result.queued} ${result.queued === 1 ? "job" : "jobs"} added to your approval queue.`
        : "No new scored jobs were waiting to be queued.",
  },
];

const INITIAL_PROGRESS = Object.fromEntries(
  STEPS.map(({ id }) => [id, { status: "idle" }]),
);

const STATUS_LABELS = {
  idle: "Not started",
  running: "In progress",
  completed: "Completed",
  warning: "Completed with warnings",
  failed: "Needs attention",
};

export default function Automation() {
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [runningStep, setRunningStep] = useState(null);

  const runStep = async (step) => {
    setRunningStep(step.id);
    setProgress((current) => ({
      ...current,
      [step.id]: { status: "running" },
    }));

    try {
      const result = await step.run();
      const errors = Array.isArray(result.errors) ? result.errors : [];
      setProgress((current) => ({
        ...current,
        [step.id]: {
          status: errors.length ? "warning" : "completed",
          summary: step.summarize(result),
          errors,
        },
      }));
    } catch (error) {
      setProgress((current) => ({
        ...current,
        [step.id]: { status: "failed", error: error.message },
      }));
    } finally {
      setRunningStep(null);
    }
  };

  return (
    <section className="automation">
      <h1 className="page-title">Job search automation</h1>
      <p className="automation-intro">
        Find jobs, match them to your profile, then choose which ones to review.
      </p>

      <p className="automation-safety">
        You stay in control: this only adds jobs to your approval queue. It
        never applies for you.
      </p>

      <div className="automation-steps">
        {STEPS.map((step) => {
          const item = progress[step.id];
          const isRunning = runningStep === step.id;

          return (
            <article
              className={`automation-step ${item.status}`}
              key={step.id}
            >
              <div className="automation-step-heading">
                <span className="automation-step-number">{step.number}</span>
                <div className="automation-step-copy">
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
                <span className={`automation-status ${item.status}`}>
                  {STATUS_LABELS[item.status]}
                </span>
              </div>

              <button
                className={step.id === "queue" ? "btn-primary" : ""}
                disabled={runningStep !== null}
                onClick={() => runStep(step)}
              >
                {isRunning ? step.runningLabel : step.button}
              </button>

              {item.summary && (
                <p className="automation-result" role="status">
                  {item.summary}
                </p>
              )}
              {item.error && (
                <p className="automation-result error" role="alert">
                  {item.error}
                </p>
              )}
              {item.errors?.length > 0 && (
                <details className="automation-warnings">
                  <summary>
                    {item.errors.length} job source
                    {item.errors.length === 1 ? "" : "s"} had a problem
                  </summary>
                  <ul>
                    {item.errors.map((error, index) => (
                      <li key={`${index}-${error}`}>{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
