import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
