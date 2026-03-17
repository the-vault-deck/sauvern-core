import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/listings/index")
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(setListings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="listing-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="listing-card skeleton" aria-hidden="true" />
      ))}
    </div>
  );

  if (error) return (
    <div className="error-state" role="alert">
      Unable to load listings
    </div>
  );

  return (
    <div className="listing-grid">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
