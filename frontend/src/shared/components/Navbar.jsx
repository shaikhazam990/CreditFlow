import { useSelector } from "react-redux";
import useNotifications from "../../features/notifications/hooks/useNotifications";

const Navbar = ({ title }) => {
  const { user } = useSelector((s) => s.auth);
  const { unreadCount, markAllRead } = useNotifications();

  return (
    <header style={{
      height: "var(--topbar-height)",
      borderBottom: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 var(--space-8)",
      background: "var(--color-surface)",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{title}</span>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
        {unreadCount > 0 && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={markAllRead}
            style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", position: "relative" }}
            title="Mark all notifications as read"
          >
            🔔
            <span style={{
              position: "absolute", top: -4, right: -4,
              background: "var(--color-danger)",
              color: "#fff", fontSize: 10,
              borderRadius: 99,
              width: 16, height: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </button>
        )}
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
