import { Link } from "react-router-dom";

export default function ListingCard({ listing, creator }) {
  const handle = creator?.handle ?? listing.creator_id;
  const price = listing.price_cents
    ? `$${(listing.price_cents / 100).toFixed(2)}`
    : "Free";

  return (
    <Link to={`/${handle}/${listing.slug}`} style={{ textDecoration: "none" }}>
      <div className="listing-card">
        {listing.category && (
          <span className="listing-card-category">{listing.category}</span>
        )}
        <h3 className="listing-card-title">{listing.title}</h3>
        <div className="listing-card-meta">
          {creator && <span>{creator.display_name}</span>}
          <span>·</span>
          <time>{new Date(listing.created_at).toLocaleDateString()}</time>
        </div>
        <span className="listing-card-price">{price}</span>
      </div>
    </Link>
  );
}
