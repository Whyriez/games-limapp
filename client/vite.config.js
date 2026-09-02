import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 1001,
    strictPort: false,
    host: true,
    allowedHosts: true, // Allow Cloudflare Tunnel and any external hostnames
    proxy: {
      // Proxy Socket.IO WebSocket and HTTP polling to backend
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
        changeOrigin: true,
      },
      // Proxy REST API requests to backend
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
