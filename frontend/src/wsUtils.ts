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
    const host = window.location.hostname;
    // "localhost" resolves inconsistently between IPv4/IPv6 in some
    // browsers (confirmed: this caused a real connection failure in
    // Firefox) - force explicit IPv4 loopback for the same-machine case.
    // When the page was loaded from another device on the network,
    // window.location.hostname is already a concrete LAN IP with no such
    // ambiguity, so use it directly - that's what makes alerts work when
    // accessing the dev build from a second computer.
    const wsHost = host === "localhost" || host === "127.0.0.1" ? "127.0.0.1" : host;
    return `ws://${wsHost}:3010/ws/alerts`;
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/alerts`;
}
