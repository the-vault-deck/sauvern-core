import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CreatorHeader from "../components/CreatorHeader";
import ListingCard from "../components/ListingCard";

export default function CreatorProfile() {
  const { handle } = useParams();
  const [creator, setCreator] = useState(null);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetch(`/api/creators/${handle}`)
      .then((r) => r.json())
      .then(setCreator)
      .catch(console.error);
  }, [handle]);

  useEffect(() => {
    if (!creator) return;
    fetch(`/api/listings/${creator.id}`)
      .then((r) => r.json())
      .then(setListings)
      .catch(console.error);
  }, [creator]);

  if (!creator) return null;

  return (
    <div>
      <CreatorHeader creator={creator} />
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} creator={creator} />
      ))}
    </div>
  );
}
