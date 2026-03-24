import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SOULBOLT_URL = import.meta.env.VITE_SOULBOLT_URL || "https://soulbolt.ai";

// Login.jsx — manual token entry fallback
// Primary auth path is SSO via /auth (SOULBOLT dashboard handoff).
// Token stored in sessionStorage only. No localStorage write.

export default function Login() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!token.trim()) { setError("Token required"); return; }
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/creators/me", {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (r.status === 401) { setError("Invalid token"); return; }
      sessionStorage.setItem("sb_token", token.trim());
      navigate("/dashboard");
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card fade-up">
        <div>
          <h1 className="auth-card-title">Sign in to SAUVERN</h1>
          <p className="auth-card-sub">Use your SOULBOLT token to authenticate.</p>
        </div>
        {error && <div className="error-state" role="alert">{error}</div>}
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">SOULBOLT Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="sb_..."
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Verifying…" : "Sign In"}
          </button>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
          Don't have an account?{" "}
          <a href={SOULBOLT_URL} target="_blank" rel="noreferrer">
            Get SOULBOLT
          </a>
        </p>
      </div>
    </div>
  );
}
