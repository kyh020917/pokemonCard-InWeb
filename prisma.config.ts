import * as fs from "fs";
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// .env 로드 후 .env.local로 덮어쓰기 (Next.js 관례)
dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local", override: true });
}

const isSQLite = process.env.DATABASE_PROVIDER === "sqlite";

export default defineConfig({
  schema: isSQLite ? "prisma/schema.dev.prisma" : "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
