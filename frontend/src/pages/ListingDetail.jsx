import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ListingDetail() {
  const { handle, slug } = useParams();
  const [listing, setListing] = useState(null);
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    fetch(`/api/creators/${handle}`)
      .then((r) => r.json())
      .then((c) => {
        setCreator(c);
        return fetch(`/api/listings/${c.id}/${slug}`);
      })
      .then((r) => r.json())
      .then(setListing)
      .catch(console.error);
  }, [handle, slug]);

  if (!listing) return null;

  return (
    <article>
      <h1>{listing.title}</h1>
      <p>{creator?.display_name} · {new Date(listing.created_at).toLocaleDateString()}</p>
      <div>{listing.body}</div>
    </article>
  );
}
