import postgres from "postgres";

const connectionString = process.env.DATABASE_URL ?? "";

const sql = postgres(connectionString, { prepare: false });

export default sql;
