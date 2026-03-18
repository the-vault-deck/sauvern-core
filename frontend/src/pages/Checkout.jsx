import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const listingId = location.state?.listing_id;

  useEffect(() => {
    if (!listingId) {
      navigate("/");
      return;
    }

    const token = localStorage.getItem("sb_token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch("/api/checkout/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ listing_id: listingId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.session_url) {
          window.location.href = data.session_url;
        } else {
          setError("Could not create checkout session.");
        }
      })
      .catch(() => setError("Network error. Please try again."));
  }, [listingId, navigate]);

  if (error) return <div style={{ padding: "2rem", color: "red" }}>{error}</div>;
  return <div style={{ padding: "2rem" }}>Redirecting to checkout...</div>;
}
