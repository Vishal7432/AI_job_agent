export default function JobCard({ job, children }) {
  return (
    <div className="card">
      <div className="card-top">
        <div>
          <div className="title">{job?.title}</div>
          <div className="meta">
            {job?.company} · {job?.location || "Location n/a"}
          </div>
        </div>
        <div className="score">{job?.matchScore}</div>
      </div>

      <div className="reason">{job?.matchReason}</div>

      <div className="actions">
        <a href={job?.url} target="_blank" rel="noreferrer">
          <button>Open job ↗</button>
        </a>
        {children}
      </div>
    </div>
  );
}
