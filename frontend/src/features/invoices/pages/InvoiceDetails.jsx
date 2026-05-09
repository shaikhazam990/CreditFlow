import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as invoiceApi from "../services/invoice.api";
import * as emailApi from "../../emails/services/email.api";
import Loader from "../../../shared/components/Loader";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const fmt = (n, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === "admin";

  const [invoice, setInvoice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, logsRes] = await Promise.all([
          invoiceApi.getInvoice(id),
          emailApi.getLogs({ invoiceId: id }),
        ]);
        setInvoice(invRes.data.invoice);
        setLogs(logsRes.data.logs);
      } catch {
        toast.error("Failed to load invoice.");
        navigate("/invoices");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Loader fullPage />;
  if (!invoice) return null;

  const stageColors = { 1: "var(--color-info)", 2: "var(--color-warning)", 3: "var(--color-warning)", 4: "var(--color-danger)", 5: "#8a4e00" };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)} style={{ marginBottom: "var(--space-3)" }}>
            ← Back
          </button>
          <h1 className="page__title" style={{ fontFamily: "var(--font-mono)" }}>{invoice.invoiceNumber}</h1>
          <p className="page__subtitle">{invoice.clientName} — {invoice.clientEmail}</p>
        </div>
        <span className={`badge badge--${invoice.status}`} style={{ fontSize: "var(--text-sm)", padding: "var(--space-2) var(--space-3)" }}>
          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        {[
          { label: "Amount", value: fmt(invoice.amount, invoice.currency) },
          { label: "Due Date", value: fmtDate(invoice.dueDate) },
          { label: "Days Overdue", value: invoice.overdueDays > 0 ? `${invoice.overdueDays} days` : "Not overdue", accent: invoice.overdueDays > 0 ? "var(--color-danger)" : undefined },
          { label: "Follow-up Stage", value: invoice.followUpStage > 0 ? `Stage ${invoice.followUpStage}` : "None", accent: stageColors[invoice.followUpStage] },
          { label: "Follow-ups Sent", value: invoice.followUpCount },
          { label: "Last Follow-up", value: invoice.lastFollowUpAt ? fmtDate(invoice.lastFollowUpAt) : "Never" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card">
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-2)" }}>{label}</div>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-semi)", color: accent || "var(--color-text-primary)" }}>{value}</div>
          </div>
        ))}
      </div>

      {invoice.notes && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--space-3)" }}>Notes</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>{invoice.notes}</p>
        </div>
      )}

      <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semi)", marginBottom: "var(--space-4)" }}>
        Email History <span style={{ color: "var(--color-text-muted)", fontWeight: "var(--font-regular)" }}>({logs.length})</span>
      </h2>

      {logs.length === 0 ? (
        <div className="card" style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-12)" }}>
          No emails sent yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {logs.map((log) => (
            <div key={log._id} className="card" style={{ padding: "var(--space-5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                <div>
                  <div style={{ fontWeight: "var(--font-medium)", marginBottom: "var(--space-1)" }}>{log.subject}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    Stage {log.stage} · {log.tone?.replace(/_/g, " ")} · {new Date(log.sentAt).toLocaleString()}
                  </div>
                </div>
                <span className={`badge badge--${log.status}`}>{log.status === "dry_run" ? "Dry Run" : log.status}</span>
              </div>
              <pre style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
                {log.body}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;
