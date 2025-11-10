import { MetricsSkeleton, ListSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div style={{ padding: 32 }}>
      <div className="card highlight skeleton" style={{ height: 160, marginBottom: 32 }} />
      <MetricsSkeleton />
      <div className="grid two-columns" style={{ marginTop: 24 }}>
        <ListSkeleton rows={4} />
        <ListSkeleton rows={4} />
      </div>
    </div>
  );
}
