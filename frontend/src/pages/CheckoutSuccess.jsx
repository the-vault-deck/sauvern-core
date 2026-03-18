import { useSearchParams, Link } from "react-router-dom";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Purchase Complete</h2>
      <p>Your order has been confirmed. Check your email for details.</p>
      {sessionId && (
        <p style={{ fontSize: "0.8rem", color: "#888" }}>
          Reference: {sessionId}
        </p>
      )}
      <Link to="/">Browse more</Link>
    </div>
  );
}
