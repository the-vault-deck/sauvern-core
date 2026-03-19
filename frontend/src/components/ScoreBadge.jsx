export default function ScoreBadge({ score }) {
  return (
    <span className="score-badge">
      {Number(score).toFixed(2)}
    </span>
  );
}
