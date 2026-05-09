import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import GoogleButton from "../../../shared/components/GoogleButton";
import "../style/auth.scss";

const Register = () => {
  const { handleRegister, loading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    handleRegister(form);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="dot" />
          <span>CreditFlow</span>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-subheading">Start managing your invoices and follow-ups</p>

        {/* Google OAuth button */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <GoogleButton label="Sign up with Google" />
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>or register with email</span>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={onChange}
              required
              minLength={8}
            />
          </div>

          <button
            className="btn btn--primary btn--lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: "var(--space-2)" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
