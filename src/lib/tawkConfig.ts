/** Tawk.to embed IDs from .env (NEXT_PUBLIC_* for client-side widget). */
export function getTawkEmbedConfig() {
  const propertyId =
    process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim() ||
    process.env.NEXT_TAWK_PROPERTY_ID?.trim();
  const widgetId =
    process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim() ||
    process.env.NEXT_TAWK_WIDGET_ID?.trim();

  const isConfigured = Boolean(propertyId && widgetId);

  return {
    propertyId,
    widgetId,
    isConfigured,
    embedUrl: isConfigured
      ? `https://embed.tawk.to/${propertyId}/${widgetId}`
      : null,
  };
}
