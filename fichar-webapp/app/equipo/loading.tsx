import { ListSkeleton } from "@/components/skeletons";

export default function TeamLoading() {
  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card skeleton" style={{ height: 200 }} />
      <ListSkeleton rows={4} />
    </div>
  );
}
