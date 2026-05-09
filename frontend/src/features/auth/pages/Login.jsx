import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import GoogleButton from "../../../shared/components/GoogleButton";
import "../style/auth.scss";
import toast from "react-hot-toast";

const Login = () => {
  const { handleLogin, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const location = useLocation();

  // Show error toast if redirected back from a failed OAuth attempt
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("error");
    if (err === "google_auth_failed") toast.error("Google sign-in failed. Please try again.");
    if (err === "google_denied")      toast.error("Google sign-in was cancelled.");
    if (err === "server_error")       toast.error("Server error during sign-in.");
  }, []);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    handleLogin(form);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="dot" />
          <span>CreditFlow</span>
        </div>

        <h1 className="auth-heading">Sign in</h1>
        <p className="auth-subheading">Finance credit follow-up dashboard</p>

        {/* Google OAuth button */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <GoogleButton label="Continue with Google" />
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              className="form-input"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            className="btn btn--primary btn--lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: "var(--space-2)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
