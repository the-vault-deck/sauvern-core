import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Create() {
  const navigate = useNavigate();
  const token = localStorage.getItem("sb_token");
  if (!token) { navigate("/login"); return null; }

  const [profileChecked, setProfileChecked] = useState(false);
  const [fields, setFields] = useState({
    title: "", description: "", category: "",
    price_cents: "", image_url: "",
    contact_method: "EMAIL", contact_value: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/creators/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 404) { navigate("/creators/setup"); return; }
        if (!r.ok) { setError("Unable to verify creator profile"); return; }
        setProfileChecked(true);
      })
      .catch(() => setError("Network error checking profile"));
  }, []);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!fields.title.trim()) { setError("Title required"); return; }
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
      };
      const r = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { const err = await r.json(); setError(err.detail || "Submission failed"); return; }
      const created = await r.json();
      const meRes = await fetch("/api/creators/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!meRes.ok) { navigate("/dashboard"); return; }
      const me = await meRes.json();
      navigate(`/${me.handle}/${created.slug}`);
    } catch { setError("Network error — please try again"); }
    finally { setSubmitting(false); }
  }

  if (!profileChecked && !error) return null;

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
            <label className="form-label">Category</label>
            <input name="category" value={fields.category} onChange={handleChange} placeholder="e.g. Consulting, Template, Course" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="description" value={fields.description} onChange={handleChange} placeholder="Describe your listing…" />
          </div>
          <div className="form-group">
            <label className="form-label">Price (cents) — leave blank for free</label>
            <input name="price_cents" value={fields.price_cents} onChange={handleChange} placeholder="e.g. 4900 = $49.00" type="number" min="0" />
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
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ alignSelf: "flex-start" }}>
            {submitting ? "Publishing…" : "Publish Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
