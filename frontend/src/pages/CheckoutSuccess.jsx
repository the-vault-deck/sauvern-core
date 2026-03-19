import { useSearchParams, Link } from "react-router-dom";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="page-shell">
      <div className="success-shell fade-up">
        <div className="check-icon">✓</div>
        <h2>Purchase Complete</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Your order is confirmed. Check your email for details.
        </p>
        {sessionId && <span className="session-ref">ref: {sessionId}</span>}
        <Link to="/" className="btn btn-ghost" style={{ marginTop: "0.5rem" }}>
          Browse more
        </Link>
      </div>
    </div>
  );
}
