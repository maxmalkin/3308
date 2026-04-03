import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.dirname(new URL(import.meta.url).pathname);
const name = process.argv[2];

if (!name) {
	console.error("Usage: pnpm migrate:create <name>");
	process.exit(1);
}

const existing = fs
	.readdirSync(migrationsDir)
	.filter((f) => f.endsWith(".sql"))
	.sort();

const lastNum = existing.reduce((max, f) => {
	const match = f.match(/^(\d+)/);
	return match ? Math.max(max, parseInt(match[1], 10)) : max;
}, 0);

const nextNum = String(lastNum + 1).padStart(3, "0");
const fileName = `${nextNum}_${name}.sql`;
const filePath = path.join(migrationsDir, fileName);

fs.writeFileSync(filePath, "", "utf-8");
console.log(`Created: migrations/${fileName}`);
