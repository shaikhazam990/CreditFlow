const EmptyState = ({ title, description, action }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    minHeight: 240, gap: "var(--space-3)", textAlign: "center",
    border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
    padding: "var(--space-12)",
    background: "var(--color-surface)",
  }}>
    <div style={{ fontSize: 36, opacity: 0.2 }}>◻</div>
    <div style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-medium)", color: "var(--color-text-primary)" }}>{title}</div>
    {description && <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", maxWidth: 320 }}>{description}</div>}
    {action && (
      <button className="btn btn--secondary btn--sm" onClick={action.onClick} style={{ marginTop: "var(--space-2)" }}>
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
