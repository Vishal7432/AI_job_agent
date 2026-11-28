import { useState } from "react";
import { ArrowUpRight, MapPin, Building2 } from "lucide-react";

export default function JobCard({ job, children }) {
  const companyInitial = job?.company?.trim().charAt(0).toUpperCase() || "?";
  const companyDomain = job?.company
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  const [showLogo, setShowLogo] = useState(Boolean(companyDomain));

  return (
    <article className="job-card">
      <div className="job-company-logo" aria-hidden="true">
        {showLogo ? (
          <img
            src={`https://www.google.com/s2/favicons?domain=${companyDomain}.com&sz=64`}
            alt=""
            loading="lazy"
            onError={() => setShowLogo(false)}
          />
        ) : (
          <span>{companyInitial}</span>
        )}
      </div>

      <div className="job-card-main">
        <div className="job-card-heading">
          <div className="job-title-wrap">
            <span className="job-new-label">New</span>
            <h2 className="job-title">{job?.title || "Untitled role"}</h2>
          </div>
        </div>

        <div className="job-company-meta">
          <span><Building2 size={12} /> {job?.company || "Company not listed"}</span>
          <span><MapPin size={12} /> {job?.location || "Location n/a"}</span>
        </div>

        <div className="job-tags">
          {job?.source && <span className="job-tag source">{job.source}</span>}
        </div>
      </div>

      <div className="job-card-actions">
        <div className="job-score">
          <strong>{job?.matchScore ?? "—"}</strong>
          <span>Match score</span>
        </div>
        <a className="job-action open" href={job?.url} target="_blank" rel="noreferrer">
          Open job <ArrowUpRight size={13} />
        </a>
        {children}
      </div>
    </article>
  );
}
