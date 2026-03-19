import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatorSetup() {
  const navigate = useNavigate();
  const token = localStorage.getItem("sb_token");
  if (!token) { navigate("/login"); return null; }

  const [fields, setFields] = useState({ display_name: "", handle: "", bio: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!fields.display_name.trim()) { setError("Display name required"); return; }
    if (!fields.handle.trim()) { setError("Handle required"); return; }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          display_name: fields.display_name.trim(),
          handle: fields.handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
          bio: fields.bio.trim() || null,
        }),
      });
      if (!r.ok) { const err = await r.json(); setError(err.detail || "Profile creation failed"); return; }
      navigate("/create");
    } catch { setError("Network error — please try again"); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card fade-up">
        <div>
          <h1 className="auth-card-title">Creator Profile</h1>
          <p className="auth-card-sub">Set up your public identity before publishing.</p>
        </div>
        {error && <div className="error-state" role="alert">{error}</div>}
        <div className="form-stack">
          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input name="display_name" value={fields.display_name} onChange={handleChange} placeholder="How you appear publicly" />
          </div>
          <div className="form-group">
            <label className="form-label">Handle *</label>
            <input name="handle" value={fields.handle} onChange={handleChange} placeholder="yourhandle" />
          </div>
          <div className="form-group">
            <label className="form-label">Bio (optional)</label>
            <textarea name="bio" value={fields.bio} onChange={handleChange} placeholder="Tell people who you are" style={{ minHeight: 80 }} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating…" : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
