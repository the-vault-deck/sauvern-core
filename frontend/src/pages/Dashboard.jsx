import { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";

export default function Dashboard() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("sb_token");
    fetch("/api/listings/mine/drafts", {
      headers: { Authorization: `Bearer ${token}` },
    })
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
