import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"];

export default function Admin() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("sb_token") || localStorage.getItem("sb_token");
  if (!token) { navigate("/login"); return null; }

  const [tab, setTab] = useState("PENDING");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);
  const [rejectReason, setRejectReason] = useState({});

  function load(status) {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/submissions?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 403) throw new Error("Access denied");
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(tab); }, [tab]);

  async function approve(id) {
    setActing(id);
    try {
      const r = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) { const e = await r.json(); alert(e.detail || "Failed"); return; }
      load(tab);
    } finally { setActing(null); }
  }

  async function reject(id) {
    setActing(id);
    try {
      const r = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason[id] || null }),
      });
      if (!r.ok) { const e = await r.json(); alert(e.detail || "Failed"); return; }
      setRejectReason((prev) => { const n = {...prev}; delete n[id]; return n; });
      load(tab);
    } finally { setActing(null); }
  }

  return (
    <div className="page-shell">
      <div className="page-header fade-up">
        <h1>Admin — Submissions</h1>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            className={`btn${tab === s ? " btn-primary" : ""}`}
            onClick={() => setTab(s)}
            style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="error-state" role="alert">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : listings.length === 0 ? (
        <div className="empty-state"><p>No {tab.toLowerCase()} submissions.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {listings.map((l) => (
            <div key={l.id} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "1.25rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{l.title}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                    {l.category} · {l.price_cents ? `$${(l.price_cents / 100).toFixed(2)}` : "Free"} · {l.contact_method}: {l.contact_value}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{l.description}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    Submitted: {l.submitted_at ? new Date(l.submitted_at).toLocaleString() : "—"}
                    {l.rejection_reason && <span style={{ marginLeft: "1rem", color: "#f87171" }}>Rejected: {l.rejection_reason}</span>}
                  </div>
                </div>
                {tab === "PENDING" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 160 }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
                      onClick={() => approve(l.id)}
                      disabled={acting === l.id}
                    >
                      {acting === l.id ? "…" : "Approve"}
                    </button>
                    <input
                      placeholder="Rejection reason (optional)"
                      value={rejectReason[l.id] || ""}
                      onChange={(e) => setRejectReason((prev) => ({ ...prev, [l.id]: e.target.value }))}
                      style={{ fontSize: "0.75rem", padding: "0.35rem 0.6rem" }}
                    />
                    <button
                      className="btn"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 1rem", borderColor: "#f87171", color: "#f87171" }}
                      onClick={() => reject(l.id)}
                      disabled={acting === l.id}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
