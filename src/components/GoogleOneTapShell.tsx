import GoogleOneTap from "@/components/GoogleOneTap";

export default function GoogleOneTapShell() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Google One Tap] Missing GOOGLE_CLIENT_ID — set it in .env.local"
      );
    }
    return null;
  }

  return <GoogleOneTap clientId={clientId} siteName="Pradeep Jewellers" />;
}
