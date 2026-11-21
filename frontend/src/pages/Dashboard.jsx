import { useEffect, useState } from "react";
import {
  Send,
  CheckCircle2,
  XCircle,
  Hourglass,
  ArrowRight,
} from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import Donut from "../components/Donut";
import { Star } from "lucide-react";
import Robot from "../components/Robot";

const LABEL = {
  applied: "Applied",
  approved: "Approved",
  rejected: "Rejected",
};

const fetchStats = (period = "all") =>
  api(`/stats?period=${encodeURIComponent(period)}`);

function CompanyLogo({ company }) {
  const domain = company?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const [showImage, setShowImage] = useState(Boolean(domain));

  return (
    <span className="match-logo">
      {!showImage && (
        <span className="match-logo-fallback" aria-hidden="true">
          {company?.trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
      {showImage && (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}.com&sz=64`}
          alt=""
          aria-hidden="true"
          onError={() => setShowImage(false)}
        />
      )}
    </span>
  );
}

function timeAgo(date) {
  const mins = Math.round((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} day ago`;
}

export default function Dashboard({ go }) {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const retryStats = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchStats(period));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchStats(period)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period]);

  if (error)
    return (
      <div className="msg error" role="alert">
        <p>Stats load nahi hue: {error}</p>
        <button onClick={retryStats} disabled={loading}>
          Retry
        </button>
      </div>
    );
  if (loading || !data) return <p className="muted">Loading...</p>;

  const { counts, scoredJobs, recent, topMatches } = data;
  const decided = counts.approved + counts.applied + counts.rejected;
  const rate = decided
    ? Math.round(((counts.approved + counts.applied) / decided) * 100)
    : 0;

  let heroText =
    "Abhi koi job queue mein nahi hai. Automation page se Discover aur Score chalao.";
  if (counts.pending > 0)
    heroText = `${counts.pending} jobs tumhare approval ka wait kar rahi hain.`;
  else if (scoredJobs > 0)
    heroText = `${scoredJobs} scored jobs ready hain. Unhe queue mein daalke approve karo.`;

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Your AI Job Agent is working for you!</h1>
          <p>
            {heroText} Final apply tum khud karoge, taaki accounts safe rahein.
          </p>
          <button className="btn-primary" onClick={() => go("jobs")}>
            View approval queue <ArrowRight size={16} />
          </button>
        </div>
        <div className="hero-art">
          <span className="tag">Get Hired Faster!</span>
          <Robot />
        </div>
      </section>

      <section className="stats">
        <StatCard
          icon={Send}
          tone="violet"
          value={counts.applied}
          label="Applied"
        />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          value={counts.approved}
          label="Approved"
        />
        <StatCard
          icon={XCircle}
          tone="red"
          value={counts.rejected}
          label="Rejected"
        />
        <StatCard
          icon={Hourglass}
          tone="blue"
          value={counts.pending}
          label="Waiting for approval"
        />
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2>Recent activity</h2>
          {recent.length === 0 && (
            <p className="muted">Abhi koi activity nahi.</p>
          )}
          {recent.map((a) => {
            const Icon =
              a.status === "rejected"
                ? XCircle
                : a.status === "approved"
                  ? Star
                  : CheckCircle2;
            return (
              <div className="activity" key={a._id}>
                <div className={`act-icon ${a.status}`}>
                  <Icon size={18} />
                </div>
                <div className="act-body">
                  <div className="activity-title">{a.job?.title}</div>
                  <div className="muted small">
                    {a.job?.company} · {timeAgo(a.updatedAt)}
                  </div>
                </div>
                <span className={`pill ${a.status}`}>
                  {LABEL[a.status] || a.status}
                </span>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h2>Application summary</h2>
            <label className="period-control">
              <span className="sr-only">Application summary time period</span>
              <select
                value={period}
                onChange={(event) => {
                  setLoading(true);
                  setError(null);
                  setPeriod(event.target.value);
                }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </label>
          </div>
          <div className="summary">
            <Donut
              label={`${rate}%`}
              sub="Approval rate"
              segments={[
                { label: "Applied", value: counts.applied, color: "#5b3fd9" },
                { label: "Approved", value: counts.approved, color: "#22c55e" },
                { label: "Rejected", value: counts.rejected, color: "#ef4444" },
              ]}
            />
            <ul className="legend">
              <li>
                <i style={{ background: "#5b3fd9" }} />
                Applied <b>{counts.applied}</b>
              </li>
              <li>
                <i style={{ background: "#22c55e" }} />
                Approved <b>{counts.approved}</b>
              </li>
              <li>
                <i style={{ background: "#ef4444" }} />
                Rejected <b>{counts.rejected}</b>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading matches-panel-heading">
          <h2>Top job matches</h2>
          <button
            className="view-more"
            onClick={() => go("jobs", "jobs")}
            aria-label="View more scored job matches"
          >
            View more <ArrowRight size={15} />
          </button>
        </div>
        {topMatches.length === 0 && (
          <p className="muted">Pehle jobs score karo.</p>
        )}
        <div className="matches">
          {topMatches.map((j) => (
            <a
              className="match"
              key={j._id}
              href={j.url}
              target="_blank"
              rel="noreferrer"
            >
              <div className="match-heading">
                <CompanyLogo company={j.company} />
                <div className="match-copy">
                  <div className="match-title">{j.title}</div>
                  <div className="muted small">
                    {j.company} · {j.location || "n/a"}
                  </div>
                </div>
              </div>
              <span className="pill applied">{j.matchScore}% match</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
