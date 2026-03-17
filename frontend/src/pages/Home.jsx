import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";

export default function Home() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetch("/api/listings/index")
      .then((r) => r.json())
      .then(setListings)
      .catch(console.error);
  }, []);

  return (
    <div>
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
