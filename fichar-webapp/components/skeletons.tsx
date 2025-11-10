export function MetricsSkeleton() {
  return (
    <section className="grid metrics-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className="card">
          <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 32, width: "60%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: "50%" }} />
        </article>
      ))}
    </section>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card">
      <div className="skeleton" style={{ height: 18, width: "30%", marginBottom: 24 }} />
      <ul className="activity-list">
        {Array.from({ length: rows }).map((_, index) => (
          <li key={index} className="skeleton" style={{ height: 64 }} />
        ))}
      </ul>
    </div>
  );
}
