export default function ScoreBadge({ rawScore }) {
  return <span>{(rawScore / 10000).toFixed(2)}</span>;
}
