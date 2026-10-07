// Liveness probe for the CI deploy and the public verify step. Outside the auth proxy (see the
// matcher in src/proxy.js) and free of the export API, so an API outage never makes a UI deploy
// roll back. It reports no version: the deploy checks APP_VERSION inside the container instead.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response("ok", {
    headers: { "content-type": "text/plain", "cache-control": "no-store" },
  });
}
