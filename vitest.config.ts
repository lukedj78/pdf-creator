import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      include: [
        "packages/api/src/**",
        "packages/template-engine/src/**",
        "packages/sdk/src/**",
        "packages/mcp/src/**",
        "packages/auth/src/**",
        "apps/web/lib/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@workspace/db": path.resolve(__dirname, "packages/db/src"),
      "@workspace/db/schema": path.resolve(
        __dirname,
        "packages/db/src/schema"
      ),
      "@workspace/db/client": path.resolve(
        __dirname,
        "packages/db/src/client"
      ),
      "@workspace/auth": path.resolve(__dirname, "packages/auth/src"),
      "@workspace/api": path.resolve(__dirname, "packages/api/src"),
      "@workspace/api/handler": path.resolve(
        __dirname,
        "packages/api/src/handler"
      ),
    },
  },
})
