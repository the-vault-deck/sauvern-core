import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatorSetup() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("sb_token");
  if (!token) { navigate("/login"); return null; }

  const [fields, setFields] = useState({
    display_name: "",
    handle: "",
    bio: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    if (!fields.display_name.trim()) { setError("Display name is required"); return; }
    if (!fields.handle.trim()) { setError("Handle is required"); return; }

    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        display_name: fields.display_name.trim(),
        handle: fields.handle.trim(),
        bio: fields.bio.trim() || null,
      };
      const r = await fetch("/api/creators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json();
        setError(err.detail || "Profile creation failed");
        return;
      }
      navigate("/create");
    } catch (e) {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Set up your creator profile</h1>
      {error && <div className="error-state" role="alert">{error}</div>}
      <input
        name="display_name"
        value={fields.display_name}
        onChange={handleChange}
        placeholder="Display name"
        required
      />
      <input
        name="handle"
        value={fields.handle}
        onChange={handleChange}
        placeholder="Handle (e.g. yourname)"
        required
      />
      <textarea
        name="bio"
        value={fields.bio}
        onChange={handleChange}
        placeholder="Bio (optional)"
      />
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Creating…" : "Create profile"}
      </button>
    </div>
  );
}
