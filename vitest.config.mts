import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["core/__tests__/**/*.test.ts", "core/laplace/__tests__/**/*.test.ts", "daemon/src/__tests__/**/*.test.ts", "lib/radar/**/*.test.ts"] },
});
