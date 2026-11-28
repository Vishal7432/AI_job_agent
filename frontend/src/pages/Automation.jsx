import { useEffect, useState } from "react";
import {
  Search,
  UserRound,
  Send,
  Zap,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CircleCheck,
  Target,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { api, post } from "../api/client";
import Robot from "../components/Robot";

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
  const [stats, setStats] = useState({
    jobsAdded: 0,
    pending: 0,
    applied: 0,
  });

  useEffect(() => {
    api("/stats")
      .then((data) =>
        setStats({
          jobsAdded:
            (data.counts?.approved || 0) + (data.counts?.applied || 0),
          pending: data.counts?.pending || 0,
          applied: data.counts?.applied || 0,
        }),
      )
      .catch(() => {});
  }, []);

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
      <div className="automation-hero">
        <div className="automation-hero-copy">
          <div className="automation-hero-title">
            <span className="automation-bolt"><Zap size={24} fill="currentColor" /></span>
            <h1>Job Search <strong>Automation</strong></h1>
          </div>
          <p>Find jobs, match them to your profile, then choose which ones to review.</p>
          <div className="automation-safety">
            <CircleCheck size={15} />
            <span>You stay in control: this only adds jobs to your approval queue. It never applies for you.</span>
          </div>
        </div>
        <div className="automation-hero-art">
          <div className="hero-float-badge first"><BriefcaseBusiness size={28} /></div>
          <Robot />
          <div className="hero-float-badge second"><Sparkles size={22} /></div>
        </div>
      </div>

      <div className="automation-layout">
        <div className="automation-steps">
          {STEPS.map((step) => {
            const item = progress[step.id];
            const isRunning = runningStep === step.id;
            const Icon =
              step.id === "discover"
                ? Search
                : step.id === "score"
                  ? UserRound
                  : Send;

            return (
              <article className={`automation-step ${item.status}`} key={step.id}>
                <span className={`automation-step-icon ${step.id}`}>
                  <Icon size={27} strokeWidth={2.2} />
                </span>

                <div className="automation-step-body">
                  <div className="automation-step-heading">
                    <span className="automation-step-number">{step.number}</span>
                    <h2>{step.title}</h2>
                  </div>
                  <p>{step.description}</p>
                  <button
                    className="automation-run"
                    disabled={runningStep !== null}
                    onClick={() => runStep(step)}
                  >
                    {isRunning ? step.runningLabel : step.button}
                    {!isRunning && <ArrowRight size={15} />}
                  </button>

                  {item.summary && (
                    <p className="automation-result" role="status">{item.summary}</p>
                  )}
                  {item.error && (
                    <p className="automation-result error" role="alert">{item.error}</p>
                  )}
                  {item.errors?.length > 0 && (
                    <details className="automation-warnings">
                      <summary>{item.errors.length} job source{item.errors.length === 1 ? "" : "s"} had a problem</summary>
                      <ul>{item.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>
                    </details>
                  )}
                </div>

                <span className={`automation-status ${item.status}`}>
                  <CheckCircle2 size={13} />
                  {item.status === "idle" ? "Ready to use" : STATUS_LABELS[item.status]}
                </span>
              </article>
            );
          })}
        </div>

        <aside className="automation-side">
          <section className="automation-stats">
            <h2><TrendingUp size={17} /> Automation Stats</h2>
            <div className="automation-stat">
              <span>
                <strong>{stats.jobsAdded}</strong>
                <small>Jobs Added</small>
              </span>
              <span className="spark-bars" aria-hidden="true">
                <i /><i /><i /><i /><i />
              </span>
            </div>
            <div className="automation-stat-row">
              <span><strong>{stats.pending}</strong><small>Pending Review</small></span>
              <Clock3 size={17} />
            </div>
            <div className="automation-stat-row">
              <span><strong>{stats.applied}</strong><small>Applied</small></span>
              <CheckCircle2 size={17} />
            </div>
          </section>

          <section className="automation-tips">
            <h2><Target size={17} /> Quick Tips</h2>
            <ul>
              <li><CheckCircle2 size={12} /><span>Keep your profile updated</span></li>
              <li><CheckCircle2 size={12} /><span>Review score thresholds</span></li>
              <li><CheckCircle2 size={12} /><span>Enhance your resume with relevant skills</span></li>
              <li><CheckCircle2 size={12} /><span>Let AI find the best matches for you</span></li>
            </ul>
          </section>
        </aside>
      </div>

      <section className="automation-learning">
        <span className="learning-icon"><Sparkles size={18} /></span>
        <div>
          <h2>Work Smarter, Not Harder</h2>
          <p>Let AI handle the search while you focus on what matters.</p>
        </div>
        <button onClick={() => runStep(STEPS[0])}>Learn More <ArrowRight size={14} /></button>
        <Target className="learning-target" size={42} />
      </section>
    </section>
  );
}
