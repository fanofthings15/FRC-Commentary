// Vite's dev-server WS proxy has shown real, reproducible failures for this
// specific connection (confirmed via browser devtools: the connection
// attempt fails outright, while REST calls through the same /api proxy work
// fine) - so in dev we skip the proxy entirely and connect straight to the
// backend's port. WebSocket connections aren't subject to the same
// same-origin restrictions that make proxying necessary for fetch()/XHR, so
// this works cross-port without any CORS configuration.
//
// In production, the backend serves both the built UI and this socket on
// the same origin, so there's no proxy involved at all - window.location
// is correct there.
export function getAlertsWsUrl(): string {
  if (import.meta.env.DEV) {
    // Explicit IPv4 loopback, not "localhost" - Firefox in particular can
    // resolve "localhost" to the IPv6 loopback (::1), which may not match
    // whatever interface the backend actually ended up bound to. This is
    // exactly the kind of thing that makes a connection succeed when
    // initiated by Node (e.g. Vite's own proxy) but fail when initiated
    // directly by the browser.
    return "ws://127.0.0.1:3010/ws/alerts";
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/alerts`;
}
