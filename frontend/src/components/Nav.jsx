import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Migrate any token left in localStorage into sessionStorage, then clear localStorage.
function resolveToken() {
  let token = sessionStorage.getItem("sb_token");
  if (!token) {
    const legacy = localStorage.getItem("sb_token");
    if (legacy) {
      sessionStorage.setItem("sb_token", legacy);
      localStorage.removeItem("sb_token");
      token = legacy;
    }
  }
  return token;
}

export default function Nav() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => resolveToken());

  // Re-check on every navigation so Nav reflects auth state after SSO redirect.
  useEffect(() => {
    setToken(resolveToken());
  });

  function handleSignOut() {
    sessionStorage.removeItem("sb_token");
    localStorage.removeItem("sb_token");
    setToken(null);
    navigate("/login");
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          SAUVERN<span>.</span>
        </Link>
        <ul className="nav-links">
          {token ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/create" className="nav-cta">+ New Listing</Link></li>
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
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/login" className="nav-cta">Get Started</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
