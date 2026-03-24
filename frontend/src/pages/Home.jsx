import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";

export default function Home() {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  function fetchFeatured(cursor, append) {
    const url = cursor
      ? `/api/listings/featured?limit=12&cursor=${encodeURIComponent(cursor)}`
      : "/api/listings/featured?limit=12";

    return fetch(url)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        setItems((prev) => append ? [...prev, ...data.items] : data.items);
        setNextCursor(data.next_cursor);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    fetchFeatured(null, false).finally(() => setLoading(false));
  }, []);

  function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    fetchFeatured(nextCursor, true).finally(() => setLoadingMore(false));
  }

  return (
    <div className="page-shell">
      <div className="home-hero fade-up">
        <span className="home-hero-eyebrow">Marketplace</span>
        <h1>Featured</h1>
        <p>Curated work from verified creators. Backed by Append-Only Identity.</p>
      </div>

      {error && <div className="error-state" role="alert">Unable to load listings</div>}

      {loading ? (
        <div className="listing-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="listing-card skeleton" aria-hidden="true" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No listings available.</p>
        </div>
      ) : (
        <>
          <div className="listing-grid">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} creator={l.creator} />
            ))}
          </div>
          {nextCursor && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
              <button
                className="btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
