import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Auth.jsx — SOULBOLT SSO entry point
// Receives sb_token via URL param from soulbolt.ai dashboard.
// soulbolt navigates to: https://sauvern.com/auth?sb_token=<jwt>
// Stores token in sessionStorage (not localStorage — platform auth rule).
// Redirects to home. Mirrors the cantlie SSO pattern.

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("sb_token");

    if (token) {
      sessionStorage.setItem("sb_token", token);
      // Strip token from URL before redirect — never leave it in browser history
      window.history.replaceState({}, document.title, "/auth");
    }

    // Redirect regardless — if no token, home handles the unauthed state
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
}
