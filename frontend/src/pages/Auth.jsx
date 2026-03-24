import { useEffect } from "react";

// Auth.jsx — SOULBOLT SSO entry point
// Receives sb_token via URL param from soulbolt.ai dashboard.
// soulbolt navigates to: https://sauvern.com/auth?sb_token=<jwt>
// Validates JWT structure (3 dot-separated segments, non-empty) before
// writing to sessionStorage. Malformed tokens are discarded — redirect
// fires without token, user lands on home unauthenticated.
// Uses window.location.replace("/") — full page reload forces Nav to
// remount and resolveToken() picks up the token from sessionStorage.

function isValidJwtStructure(token) {
  if (!token || typeof token !== "string") return false;
  if (token.length > 2048) return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export default function Auth() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("sb_token");

    if (token && isValidJwtStructure(token)) {
      sessionStorage.setItem("sb_token", token);
      // Strip token from URL before redirect — never leave it in browser history
      window.history.replaceState({}, document.title, "/auth");
    }

    // Hard redirect — forces full page reload so Nav re-mounts and
    // picks up the token from sessionStorage via resolveToken().
    window.location.replace("/");
  }, []);

  return null;
}
