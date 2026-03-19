import { Link, useNavigate } from "react-router-dom";

export default function Nav() {
  const navigate = useNavigate();
  const token = localStorage.getItem("sb_token");

  function handleSignOut() {
    localStorage.removeItem("sb_token");
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
