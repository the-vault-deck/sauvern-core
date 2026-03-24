import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/listings/mine", {
      credentials: "include",
    })
      .then((r) => {
        if (r.status === 401) { navigate("/login"); return null; }
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => { if (data) setListings(data); })
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
