import { useState, useEffect } from "react";

const EMPTY = {
  invoiceNumber: "", clientName: "", clientEmail: "",
  amount: "", currency: "USD", dueDate: "", notes: "", paymentLink: "",
};

const InvoiceModal = ({ open, onClose, onSubmit, initial = null, loading }) => {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (initial) {
      setForm({
        invoiceNumber: initial.invoiceNumber || "",
        clientName: initial.clientName || "",
        clientEmail: initial.clientEmail || "",
        amount: initial.amount || "",
        currency: initial.currency || "USD",
        dueDate: initial.dueDate ? initial.dueDate.split("T")[0] : "",
        notes: initial.notes || "",
        paymentLink: initial.paymentLink || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial, open]);

  if (!open) return null;

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{initial ? "Edit Invoice" : "New Invoice"}</h2>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Invoice Number</label>
              <input className="form-input" name="invoiceNumber" value={form.invoiceNumber} onChange={onChange} placeholder="INV-0001" required disabled={!!initial} />
            </div>

            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Client Name</label>
              <input className="form-input" name="clientName" value={form.clientName} onChange={onChange} placeholder="Acme Corp" required />
            </div>

            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Client Email</label>
              <input className="form-input" type="email" name="clientEmail" value={form.clientEmail} onChange={onChange} placeholder="billing@acme.com" required />
            </div>

            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" name="amount" value={form.amount} onChange={onChange} placeholder="5000" min="0" step="0.01" required />
            </div>

            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-input" name="currency" value={form.currency} onChange={onChange}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" name="dueDate" value={form.dueDate} onChange={onChange} required />
            </div>

            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Payment Link <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
              <input className="form-input" type="url" name="paymentLink" value={form.paymentLink} onChange={onChange} placeholder="https://pay.example.com/inv-0001" />
            </div>

            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label className="form-label">Notes <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span></label>
              <textarea className="form-input" name="notes" value={form.notes} onChange={onChange} rows={2} placeholder="Internal notes…" style={{ resize: "vertical" }} />
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Saving…" : initial ? "Save changes" : "Create invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;
