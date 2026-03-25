import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const SOULBOLT_URL = "https://soulbolt.ai";

export default function ListingDetail() {
  const { handle, slug } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [creator, setCreator] = useState(null);
  const [error, setError] = useState(null);

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

  // Trial acquisition: redirect to soulbolt.ai with ?acquire=<product_id>.
  // soulbolt.ai checks for an existing session on load:
  //   - Authenticated: fires /api/start directly with localStorage Bearer token.
  //   - Not authenticated: shows login, then fires /api/start after auth.
  // This runs entirely in the browser — Cloudflare sees a legitimate browser
  // request with the user's actual session, not a server-to-server call.
  function handleBeginTrial() {
    const encodedProductId = encodeURIComponent(listing.product_id);
    window.location.href = `${SOULBOLT_URL}/?acquire=${encodedProductId}`;
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
        <div className="listing-detail-cta">
          {isTrial ? (
            <button className="btn btn-primary" onClick={handleBeginTrial}>
              Begin 14-Day Trial
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
