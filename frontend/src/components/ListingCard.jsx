import { Link } from "react-router-dom";

export default function ListingCard({ listing, creator }) {
  const handle = creator?.handle ?? listing.creator_id;
  const listingType = listing.listing_type
    ?? (listing.product_id ? "trial" : listing.price_cents != null ? "purchase" : "contact");

  const priceLabel = listingType === "contact"
    ? null
    : listing.price_cents != null
      ? `$${(listing.price_cents / 100).toFixed(2)}`
      : null;

  const ctaLabel =
    listingType === "trial" ? "Start Trial" :
    listingType === "purchase" ? "Buy Now" :
    "Contact";

  // Trial and purchase listings link to the detail page for the full CTA flow.
  // Contact listings open their external link directly.
  const detailPath = (listingType === "trial" || listingType === "purchase")
    ? `/${handle}/${listing.slug}`
    : null;

  function handleContactCta(e) {
    e.preventDefault();
    if (listing.external_link || listing.contact_value) {
      window.open(listing.external_link ?? listing.contact_value, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="listing-card">
      {listing.category && (
        <span className="listing-card-category">{listing.category}</span>
      )}
      <h3 className="listing-card-title">{listing.title}</h3>
      {listing.description && (
        <p className="listing-card-desc">{listing.description}</p>
      )}
      <div className="listing-card-meta">
        {creator?.avatar_url && (
          <img
            src={creator.avatar_url}
            alt={creator.display_name}
            className="listing-card-avatar"
          />
        )}
        {creator?.display_name && <span>{creator.display_name}</span>}
      </div>
      <div className="listing-card-footer">
        {priceLabel && <span className="listing-card-price">{priceLabel}</span>}
        {detailPath ? (
          <Link to={detailPath} className="btn btn-primary listing-card-cta">
            {ctaLabel}
          </Link>
        ) : (listing.external_link || listing.contact_value) ? (
          <button className="btn btn-primary listing-card-cta" onClick={handleContactCta}>
            {ctaLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
