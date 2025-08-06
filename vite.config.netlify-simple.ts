import { defineConfig } from "vite";
import path from "path";

// Simple Netlify Functions build configuration
export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, "server/netlify-server.ts"),
            name: "netlifyServer",
            fileName: "netlify-server",
            formats: ["es"],
        },
        outDir: "netlify/functions/dist",
        target: "node22",
        ssr: true,
        rollupOptions: {
            external: [
                // Node.js built-ins
                "fs",
                "path",
                "url",
                "http",
                "https",
                "os",
                "crypto",
                "stream",
                "util",
                "events",
                "buffer",
                "querystring",
                "child_process",
                // External dependencies that should not be bundled
                "express",
                "cors",
                "serverless-http",
                "dotenv",
                "helmet",
                "compression",
                "cookie-parser",
                "@prisma/client",
                "@netlify/neon",
                "bcryptjs",
                "jsonwebtoken",
            ],
            output: {
                format: "es",
                entryFileNames: "netlify-server.mjs",
            },
        },
        minify: false, // Keep readable for debugging
        sourcemap: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./client"),
            "@shared": path.resolve(__dirname, "./shared"),
        },
    },
    define: {
        "process.env.NODE_ENV": '"production"',
    },
}); 