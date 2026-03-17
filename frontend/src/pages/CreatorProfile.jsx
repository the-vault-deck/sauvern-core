import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CreatorHeader from "../components/CreatorHeader";
import ListingCard from "../components/ListingCard";

export default function CreatorProfile() {
  const { handle } = useParams();
  const [creator, setCreator] = useState(null);
  const [listings, setListings] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/creators/${handle}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((c) => {
        if (!c) return;
        setCreator(c);
        return fetch(`/api/listings/${c.id}`)
          .then((r) => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
          })
          .then(setListings);
      })
      .catch((e) => setError(e.message));
  }, [handle]);

  if (notFound) return <div className="error-state" role="alert">Creator not found</div>;
  if (error) return <div className="error-state" role="alert">Unable to load profile</div>;
  if (!creator) return null;

  return (
    <div>
      <CreatorHeader creator={creator} />
      <div className="listing-grid">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} creator={creator} />
        ))}
      </div>
    </div>
  );
}
