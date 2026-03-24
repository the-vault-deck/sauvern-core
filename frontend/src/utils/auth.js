/**
 * Fetches admin status from the server for the current session.
 * Returns true if the cookie session belongs to the admin account.
 * No privileged IDs are stored in or derived from the client bundle.
 */
export async function fetchIsAdmin() {
  try {
    const r = await fetch("/api/admin/me", { credentials: "include" });
    if (!r.ok) return false;
    const data = await r.json();
    return data.is_admin === true;
  } catch {
    return false;
  }
}
