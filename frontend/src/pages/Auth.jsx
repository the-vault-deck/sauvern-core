import { useEffect, useState } from "react";

// Auth.jsx — SOULBOLT SSO entry point
// Receives sb_token via URL param from soulbolt.ai dashboard.
// soulbolt navigates to: https://sauvern.com/auth?sb_token=<jwt>
// POSTs the token to /api/auth/sso — backend validates and issues
// an HttpOnly cookie scoped to sauvern.com. Frontend never stores
// the token. On success, hard redirect to /. On failure, redirect
// to / unauthenticated (same as before — graceful degradation).

function isValidJwtStructure(token) {
  if (!token || typeof token !== "string") return false;
  if (token.length > 2048) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export default function Auth() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("sb_token");

    // Strip token from URL immediately — never leave it in browser history
    window.history.replaceState({}, document.title, "/auth");

    if (!token || !isValidJwtStructure(token)) {
      window.location.replace("/");
      return;
    }

    fetch("/api/auth/sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sb_token: token }),
      credentials: "include",
    })
      .then((r) => {
        // Cookie is set by the server regardless of response body.
        // Redirect on any 2xx — even if body parse fails.
        if (r.ok) {
          window.location.replace("/");
        } else {
          // Validation failed — redirect unauthenticated
          window.location.replace("/");
        }
      })
      .catch(() => {
        // Network error — redirect unauthenticated
        window.location.replace("/");
      });
  }, []);

  return null;
}
