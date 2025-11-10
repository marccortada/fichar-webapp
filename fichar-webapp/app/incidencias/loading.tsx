import { ListSkeleton } from "@/components/skeletons";

export default function IssuesLoading() {
  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card skeleton" style={{ height: 160 }} />
      <ListSkeleton rows={5} />
    </div>
  );
}
