import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const SOULBOLT_API = "https://soulbolt.ai";

export default function ListingDetail() {
  const { handle, slug } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [creator, setCreator] = useState(null);
  const [error, setError] = useState(null);
  const [trialState, setTrialState] = useState(null); // null | "loading" | "success" | "already_active" | "error"

  useEffect(() => {
    fetch(`/api/creators/${handle}`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((c) => {
        setCreator(c);
        return fetch(`/api/listings/${c.id}/${slug}`);
      })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setListing)
      .catch((e) => setError(e.message));
  }, [handle, slug]);

  function handleBuyNow() {
    const token = sessionStorage.getItem("sauvern_token");
    if (!token) { navigate("/login"); return; }
    navigate("/checkout", { state: { listing_id: listing.id } });
  }

  async function handleBeginTrial() {
    const token = sessionStorage.getItem("sauvern_token");
    if (!token) { navigate("/login"); return; }

    setTrialState("loading");
    try {
      const res = await fetch(`${SOULBOLT_API}/api/account/trial/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ product: listing.product_id }),
      });
      if (res.status === 409) {
        setTrialState("already_active");
        return;
      }
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      if (!res.ok) {
        setTrialState("error");
        return;
      }
      setTrialState("success");
    } catch {
      setTrialState("error");
    }
  }

  if (error) return (
    <div className="page-shell">
      <div className="error-state fade-up" role="alert">Unable to load listing</div>
    </div>
  );
  if (!listing) return null;

  const price = listing.price_cents
    ? `$${(listing.price_cents / 100).toFixed(2)}`
    : "Free";

  // Determine CTA type
  const isTrial = !!listing.product_id;
  const isPurchase = !isTrial && !!listing.price_cents;

  return (
    <div className="page-shell">
      <div className="listing-detail fade-up">
        {listing.category && (
          <span className="listing-card-category">{listing.category}</span>
        )}
        <h1 style={{ marginTop: "0.5rem" }}>{listing.title}</h1>
        <div className="listing-detail-meta">
          {creator && (
            <Link to={`/${creator.handle}`}>{creator.display_name}</Link>
          )}
          <span>·</span>
          <time>{new Date(listing.created_at).toLocaleDateString()}</time>
        </div>
        <div className="listing-detail-body">{listing.description}</div>
        <div className="listing-detail-cta">
          {isTrial ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button
                className="btn btn-primary"
                onClick={handleBeginTrial}
                disabled={trialState === "loading" || trialState === "success" || trialState === "already_active"}
              >
                {trialState === "loading" ? "Starting..." : "Begin 14-Day Trial"}
              </button>
              {trialState === "success" && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-accent)", margin: 0 }}>
                  Trial started. Return to SOULBOLT — {listing.title} is now in your tools panel.
                </p>
              )}
              {trialState === "already_active" && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", margin: 0 }}>
                  You already have an active trial for this tool.
                </p>
              )}
              {trialState === "error" && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-danger)", margin: 0 }}>
                  Something went wrong. Try again.
                </p>
              )}
            </div>
          ) : isPurchase ? (
            <>
              <span className="listing-price-display">{price}</span>
              <button className="btn btn-primary" onClick={handleBuyNow}>
                Buy Now
              </button>
            </>
          ) : listing.contact_method === "EMAIL" ? (
            <a className="btn btn-primary" href={`mailto:${listing.contact_value}`}>
              Contact Creator
            </a>
          ) : (
            <a className="btn btn-primary" href={listing.contact_value} target="_blank" rel="noreferrer">
              Visit Link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
