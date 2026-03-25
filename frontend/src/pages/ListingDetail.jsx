import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function ListingDetail() {
  const { handle, slug } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [creator, setCreator] = useState(null);
  const [error, setError] = useState(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState(null);

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
    navigate("/checkout", { state: { listing_id: listing.id } });
  }

  // Trial acquisition: POST to sauvern-core proxy.
  // sauvern-core reads sb_token from HttpOnly cookie and forwards it as
  // a Bearer header to soulbolt.ai/api/start — browser cannot set headers
  // on a raw navigation, so direct window.location.href would always redirect
  // to /login. Proxy resolves this without ever exposing the token.
  async function handleBeginTrial() {
    setTrialLoading(true);
    setTrialError(null);
    try {
      const res = await fetch(`/api/trial/start?product_id=${encodeURIComponent(listing.product_id)}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setTrialError(body.detail || "Trial start failed. Please try again.");
        return;
      }
      const { redirect_url } = await res.json();
      window.location.href = redirect_url;
    } catch (e) {
      setTrialError("Network error. Please try again.");
    } finally {
      setTrialLoading(false);
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

  const isTrial    = !!listing.product_id;
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
        {trialError && (
          <div className="error-state" role="alert" style={{ marginBottom: "1rem" }}>
            {trialError}
          </div>
        )}
        <div className="listing-detail-cta">
          {isTrial ? (
            <button
              className="btn btn-primary"
              onClick={handleBeginTrial}
              disabled={trialLoading}
            >
              {trialLoading ? "Starting…" : "Begin 14-Day Trial"}
            </button>
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
