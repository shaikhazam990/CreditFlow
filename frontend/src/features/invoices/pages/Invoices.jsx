import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import useInvoices from "../hooks/useInvoices";
import InvoiceTable from "../components/InvoiceTable";
import InvoiceModal from "../components/InvoiceModal";
import EmptyState from "../../../shared/components/EmptyState";
import Loader from "../../../shared/components/Loader";
import EmailSendModal from "../../emails/pages/EmailSendModal";
import * as invoiceApi from "../services/invoice.api";
import toast from "react-hot-toast";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Overdue", value: "overdue" },
  { label: "Paid", value: "paid" },
  { label: "Escalated", value: "escalated" },
];

const Invoices = () => {
  const { items, loading, total, pages, load, create, update, remove, setPaid } = useInvoices();
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === "admin";

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendTarget, setSendTarget] = useState(null);
  const searchRef = useRef();

  useEffect(() => {
    load({ page, status, search });
  }, [page, status, search]);

  const handleCreate = async (form) => {
    setSaving(true);
    const result = await create(form);
    setSaving(false);
    if (!result.error) setModalOpen(false);
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    const result = await update(editTarget._id, form);
    setSaving(false);
    if (!result.error) setEditTarget(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    await remove(id);
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await invoiceApi.uploadCSV(fd);
      toast.success(`Imported ${data.imported} invoices${data.failed ? `, ${data.failed} failed` : ""}.`);
      load({ page: 1, status, search });
    } catch {
      toast.error("CSV import failed.");
    }
    e.target.value = "";
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Invoices</h1>
          <p className="page__subtitle">{total} invoice{total !== 1 ? "s" : ""} total</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          {!isAdmin && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", padding: "var(--space-1) var(--space-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
              👤 Viewer mode — admin required to create
            </span>
          )}
          <label
            className={`btn btn--secondary btn--sm ${!isAdmin ? "btn--disabled" : ""}`}
            style={{ cursor: isAdmin ? "pointer" : "not-allowed", opacity: isAdmin ? 1 : 0.45 }}
            title={isAdmin ? "Import invoices from CSV" : "Admin only"}
          >
            ⬆ Import CSV
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={isAdmin ? handleCSV : undefined} disabled={!isAdmin} />
          </label>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => isAdmin && setModalOpen(true)}
            disabled={!isAdmin}
            title={isAdmin ? "Create new invoice" : "Admin only"}
            style={{ opacity: isAdmin ? 1 : 0.45, cursor: isAdmin ? "pointer" : "not-allowed" }}
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="form-input"
          style={{ maxWidth: 260 }}
          placeholder="Search client, invoice…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          ref={searchRef}
        />
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`btn btn--sm ${status === f.value ? "btn--primary" : "btn--secondary"}`}
              onClick={() => { setStatus(f.value); setPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description={search || status ? "Try adjusting your filters." : "Create your first invoice to get started."}
          action={isAdmin ? { label: "Create invoice", onClick: () => setModalOpen(true) } : null}
        />
      ) : (
        <>
          <InvoiceTable
            invoices={items}
            onEdit={(inv) => setEditTarget(inv)}
            onDelete={handleDelete}
            onMarkPaid={setPaid}
            onSendEmail={(inv) => setSendTarget(inv)}
          />

          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span style={{ padding: "0 var(--space-2)" }}>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      <InvoiceModal
        open={modalOpen || !!editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
        initial={editTarget}
        loading={saving}
      />

      {sendTarget && (
        <EmailSendModal invoice={sendTarget} onClose={() => setSendTarget(null)} />
      )}
    </div>
  );
};

export default Invoices;