/** Avoid SyntaxError when a route returns an HTML error page instead of JSON. */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
