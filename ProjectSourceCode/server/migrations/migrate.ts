import fs from "node:fs";
import path from "node:path";
import sql from "../db.ts";

async function migrate() {
  const migrationsDir = path.dirname(new URL(import.meta.url).pathname);
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    console.log(`Running migration: ${file}`);
    await sql.unsafe(content);
    console.log(`  ✓ ${file}`);
  }

  console.log("All migrations complete.");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
