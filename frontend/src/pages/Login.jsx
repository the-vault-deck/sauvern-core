import { useEffect } from "react";

const SOULBOLT_URL = import.meta.env.VITE_SOULBOLT_URL || "https://soulbolt.ai";

// Login.jsx — SSO redirect
// SAUVERN authentication is handled by SOULBOLT SSO only.
// Direct token entry is removed. Any hit to /login redirects
// immediately to soulbolt.ai where the user can sign in or register.
// After auth, soulbolt.ai navigates to sauvern.com/auth?sb_token=<jwt>.

export default function Login() {
  useEffect(() => {
    window.location.replace(SOULBOLT_URL);
  }, []);

  return (
    <div className="auth-shell">
      <div className="auth-card fade-up">
        <h1 className="auth-card-title">Redirecting to SOULBOLT...</h1>
        <p className="auth-card-sub">Sign in with your SOULBOLT account to access SAUVERN.</p>
      </div>
    </div>
  );
}
