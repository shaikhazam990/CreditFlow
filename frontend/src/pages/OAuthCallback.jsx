import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getMeThunk } from "../features/auth/authSlice";
import Loader from "../shared/components/Loader";

/**
 * /oauth/callback
 *
 * The backend redirects here after a successful Google OAuth flow:
 *   http://localhost:5173/oauth/callback#token=eyJ...
 *
 * We read the token from the URL fragment (hash), store it in
 * localStorage, fetch the user profile, then navigate to /dashboard.
 *
 * The fragment is never sent to any server — it stays client-side only.
 */
const OAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = window.location.hash; // e.g.  "#token=eyJ..."
    const params = new URLSearchParams(hash.replace("#", "?"));
    const token = params.get("token");

    // Also check query string for error codes from the backend
    const searchParams = new URLSearchParams(window.location.search);
    const err = searchParams.get("error");

    if (err) {
      const messages = {
        google_auth_failed: "Google authentication failed. Please try again.",
        google_denied:      "You denied access to your Google account.",
        server_error:       "A server error occurred. Please try again.",
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

    // Store token then fetch user profile
    localStorage.setItem("token", token);

    // Clean the fragment from the URL immediately for security
    window.history.replaceState(null, "", "/oauth/callback");

    dispatch(getMeThunk()).then((result) => {
      if (result.error) {
        localStorage.removeItem("token");
        setError("Failed to load your profile. Please try again.");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        navigate("/dashboard", { replace: true });
      }
    });
  }, []);

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
