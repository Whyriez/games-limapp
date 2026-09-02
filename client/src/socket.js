import { io } from "socket.io-client";

// When deployed or using Cloudflare Tunnel on port 1001, Vite proxies /socket.io to port 4000.
// Using window.location.origin (or VITE_SERVER_URL if explicitly configured) guarantees seamless
// connection from phones, Cloudflare tunnels, local networks, or localhost without mixed-content errors.
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:4000");

export const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 8,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],
});
