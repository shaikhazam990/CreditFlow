import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const statusLabel = {
  pending: "Pending", overdue: "Overdue", paid: "Paid",
  escalated: "Escalated", cancelled: "Cancelled",
};

const fmt = (n, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const InvoiceTable = ({ invoices, onEdit, onDelete, onMarkPaid, onSendEmail }) => {
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === "admin";

  if (!invoices?.length) return null;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Due Date</th>
            <th>Overdue</th>
            <th>Stage</th>
            <th>Status</th>
            <th>Follow-ups</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv._id}>
              <td>
                <Link
                  to={`/invoices/${inv._id}`}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", color: "var(--color-accent)" }}
                >
                  {inv.invoiceNumber}
                </Link>
              </td>
              <td>
                <div style={{ fontWeight: "var(--font-medium)" }}>{inv.clientName}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{inv.clientEmail}</div>
              </td>
              <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: "var(--font-medium)" }}>
                {fmt(inv.amount, inv.currency)}
              </td>
              <td style={{ color: "var(--color-text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                {fmtDate(inv.dueDate)}
              </td>
              <td>
                {inv.overdueDays > 0 ? (
                  <span style={{ color: "var(--color-danger)", fontWeight: "var(--font-medium)", fontVariantNumeric: "tabular-nums" }}>
                    {inv.overdueDays}d
                  </span>
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>—</span>
                )}
              </td>
              <td>
                {inv.followUpStage > 0 ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>S{inv.followUpStage}</span>
                ) : "—"}
              </td>
              <td>
                <span className={`badge badge--${inv.status}`}>{statusLabel[inv.status]}</span>
              </td>
              <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--color-text-secondary)" }}>
                {inv.followUpCount}
              </td>
              {isAdmin && (
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "nowrap" }}>
                    {inv.status !== "paid" && (
                      <>
                        <button className="btn btn--ghost btn--sm" onClick={() => onSendEmail(inv)} title="Send email">
                          ✉
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => onMarkPaid(inv._id)} title="Mark paid">
                          ✓
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => onEdit(inv)} title="Edit">
                          ✎
                        </button>
                      </>
                    )}
                    <button className="btn btn--ghost btn--sm" onClick={() => onDelete(inv._id)} title="Delete" style={{ color: "var(--color-danger)" }}>
                      ✕
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
