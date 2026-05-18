import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    env: { NODE_ENV: "test" },
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/lib/**/*.test.ts",
    ],
    exclude: [
      "node_modules",
      "dist",
      "build",
      "server/strategy/**",
      "server/coachingLoop.test.ts",
      "server/pushFoldRemoval.test.ts",
    ],
  },
});
