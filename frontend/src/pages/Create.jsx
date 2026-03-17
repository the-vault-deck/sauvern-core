import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Create() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("sb_token");
  if (!token) { navigate("/login"); return null; }

  const [fields, setFields] = useState({
    title: "",
    description: "",
    category: "",
    price_cents: "",
    image_url: "",
    contact_method: "EMAIL",
    contact_value: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: fields.title,
        description: fields.description,
        category: fields.category,
        contact_method: fields.contact_method,
        contact_value: fields.contact_value,
        price_cents: fields.price_cents ? parseInt(fields.price_cents, 10) : null,
        image_url: fields.image_url || null,
      };
      const r = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json();
        setError(err.detail || "Submission failed");
        return;
      }
      const created = await r.json();
      const meRes = await fetch("/api/creators/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        // /creators/me failed — fall back to dashboard
        navigate("/dashboard");
        return;
      }
      const me = await meRes.json();
      navigate(`/${me.handle}/${created.slug}`);
    } catch (e) {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {error && <div className="error-state" role="alert">{error}</div>}
      <input name="title" value={fields.title} onChange={handleChange} placeholder="Title" />
      <input name="category" value={fields.category} onChange={handleChange} placeholder="Category" />
      <textarea name="description" value={fields.description} onChange={handleChange} placeholder="Description" />
      <input name="price_cents" value={fields.price_cents} onChange={handleChange} placeholder="Price (cents)" type="number" />
      <input name="image_url" value={fields.image_url} onChange={handleChange} placeholder="Image URL" />
      <select name="contact_method" value={fields.contact_method} onChange={handleChange}>
        <option value="EMAIL">Email</option>
        <option value="URL">URL</option>
      </select>
      <input name="contact_value" value={fields.contact_value} onChange={handleChange} placeholder="Contact email or URL" />
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Saving…" : "Save listing"}
      </button>
    </div>
  );
}
