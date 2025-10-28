/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // <-- This allows "@/..." to work
    },
  },
  test: {
    // Enable UI
    ui: true,
    // Optional: Open browser automatically
    open: true,
    
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    coverage: {
      provider: "v8", // or "v8" if you prefer
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
