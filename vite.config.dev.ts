import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Development-specific Vite config with Express server
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
  },
  server: {
    host: "::",
    port: 8083,
    headers: {
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
    },
    proxy: {
      "/api": {
        target: "http://localhost:8084",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor_react: ["react", "react-dom"],
          vendor_router: ["react-router-dom"],
          vendor_ui: ["lucide-react", "@tanstack/react-query"],
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
      try {
        console.log("Starting Express server...");
        
        // Set environment variables for the server
        process.env.NODE_ENV = "development";
        
        // Dynamic import to prevent loading server during build
        const { createServer } = await import("./server");
        const app = await createServer();

        // Start the Express server on port 8084
        const expressServer = app.listen(8084, () => {
          console.log("🚀 Express server running on port 8084");
          console.log("📱 Frontend: http://localhost:8083");
          console.log("🔧 API: http://localhost:8084/api");
        });

        // Handle server errors
        expressServer.on('error', (error) => {
          console.error('Express server error:', error);
        });

        // Add Express app as middleware to Vite dev server
        server.middlewares.use(app);
        
        console.log("Express server configured successfully");
      } catch (error) {
        console.error("Failed to load Express server for development:", error);
        // Don't fail the build if server can't be loaded
      }
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
