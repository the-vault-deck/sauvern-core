import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const listingId = location.state?.listing_id;

  useEffect(() => {
    if (!listingId) { navigate("/"); return; }

    fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ listing_id: listingId }),
    })
      .then((r) => {
        if (r.status === 401) { navigate("/login"); return null; }
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.session_url) { window.location.href = data.session_url; }
        else { setError("Could not create checkout session."); }
      })
      .catch(() => setError("Network error. Please try again."));
  }, [listingId, navigate]);

  if (error) return (
    <div className="page-shell">
      <div className="redirect-shell fade-up">
        <div className="error-state">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <div className="redirect-shell fade-up">
        <div className="spinner" />
        <span>Redirecting to checkout…</span>
      </div>
    </div>
  );
}
