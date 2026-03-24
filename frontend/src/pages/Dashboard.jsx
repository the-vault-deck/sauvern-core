import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// Migrate any token left in localStorage into sessionStorage, then clear localStorage.
// One-time migration path for existing sessions. After this runs, localStorage is clean.
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

export default function Dashboard() {
  const navigate = useNavigate();
  const token = resolveToken();
  if (!token) { navigate("/login"); return null; }

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/listings/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header fade-up">
        <h1>My Listings</h1>
        <Link to="/create" className="btn btn-primary">+ New Listing</Link>
      </div>

      {error && <div className="error-state" role="alert">Unable to load listings</div>}
      {loading && <div style={{ color: "var(--text-muted)", padding: "2rem 0" }}>Loading…</div>}

      {!loading && !error && listings.length === 0 && (
        <div className="empty-state fade-up">
          <p>No listings yet.</p>
          <Link to="/create" className="btn btn-ghost">Create your first listing</Link>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="fade-up" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Category</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link to={`/dashboard`} style={{ color: "var(--text-primary)" }}>
                      {l.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-chip ${l.status.toLowerCase()}`}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{l.category || "—"}</td>
                  <td>{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
