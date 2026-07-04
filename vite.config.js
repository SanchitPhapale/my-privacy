import { defineConfig } from "vite";

export default defineConfig({
 root: "src",
  server: {
    host: true,
    proxy: {
      "/socket.io": {
        target: "http://localhost:3600",
        ws: true,
        changeOrigin: true,
      },
      "/upload": {
        target: "http://localhost:3600",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3600",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist",
  },
});
