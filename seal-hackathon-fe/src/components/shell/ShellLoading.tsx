// The identical "verifying access" spinner previously duplicated in
// admin/layout.tsx, dashboard/layout.tsx, and mentor/layout.tsx.
export default function ShellLoading({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--color-bg, #0f0f1a)",
        color: "var(--color-text-2, #a0aec0)",
        flexDirection: "column",
        gap: "1rem",
        fontSize: "0.95rem",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid rgba(99,102,241,0.3)",
          borderTop: "3px solid var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      {label}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
