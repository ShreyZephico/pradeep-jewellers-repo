export const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";

const BLOCKED_PREFIXES = ["/login", "/signup"];

function isSafeReturnPath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !BLOCKED_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

/** Remember where the user was before opening login. */
export function saveReturnPath(path?: string): void {
  if (typeof window === "undefined") return;

  const next =
    path ?? `${window.location.pathname}${window.location.search}`;

  if (!isSafeReturnPath(next)) return;

  localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, next);
}

export function getReturnPathFromSearch(
  searchParams: URLSearchParams
): string | null {
  const returnTo = searchParams.get("returnTo");
  if (returnTo && isSafeReturnPath(returnTo)) {
    return returnTo;
  }
  return null;
}

/** Read and clear stored return path (falls back to home). */
export function consumeReturnPath(): string {
  if (typeof window === "undefined") return "/";

  const stored = localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
  localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);

  if (stored && isSafeReturnPath(stored)) {
    return stored;
  }

  return "/";
}
