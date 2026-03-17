import { Link } from "react-router-dom";

export default function ListingCard({ listing, creator }) {
  const handle = creator?.handle ?? listing.creator_id;
  return (
    <div>
      <Link to={`/${handle}/${listing.slug}`}>
        <h3>{listing.title}</h3>
      </Link>
      {creator && <span>{creator.display_name}</span>}
      <time>{new Date(listing.created_at).toLocaleDateString()}</time>
    </div>
  );
}
