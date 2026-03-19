import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/listings/index")
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <div className="home-hero fade-up">
        <span className="home-hero-eyebrow">Marketplace</span>
        <h1>The Index</h1>
        <p>Published work from verified creators. Backed by Append-Only Identity.</p>
      </div>

      {error && <div className="error-state" role="alert">Unable to load listings</div>}

      {loading ? (
        <div className="listing-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="listing-card skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <p>No listings yet. Be the first.</p>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
