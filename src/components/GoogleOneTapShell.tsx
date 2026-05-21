import GoogleOneTap from "@/components/GoogleOneTap";

export default function GoogleOneTapShell() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;
  return <GoogleOneTap clientId={clientId} siteName="Pradeep Jewellers" />;
}
