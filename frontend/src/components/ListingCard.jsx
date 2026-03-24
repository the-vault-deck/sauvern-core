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

  function handleCta(e) {
    e.preventDefault();
    if (listing.external_link || listing.contact_value) {
      window.open(listing.external_link ?? listing.contact_value, "_blank", "noopener,noreferrer");
    }
  }

  const hasCta = !!(listing.external_link || listing.contact_value);

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
        {hasCta && (
          <button className="btn btn-primary listing-card-cta" onClick={handleCta}>
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
