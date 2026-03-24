const ADMIN_ID = import.meta.env.VITE_SAUVERN_ADMIN_ACCOUNT_ID ?? "";

/**
 * Returns true if the current session cookie corresponds to the admin account.
 * Used client-side only to show/hide admin UI elements.
 * Server enforces the real gate — this is purely cosmetic.
 */
export function isAdmin() {
  return ADMIN_ID !== "" && document.cookie.includes("sb_session=");
}
