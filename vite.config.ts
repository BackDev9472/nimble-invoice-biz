import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import reactSwc from "@vitejs/plugin-react-swc"; // Optional: SWC for prod
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      // Use Babel for dev (better debugging), SWC for prod (faster builds)
      isProduction ? reactSwc() : react(),
      !isProduction && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});