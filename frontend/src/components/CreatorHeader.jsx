import ScoreBadge from "./ScoreBadge";

export default function CreatorHeader({ creator }) {
  return (
    <header>
      {creator.avatar_url && <img src={creator.avatar_url} alt={creator.display_name} />}
      <h1>{creator.display_name}</h1>
      <span>@{creator.handle}</span>
      {creator.bio && <p>{creator.bio}</p>}
      <ScoreBadge rawScore={creator.influence_score_cache ?? 0} />
    </header>
  );
}
