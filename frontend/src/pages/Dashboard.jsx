import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useInvoices from "../features/invoices/hooks/useInvoices";
import useNotifications from "../features/notifications/hooks/useNotifications";
import InvoiceCard from "../features/invoices/components/InvoiceCard";
import Loader from "../shared/components/Loader";

const Dashboard = () => {
  const { dashboardStats, statsLoading, loadDashboard, items, loading, load } = useInvoices();
  const { items: notifs, load: loadNotifs, markRead, unreadCount } = useNotifications();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    loadDashboard();
    load({ page: 1, status: "overdue", limit: 5 });
    loadNotifs({ limit: 6 });
  }, []);

  const stats = dashboardStats;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1>
          <p className="page__subtitle">Here's what needs your attention today.</p>
        </div>
        {user?.role === "admin" && (
          <Link to="/invoices" className="btn btn--secondary btn--sm">View all invoices →</Link>
        )}
      </div>

      {/* Stat Cards */}
      {statsLoading ? <Loader /> : stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-10)" }}>
          <InvoiceCard label="Total Invoices" value={stats.total} sub="All time" />
          <InvoiceCard label="Overdue" value={stats.overdue} sub="Need attention" accent={stats.overdue > 0 ? "var(--color-danger)" : undefined} />
          <InvoiceCard label="Paid" value={stats.paid} sub="Completed" accent="var(--color-success)" />
          <InvoiceCard label="Escalated" value={stats.escalated} sub="Requires action" accent={stats.escalated > 0 ? "#8a4e00" : undefined} />
          <InvoiceCard label="Emails Sent" value={stats.emailsSent} sub="Audit logs" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "var(--space-6)", alignItems: "start" }}>
        {/* Recent Overdue */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semi)" }}>Overdue Invoices</h2>
            <Link to="/invoices?status=overdue" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textDecoration: "underline" }}>See all</Link>
          </div>

          {loading ? <Loader /> : items.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              🎉 No overdue invoices right now.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {items.map((inv) => (
                <Link key={inv._id} to={`/invoices/${inv._id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", cursor: "pointer", transition: "box-shadow var(--transition)" }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-sm)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "var(--shadow-xs)"}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>{inv.invoiceNumber}</div>
                      <div style={{ fontWeight: "var(--font-medium)", marginBottom: "var(--space-1)" }} className="truncate">{inv.clientName}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{inv.clientEmail}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: "var(--font-semi)", fontVariantNumeric: "tabular-nums" }}>
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency || "USD" }).format(inv.amount)}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "var(--space-1)", fontWeight: "var(--font-medium)" }}>
                        {inv.overdueDays}d overdue · S{inv.followUpStage}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Panel */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semi)" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-xs)", background: "var(--color-danger)", color: "#fff", borderRadius: 99, padding: "1px 6px" }}>
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>

          {notifs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              No notifications
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {notifs.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && markRead(n._id)}
                  className="card"
                  style={{
                    padding: "var(--space-3) var(--space-4)",
                    cursor: n.read ? "default" : "pointer",
                    opacity: n.read ? 0.6 : 1,
                    borderLeft: n.read ? "1px solid var(--color-border)" : "3px solid var(--color-accent)",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-1)" }}>{n.title}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: "var(--space-2)" }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
