const InvoiceCard = ({ label, value, sub, accent }) => (
  <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
    <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
    <span style={{
      fontSize: "var(--text-3xl)",
      fontWeight: "var(--font-semi)",
      letterSpacing: "-0.03em",
      color: accent || "var(--color-text-primary)",
      lineHeight: 1,
    }}>
      {value ?? "—"}
    </span>
    {sub && (
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{sub}</span>
    )}
  </div>
);

export default InvoiceCard;
