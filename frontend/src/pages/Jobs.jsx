import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  Rocket,
  Sparkles,
  X,
} from "lucide-react";
import { api, patch } from "../api/client";
import JobCard from "../components/JobCard";
import { useAction } from "../hooks/useAction";

const TABS = [
  { id: "queue", label: "Approval queue" },
  { id: "jobs", label: "Scored jobs" },
  { id: "pending_approval", label: "Pending approval" },
  { id: "approved", label: "Approved" },
  { id: "applied", label: "Applied" },
  { id: "rejected", label: "Rejected" },
];

async function loadJobsData(tab) {
  const [stats, scoredJobs] = await Promise.all([
    api("/stats"),
    api("/jobs?status=scored&sort=score"),
  ]);
  const applications =
    tab === "jobs"
      ? null
      : await api(`/applications${tab === "queue" ? "" : `?status=${tab}`}`);

  return { stats, scoredJobs, applications };
}

function getCounts(stats, scoredJobs) {
  return {
    scored: scoredJobs.length,
    pending_approval: stats.counts.pending,
    approved: stats.counts.approved,
    applied: stats.counts.applied,
    rejected: stats.counts.rejected,
  };
}

export default function Jobs({ query = "", initialTab = "queue" }) {
  const [tab, setTab] = useState(() => (query.trim() ? "jobs" : initialTab));
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [counts, setCounts] = useState({
    scored: 0,
    pending_approval: 0,
    approved: 0,
    applied: 0,
    rejected: 0,
  });

  const refresh = useCallback(async () => {
    try {
      const { stats, scoredJobs, applications } = await loadJobsData(tab);
      setLoadError(null);
      setCounts(getCounts(stats, scoredJobs));
      if (tab === "jobs") {
        setJobs(scoredJobs);
      } else {
        setApps(applications);
      }
    } catch (e) {
      setLoadError(e.message);
    }
  }, [tab]);

  const { msg, busy, run } = useAction(refresh);
  const search = query.trim().toLowerCase();
  const matchesSearch = (job) =>
    !search ||
    [job?.title, job?.company, job?.location].some((value) =>
      value?.toLowerCase().includes(search),
    );
  const visibleJobs = jobs.filter(matchesSearch);
  const visibleApps = apps.filter((application) =>
    matchesSearch(application.job),
  );

  useEffect(() => {
    let active = true;
    loadJobsData(tab)
      .then(({ stats, scoredJobs, applications }) => {
        if (!active) return;
        setLoadError(null);
        setCounts(getCounts(stats, scoredJobs));
        if (tab === "jobs") setJobs(scoredJobs);
        else setApps(applications);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, [tab]);

  const totalPipelineJobs =
    counts.scored +
    counts.pending_approval +
    counts.approved +
    counts.applied +
    counts.rejected;

  return (
    <section className="jobs-page">
      <header className="jobs-hero">
        <div className="jobs-hero-copy">
          <span className="jobs-hero-icon"><BriefcaseBusiness size={26} /></span>
          <div>
            <h1>Jobs and queue</h1>
            <p>Manage your job approvals and track the automation pipeline.</p>
          </div>
        </div>
        <div className="jobs-hero-art" aria-hidden="true">
          <div className="jobs-found-badge">
            <Sparkles size={16} />
            <span>Jobs in pipeline<strong>{totalPipelineJobs}</strong></span>
          </div>
          <Rocket className="jobs-rocket" size={38} />
        </div>
      </header>

      {loadError && <div className="msg error">{loadError}</div>}
      {msg && (
        <div className={`msg ${msg.type === "error" ? "error" : ""}`}>
          {msg.text}
        </div>
      )}

      <nav className="jobs-tabs" aria-label="Filter jobs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {id === "queue" && <Rocket size={14} />}
            {id === "approved" && <Check size={14} />}
            {id === "applied" && <CheckCircle2 size={14} />}
            {id === "rejected" && <X size={14} />}
            {label}
            {id !== "queue" && (
              <span className="jobs-tab-count">
                {counts[id === "jobs" ? "scored" : id]}
              </span>
            )}
            {id === "queue" && (
              <span className="jobs-tab-count">{counts.pending_approval}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === "jobs" && (
        <>
          {visibleJobs.length === 0 && (
            <p className="jobs-empty">
              {search
                ? "No scored jobs match your search."
                : "No scored jobs yet. Run automation to discover and score jobs."}
            </p>
          )}
          {visibleJobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </>
      )}

      {tab !== "jobs" && (
        <>
          {visibleApps.length === 0 && (
            <p className="jobs-empty">
              {search
                ? "No applications match your search."
                : tab === "queue"
                  ? "Your approval queue is empty. Score jobs and add matches to the queue."
                  : `No ${tab.replace("_", " ")} applications yet.`}
            </p>
          )}

          {visibleApps.map((application) => (
            <JobCard key={application._id} job={application.job}>
              {application.status === "pending_approval" && (
                <>
                  <button
                    className="job-action approve"
                    disabled={busy}
                    onClick={() =>
                      run("Approve", () =>
                        patch(`/applications/${application._id}/approve`),
                      )
                    }
                  >
                    Approve <Check size={13} />
                  </button>
                  <button
                    className="job-action reject"
                    disabled={busy}
                    onClick={() =>
                      run("Reject", () =>
                        patch(`/applications/${application._id}/reject`),
                      )
                    }
                  >
                    Reject <X size={13} />
                  </button>
                </>
              )}
              {application.status === "approved" && (
                <button
                  className="job-action approve"
                  disabled={busy}
                  onClick={() =>
                    run("Mark applied", () =>
                      patch(`/applications/${application._id}/applied`),
                    )
                  }
                >
                  Maine apply kar diya <ArrowRight size={13} />
                </button>
              )}
              <span className={`job-status-pill ${application.status}`}>
                {application.status.replace("_", " ") === "pending approval" && <Clock3 size={12} />}
                {application.status.replace("_", " ")}
              </span>
            </JobCard>
          ))}
        </>
      )}
    </section>
  );
}
