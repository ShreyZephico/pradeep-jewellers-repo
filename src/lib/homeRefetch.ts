/** Fired when user returns to home — all data layers should refetch. */
export const HOME_REFETCH_EVENT = "pj-home-refetch";

export const NOT_FOUND_SESSION_KEY = "pj-was-404";

export function markWasOnNotFoundPage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(NOT_FOUND_SESSION_KEY, "1");
}

export function clearWasOnNotFoundPage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(NOT_FOUND_SESSION_KEY);
}

export function wasOnNotFoundPage(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(NOT_FOUND_SESSION_KEY) === "1";
}

export function dispatchHomeRefetch(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HOME_REFETCH_EVENT));
}
