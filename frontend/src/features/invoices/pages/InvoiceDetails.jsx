import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as invoiceApi from "../services/invoice.api";
import * as emailApi from "../../emails/services/email.api";
import Loader from "../../../shared/components/Loader";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const fmt = (n, c = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const fmtSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const FileIcon = ({ mimetype }) => {
  if (mimetype === "application/pdf")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="15" y2="17"/>
        <line x1="9" y1="9" x2="12" y2="9"/>
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
};

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isAdmin = user?.role === "admin";

  const [invoice, setInvoice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState(null);
  const fileInputRef = useRef();
  const dropZoneInputRef = useRef();

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

  const doUpload = async (file) => {
    if (!file) return;
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) { toast.error("File too large. Max 10 MB."); return; }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const { data } = await invoiceApi.uploadAttachment(id, fd);
      setInvoice(data.invoice);
      toast.success("Attachment uploaded.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => { doUpload(e.target.files[0]); e.target.value = ""; };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.borderColor = "var(--color-border)";
    e.currentTarget.style.background = "var(--color-surface)";
    doUpload(e.dataTransfer.files[0]);
  };

  const handleDeleteAttachment = async (filename, originalName) => {
    if (!window.confirm(`Remove "${originalName}"?`)) return;
    setDeletingFile(filename);
    try {
      await invoiceApi.deleteAttachment(id, filename);
      setInvoice((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.filename !== filename) }));
      toast.success("Attachment removed.");
    } catch {
      toast.error("Failed to remove attachment.");
    } finally {
      setDeletingFile(null);
    }
  };

  if (loading) return <Loader fullPage />;
  if (!invoice) return null;

  const stageColors = { 1: "var(--color-info)", 2: "var(--color-warning)", 3: "var(--color-warning)", 4: "var(--color-danger)", 5: "#8a4e00" };
  const attachments = invoice.attachments || [];
  const backendBase = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

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

      {/* ── Attachments section ── */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semi)", margin: 0 }}>
            Attachments{" "}
            <span style={{ color: "var(--color-text-muted)", fontWeight: "var(--font-regular)" }}>({attachments.length})</span>
          </h2>
          {isAdmin && (
            <>
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={handleFileChange} />
              <button
                className="btn btn--primary btn--sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
              >
                {uploading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Uploading…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload File
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {attachments.length === 0 ? (
          isAdmin ? (
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "var(--space-3)", padding: "var(--space-10)",
                border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
                cursor: "pointer", color: "var(--color-text-muted)", fontSize: "var(--text-sm)",
                transition: "border-color 0.15s, background 0.15s", background: "var(--color-surface)",
              }}
              onClick={() => dropZoneInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.background = "rgba(99,102,241,.06)"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.background = "var(--color-surface)"; }}
              onDrop={handleDrop}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div>
                <span style={{ color: "var(--color-accent)", fontWeight: "var(--font-medium)" }}>Click to upload</span> or drag &amp; drop
              </div>
              <div style={{ fontSize: "var(--text-xs)" }}>PDF, JPG, PNG, WEBP — up to 10 MB</div>
              <input ref={dropZoneInputRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={handleFileChange} />
            </div>
          ) : (
            <div className="card" style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-12)" }}>
              No attachments yet.
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {attachments.map((att) => (
              <div
                key={att.filename}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-4) var(--space-5)" }}
              >
                <span style={{ color: "var(--color-accent)", flexShrink: 0 }}>
                  <FileIcon mimetype={att.mimetype} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "var(--font-medium)", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {att.originalName}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {fmtSize(att.size)} · Uploaded {fmtDate(att.uploadedAt)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
                  <a
                    href={`${backendBase}/uploads/attachments/${att.filename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--ghost btn--sm"
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                  </a>
                  {isAdmin && (
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={deletingFile === att.filename}
                      onClick={() => handleDeleteAttachment(att.filename, att.originalName)}
                      style={{ color: "var(--color-danger)" }}
                    >
                      {deletingFile === att.filename ? "…" : "✕"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default InvoiceDetails;
