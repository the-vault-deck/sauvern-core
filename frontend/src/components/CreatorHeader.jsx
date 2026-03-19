import ScoreBadge from "./ScoreBadge";

export default function CreatorHeader({ creator }) {
  const initials = creator.display_name
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="creator-header">
      {creator.avatar_url ? (
        <img className="creator-avatar" src={creator.avatar_url} alt={creator.display_name} />
      ) : (
        <div className="creator-avatar-placeholder">{initials}</div>
      )}
      <div className="creator-info">
        <h1>{creator.display_name}</h1>
        <span className="creator-handle">@{creator.handle}</span>
        {creator.bio && <p className="creator-bio">{creator.bio}</p>}
        <ScoreBadge score={creator.influence_score_display ?? 0} />
      </div>
    </header>
  );
}
