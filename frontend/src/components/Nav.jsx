import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SOULBOLT_URL = import.meta.env.VITE_SOULBOLT_URL || "https://soulbolt.ai";

export default function Nav() {
  // Auth state: probe /api/creators/me — cookie is sent automatically.
  // null = loading, true = authenticated, false = not authenticated.
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    fetch("/api/creators/me", { credentials: "include" })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {
      // ignore — cookie cleared server-side regardless
    }
    window.location.href = SOULBOLT_URL;
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          SAUVERN<span>.</span>
        </Link>
        <ul className="nav-links">
          {authed ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li>
                <button
                  onClick={handleSignOut}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <a
                  href={SOULBOLT_URL}
                  style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none" }}
                >
                  Sign In
                </a>
              </li>
              <li>
                <a href={SOULBOLT_URL} className="nav-cta">
                  Get Started
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
