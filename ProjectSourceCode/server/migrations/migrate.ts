import fs from "node:fs";
import path from "node:path";
import sql from "../db.ts";

async function migrate() {
	await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS public.migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

	const migrationsDir = path.dirname(new URL(import.meta.url).pathname);
	const files = fs
		.readdirSync(migrationsDir)
		.filter((f) => f.endsWith(".sql"))
		.sort();

	// Get already-applied migrations
	const applied = await sql`SELECT name FROM public.migrations`;
	const appliedSet = new Set(applied.map((r) => r.name));

	for (const file of files) {
		if (appliedSet.has(file)) {
			console.log(`${file} (already applied)`);
			continue;
		}

		const filePath = path.join(migrationsDir, file);
		const content = fs.readFileSync(filePath, "utf-8");
		console.log(`Running migration: ${file}`);
		await sql.unsafe(content);
		await sql`INSERT INTO public.migrations (name) VALUES (${file})`;
		console.log(`Done: ${file}`);
	}

	console.log("All migrations complete.");
	await sql.end();
}

migrate().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
