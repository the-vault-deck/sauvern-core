import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MAIN_TABS = ["CREATE LISTING", "SUBMISSIONS"];
const STATUS_TABS = ["PENDING", "APPROVED", "REJECTED"];

const EMPTY_LISTING = {
  creator_id: "",
  title: "",
  description: "",
  category: "",
  price_cents: "",
  contact_method: "URL",
  contact_value: "",
  is_featured: false,
};

export default function Admin() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("CREATE LISTING");

  // Submissions state
  const [subTab, setSubTab] = useState("PENDING");
  const [listings, setListings] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState(null);
  const [acting, setActing] = useState(null);
  const [rejectReason, setRejectReason] = useState({});

  // Create listing state
  const [creators, setCreators] = useState([]);
  const [fields, setFields] = useState(EMPTY_LISTING);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Auth gate
  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (!d.is_admin) navigate("/"); })
      .catch(() => navigate("/"));
  }, []);

  // Load creators for dropdown
  useEffect(() => {
    fetch("/api/creators", { credentials: "include" })
      .then((r) => r.json())
      .then(setCreators)
      .catch(() => {});
  }, []);

  // Submissions loader
  function loadSubmissions(status) {
    setSubLoading(true);
    setSubError(null);
    fetch(`/api/admin/submissions?status=${status}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 403) throw new Error("Access denied");
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(setListings)
      .catch((e) => setSubError(e.message))
      .finally(() => setSubLoading(false));
  }

  useEffect(() => {
    if (mainTab === "SUBMISSIONS") loadSubmissions(subTab);
  }, [mainTab, subTab]);

  async function approve(id) {
    setActing(id);
    try {
      const r = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST", credentials: "include",
      });
      if (!r.ok) { const e = await r.json(); alert(e.detail || "Failed"); return; }
      loadSubmissions(subTab);
    } finally { setActing(null); }
  }

  async function reject(id) {
    setActing(id);
    try {
      const r = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: rejectReason[id] || null }),
      });
      if (!r.ok) { const e = await r.json(); alert(e.detail || "Failed"); return; }
      setRejectReason((prev) => { const n = { ...prev }; delete n[id]; return n; });
      loadSubmissions(subTab);
    } finally { setActing(null); }
  }

  // Create listing
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleCreate() {
    setCreateError(null);
    setCreateSuccess(null);
    if (!fields.creator_id) { setCreateError("Select a creator"); return; }
    if (!fields.title.trim()) { setCreateError("Title required"); return; }
    if (!fields.description.trim()) { setCreateError("Description required"); return; }
    if (!fields.category.trim()) { setCreateError("Category required"); return; }
    if (!fields.price_cents && !fields.contact_value.trim()) {
      setCreateError("Provide either a price or a contact value");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        creator_id: fields.creator_id,
        title: fields.title.trim(),
        description: fields.description.trim(),
        category: fields.category.trim(),
        price_cents: fields.price_cents ? parseInt(fields.price_cents, 10) : null,
        contact_method: fields.contact_method,
        contact_value: fields.contact_value.trim() || null,
        is_featured: fields.is_featured,
      };
      const r = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!r.ok) { const e = await r.json(); setCreateError(e.detail || "Failed"); return; }
      const created = await r.json();
      setCreateSuccess(`Created: "${created.title}" — slug: ${created.slug}`);
      setFields(EMPTY_LISTING);
    } catch { setCreateError("Network error — try again"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="page-shell">
      <div className="page-header fade-up">
        <h1>Admin</h1>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {MAIN_TABS.map((t) => (
          <button
            key={t}
            className={`btn${mainTab === t ? " btn-primary" : ""}`}
            onClick={() => setMainTab(t)}
            style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
          >
            {t}
          </button>
        ))}
      </div>

      {mainTab === "CREATE LISTING" && (
        <div style={{ maxWidth: 600 }}>
          {createError && <div className="error-state" style={{ marginBottom: "1rem" }}>{createError}</div>}
          {createSuccess && (
            <div style={{ padding: "1rem", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 4, color: "var(--success)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {createSuccess}
            </div>
          )}
          <div className="form-stack">
            <div className="form-group">
              <label className="form-label">Creator *</label>
              <select name="creator_id" value={fields.creator_id} onChange={handleChange}>
                <option value="">— select creator —</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>{c.display_name} (@{c.handle})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input name="title" value={fields.title} onChange={handleChange} placeholder="Listing title" />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input name="category" value={fields.category} onChange={handleChange} placeholder="e.g. AI Tool, Consulting, Course" />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea name="description" value={fields.description} onChange={handleChange} placeholder="Describe the listing…" />
            </div>
            <div className="form-group">
              <label className="form-label">Price (cents) — leave blank for contact listing</label>
              <input name="price_cents" value={fields.price_cents} onChange={handleChange} placeholder="e.g. 4900 = $49.00" type="number" min="0" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
              <div className="form-group">
                <label className="form-label">Contact via</label>
                <select name="contact_method" value={fields.contact_method} onChange={handleChange}>
                  <option value="URL">URL</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact value</label>
                <input name="contact_value" value={fields.contact_value} onChange={handleChange}
                  placeholder={fields.contact_method === "EMAIL" ? "you@domain.com" : "https://…"} />
              </div>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={fields.is_featured}
                onChange={handleChange}
                style={{ width: "auto", accentColor: "var(--accent)" }}
              />
              <label htmlFor="is_featured" className="form-label" style={{ margin: 0 }}>Featured on home page</label>
            </div>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting} style={{ alignSelf: "flex-start" }}>
              {submitting ? "Creating…" : "Create Listing"}
            </button>
          </div>
        </div>
      )}

      {mainTab === "SUBMISSIONS" && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                className={`btn${subTab === s ? " btn-primary" : ""}`}
                onClick={() => setSubTab(s)}
                style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
              >
                {s}
              </button>
            ))}
          </div>
          {subError && <div className="error-state" role="alert">{subError}</div>}
          {subLoading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading…</p>
          ) : listings.length === 0 ? (
            <div className="empty-state"><p>No {subTab.toLowerCase()} submissions.</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {listings.map((l) => (
                <div key={l.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "1.25rem" }}>
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
                    {subTab === "PENDING" && (
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
        </>
      )}
    </div>
  );
}
