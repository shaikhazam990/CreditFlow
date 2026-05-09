const Loader = ({ fullPage }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: fullPage ? "100vh" : 160,
    width: "100%",
  }}>
    <div style={{
      width: 24, height: 24,
      border: "2px solid var(--color-border)",
      borderTopColor: "var(--color-text-primary)",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  </div>
);

export default Loader;
