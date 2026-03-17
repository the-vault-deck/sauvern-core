import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ListingDetail() {
  const { handle, slug } = useParams();
  const [listing, setListing] = useState(null);
  const [creator, setCreator] = useState(null);
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
        return fetch(`/api/listings/${c.id}/${slug}`)
          .then((r) => {
            if (r.status === 404) { setNotFound(true); return null; }
            if (!r.ok) throw new Error(r.status);
            return r.json();
          })
          .then((l) => { if (l) setListing(l); });
      })
      .catch((e) => setError(e.message));
  }, [handle, slug]);

  if (notFound) return <div className="error-state" role="alert">Listing not found</div>;
  if (error) return <div className="error-state" role="alert">Unable to load listing</div>;
  if (!listing) return null;

  return (
    <article>
      <h1>{listing.title}</h1>
      <p>{creator?.display_name} · {new Date(listing.created_at).toLocaleDateString()}</p>
      <div>{listing.description}</div>
      <div data-hold="ie-integration" style={{ display: "none" }} />
    </article>
  );
}
