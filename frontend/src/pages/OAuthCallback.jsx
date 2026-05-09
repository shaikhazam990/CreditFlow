import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getMeThunk, logout } from "../features/auth/authSlice";
import Loader from "../shared/components/Loader";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const token = params.get("token");

    const searchParams = new URLSearchParams(window.location.search);
    const err = searchParams.get("error");

    if (err) {
      const messages = {
        google_auth_failed: "Google authentication failed. Please try again.",
        google_denied: "You denied access to your Google account.",
        server_error: "A server error occurred. Please try again.",
      };
      setError(messages[err] || "Authentication failed.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!token) {
      setError("No authentication token received.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    localStorage.setItem("token", token);
window.history.replaceState(null, "", "/oauth/callback");

// Let AppInit handle getMeThunk fresh on reload
window.location.href = "/dashboard";

    // ← Dispatch getMeThunk and WAIT for it to finish before navigating


  if (error) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "var(--space-4)",
        fontFamily: "var(--font-sans)", padding: "var(--space-8)",
      }}>
        <div style={{
          background: "var(--color-danger-light)", color: "var(--color-danger)",
          padding: "var(--space-4) var(--space-6)", borderRadius: "var(--radius-md)",
          fontSize: "var(--text-sm)", textAlign: "center", maxWidth: 360,
        }}>
          {error}
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Redirecting to login…
        </p>
      </div>
    );
  }

  return <Loader fullPage />;
};

export default OAuthCallback;