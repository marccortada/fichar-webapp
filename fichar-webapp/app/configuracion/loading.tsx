export default function SettingsLoading() {
  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card skeleton" style={{ height: 180 }} />
      <div className="card skeleton" style={{ height: 320 }} />
    </div>
  );
}
