import { defineConfig } from "drizzle-kit";
import config from "./src/common/config/index.js"

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: config.db.url,
  },
});