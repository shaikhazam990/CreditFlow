import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useAuth from "../../features/auth/hooks/useAuth";
import useNotifications from "../../features/notifications/hooks/useNotifications";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "⊞" },
  { to: "/invoices",  label: "Invoices",  icon: "◻" },
  { to: "/emails",    label: "Email Logs", icon: "✉" },
];

const Sidebar = () => {
  const { handleLogout } = useAuth();
  const { user } = useSelector((s) => s.auth);
  const { unreadCount } = useNotifications();

  return (
    <aside style={{
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      width: "var(--sidebar-width)",
      background: "var(--color-surface)",
      borderRight: "1px solid var(--color-border)",
      display: "flex",
      flexDirection: "column",
      zIndex: 50,
      padding: "var(--space-5) 0",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 var(--space-5)", marginBottom: "var(--space-8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)", flexShrink: 0 }} />
          <span style={{ fontWeight: "var(--font-semi)", fontSize: "var(--text-base)", letterSpacing: "-0.02em" }}>CreditFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 var(--space-3)" }}>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", padding: "0 var(--space-2)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Main
        </div>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-1)",
              fontSize: "var(--text-sm)",
              fontWeight: isActive ? "var(--font-medium)" : "var(--font-regular)",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              background: isActive ? "var(--color-bg)" : "transparent",
              transition: "background var(--transition), color var(--transition)",
              textDecoration: "none",
            })}
          >
            <span style={{ fontSize: "var(--text-base)", opacity: 0.7, width: 18, textAlign: "center", flexShrink: 0 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Notification count */}
      {unreadCount > 0 && (
        <div style={{ margin: "0 var(--space-3) var(--space-3)", padding: "var(--space-3)", background: "var(--color-accent-light)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          🔔 {unreadCount} new notification{unreadCount > 1 ? "s" : ""}
        </div>
      )}

      {/* User info */}
      <div style={{ borderTop: "1px solid var(--color-border)", padding: "var(--space-4) var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", color: "var(--color-text-primary)" }} className="truncate">{user?.name}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }} className="truncate">{user?.email}</div>
        </div>
        {user?.role === "admin" && (
          <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", color: "var(--color-accent)", background: "var(--color-accent-light)", padding: "2px 8px", borderRadius: 99, display: "inline-block", width: "fit-content" }}>
            Admin
          </span>
        )}
        <button className="btn btn--ghost btn--sm" onClick={handleLogout} style={{ alignSelf: "flex-start", padding: 0, color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
          Sign out →
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
