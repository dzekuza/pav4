import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8083,
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'",
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor_react: ["react", "react-dom"],
          vendor_router: ["react-router-dom"],
          vendor_ui: [
            "lucide-react",
            "@tanstack/react-query",
          ],
        },
      },
    },
  },
  plugins: [react(), expressPlugin(), copyRedirectsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      // Dynamic import to prevent loading server during build
      const { createServer } = await import("./server");
      const app = await createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}

function copyRedirectsPlugin(): Plugin {
  return {
    name: "copy-redirects",
    writeBundle() {
      // Copy _redirects file to build output
      const redirectsPath = path.resolve(__dirname, "public/_redirects");
      const outputPath = path.resolve(__dirname, "dist/spa/_redirects");
      
      if (fs.existsSync(redirectsPath)) {
        fs.copyFileSync(redirectsPath, outputPath);
        console.log("Copied _redirects file to build output");
      }
    },
  };
}
