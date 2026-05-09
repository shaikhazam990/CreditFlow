import { useEffect, useState } from "react";
import useEmails from "../hooks/useEmails";
import Loader from "../../../shared/components/Loader";
import EmptyState from "../../../shared/components/EmptyState";

const TONE_LABELS = {
  warm_reminder: "Warm Reminder",
  polite_firm: "Polite & Firm",
  formal_notice: "Formal Notice",
  final_warning: "Final Warning",
  escalated: "Escalated",
};

const EmailLogs = () => {
  const { logs, loading, total, pages, loadLogs } = useEmails();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadLogs({ page, status });
  }, [page, status]);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Email Logs</h1>
          <p className="page__subtitle">{total} email record{total !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {["", "sent", "dry_run", "failed"].map((s) => (
            <button key={s} className={`btn btn--sm ${status === s ? "btn--primary" : "btn--secondary"}`} onClick={() => { setStatus(s); setPage(1); }}>
              {s === "" ? "All" : s === "dry_run" ? "Dry Run" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : logs.length === 0 ? (
        <EmptyState title="No email logs" description="Emails sent to clients will appear here." />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {logs.map((log) => (
              <div key={log._id} className="card" style={{ padding: "var(--space-5)" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
                  onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-1)", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "var(--font-medium)", fontSize: "var(--text-sm)" }} className="truncate">{log.subject}</span>
                      <span className={`badge badge--${log.status}`}>{log.status === "dry_run" ? "Dry Run" : log.status}</span>
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
                      <span>To: {log.recipientEmail}</span>
                      {log.invoice && <span>Invoice: {log.invoice.invoiceNumber}</span>}
                      <span>Stage {log.stage} — {TONE_LABELS[log.tone] || log.tone}</span>
                      <span>{new Date(log.sentAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)", flexShrink: 0, marginLeft: "var(--space-4)" }}>
                    {expanded === log._id ? "▲" : "▼"}
                  </span>
                </div>

                {expanded === log._id && (
                  <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "var(--space-4)", paddingTop: "var(--space-4)" }}>
                    {log.errorMessage && (
                      <div style={{ background: "var(--color-danger-light)", color: "var(--color-danger)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-3)", fontSize: "var(--text-xs)" }}>
                        Error: {log.errorMessage}
                      </div>
                    )}
                    <pre style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", lineHeight: 1.7 }}>
                      {log.body}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span style={{ padding: "0 var(--space-2)" }}>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailLogs;
