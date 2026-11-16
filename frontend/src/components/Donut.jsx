export default function Donut({ segments, label, sub }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg
      viewBox="0 0 140 140"
      width="170"
      height="170"
      role="img"
      aria-label={`${label} ${sub}`}
    >
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="var(--track)"
        strokeWidth="16"
      />
      {total > 0 &&
        segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
            />
          );
          offset += len;
          return el;
        })}
      <text x="70" y="68" textAnchor="middle" className="donut-main">
        {label}
      </text>
      <text x="70" y="86" textAnchor="middle" className="donut-sub">
        {sub}
      </text>
    </svg>
  );
}
