import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../utils/auth";

export default function Create() {
  const navigate = useNavigate();

  const [profileChecked, setProfileChecked] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [fields, setFields] = useState({
    title: "", description: "", category: "",
    price_cents: "", image_url: "",
    contact_method: "EMAIL", contact_value: "",
    is_featured: false,
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/creators/me", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) { navigate("/login"); return; }
        if (r.status === 404) { navigate("/creators/setup"); return; }
        if (!r.ok) { setError("Unable to verify creator profile"); return; }
        return r.json();
      })
      .then((creator) => {
        if (!creator) return;
        setProfileChecked(true);
        setAdminMode(isAdmin());
      })
      .catch(() => setError("Network error checking profile"));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit() {
    if (!fields.title.trim()) { setError("Title required"); return; }
    if (!fields.description.trim()) { setError("Description required"); return; }
    if (!fields.category.trim()) { setError("Category required"); return; }
    if (!fields.contact_value.trim()) { setError("Contact info required"); return; }
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: fields.title.trim(),
        description: fields.description.trim(),
        category: fields.category.trim(),
        contact_method: fields.contact_method,
        contact_value: fields.contact_value.trim(),
        price_cents: fields.price_cents ? parseInt(fields.price_cents, 10) : null,
        image_url: fields.image_url || null,
        is_featured: adminMode ? fields.is_featured : false,
      };
      const r = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (r.status === 401) { navigate("/login"); return; }
      if (!r.ok) { const err = await r.json(); setError(err.detail || "Submission failed"); return; }
      setSubmitted(true);
    } catch { setError("Network error — please try again"); }
    finally { setSubmitting(false); }
  }

  if (!profileChecked && !error) return null;

  if (submitted) {
    return (
      <div className="page-shell">
        <div style={{ maxWidth: 600 }} className="fade-up">
          <div className="page-header">
            <h1>Created</h1>
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Listing is live.
            {fields.is_featured && adminMode && " Featured on the home page."}
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
            <button className="btn" onClick={() => {
              setSubmitted(false);
              setFields({ title: "", description: "", category: "", price_cents: "", image_url: "", contact_method: "EMAIL", contact_value: "", is_featured: false });
            }}>Add Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div style={{ maxWidth: 600 }} className="fade-up">
        <div className="page-header">
          <h1>New Listing</h1>
        </div>
        {error && <div className="error-state" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input name="title" value={fields.title} onChange={handleChange} placeholder="What are you offering?" />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <input name="category" value={fields.category} onChange={handleChange} placeholder="e.g. AI Tool, Consulting, Course" />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea name="description" value={fields.description} onChange={handleChange} placeholder="Describe your listing…" />
          </div>
          <div className="form-group">
            <label className="form-label">Pricing</label>
            <input name="price_cents" value={fields.price_cents} onChange={handleChange} placeholder="e.g. 4900 = $49.00 — leave blank for free" type="number" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Image URL (optional)</label>
            <input name="image_url" value={fields.image_url} onChange={handleChange} placeholder="https://…" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label">Contact via</label>
              <select name="contact_method" value={fields.contact_method} onChange={handleChange}>
                <option value="EMAIL">Email</option>
                <option value="URL">URL</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contact value *</label>
              <input name="contact_value" value={fields.contact_value} onChange={handleChange}
                placeholder={fields.contact_method === "EMAIL" ? "you@domain.com" : "https://…"} />
            </div>
          </div>
          {adminMode && (
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={fields.is_featured}
                onChange={handleChange}
                style={{ width: "auto", accentColor: "var(--accent)" }}
              />
              <label htmlFor="is_featured" className="form-label" style={{ margin: 0 }}>Featured</label>
            </div>
          )}
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ alignSelf: "flex-start" }}>
            {submitting ? "Saving…" : "Create Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
