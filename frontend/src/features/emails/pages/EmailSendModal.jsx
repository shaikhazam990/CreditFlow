import { useState } from "react";
import useEmails from "../hooks/useEmails";

const STAGE_INFO = {
  1: { label: "Stage 1 — Warm Reminder", desc: "1–7 days overdue. Friendly, assumes they forgot." },
  2: { label: "Stage 2 — Polite & Firm", desc: "8–14 days overdue. Polite but requesting immediate action." },
  3: { label: "Stage 3 — Formal Notice", desc: "15–21 days overdue. Formal, references payment terms." },
  4: { label: "Stage 4 — Final Warning", desc: "22–30 days overdue. Stern 48h deadline before escalation." },
  5: { label: "Stage 5 — Escalation", desc: "30+ days overdue. Account referred for further action." },
};

const EmailSendModal = ({ invoice, onClose }) => {
  const { send, preview, previewData, previewLoading, sendLoading, resetPreview } = useEmails();
  const [stage, setStage] = useState(invoice.followUpStage || 1);
  const [dryRun, setDryRun] = useState(true);
  const [sent, setSent] = useState(false);

  const handlePreview = () => preview(invoice._id, stage);

  const handleSend = async () => {
    const result = await send(invoice._id, stage, dryRun);
    if (!result.error) { setSent(true); setTimeout(onClose, 1500); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal__header">
          <h2 className="modal__title">Send Follow-up Email</h2>
          <button className="btn btn--ghost btn--sm" onClick={() => { resetPreview(); onClose(); }}>✕</button>
        </div>

        <div className="modal__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Invoice</div>
            <div style={{ fontWeight: "var(--font-medium)" }}>{invoice.invoiceNumber} — {invoice.clientName}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{invoice.clientEmail} · {invoice.overdueDays}d overdue</div>
          </div>

          <div className="form-group">
            <label className="form-label">Follow-up Stage</label>
            <select className="form-input" value={stage} onChange={(e) => { setStage(Number(e.target.value)); resetPreview(); }}>
              {Object.entries(STAGE_INFO).map(([s, { label }]) => (
                <option key={s} value={s}>{label}</option>
              ))}
            </select>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
              {STAGE_INFO[stage]?.desc}
            </span>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: "var(--text-sm)" }}>
              <strong>Dry Run</strong> — generate email without actually sending it
            </span>
          </label>

          {previewLoading && (
            <div style={{ textAlign: "center", padding: "var(--space-4)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              Generating email preview…
            </div>
          )}

          {previewData && (
            <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)", padding: "var(--space-3) var(--space-4)" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Subject</div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>{previewData.subject}</div>
              </div>
              <div style={{ padding: "var(--space-4)", maxHeight: 280, overflowY: "auto" }}>
                <pre style={{ fontSize: "var(--text-xs)", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "var(--font-sans)", color: "var(--color-text-secondary)" }}>
                  {previewData.body}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={handlePreview} disabled={previewLoading}>
            {previewLoading ? "Generating…" : "Preview Email"}
          </button>
          <button className="btn btn--accent" onClick={handleSend} disabled={sendLoading || sent}>
            {sent ? "Sent ✓" : sendLoading ? "Sending…" : dryRun ? "Simulate Send" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSendModal;
