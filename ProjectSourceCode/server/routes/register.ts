import { Hono } from "hono";
import sql from "../db.js";
import { RegisterBodySchema } from "../types/register.js";
import z from "zod";

const register = new Hono();

register.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = RegisterBodySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { username, owned_services } = parsed.data;

  const existing = await sql`
    SELECT 1 FROM public."user" WHERE username = ${username}
  `;

  if (existing.length > 0) {
    return c.json({ error: "Username already taken" }, 409);
  }

  const [user] = await sql`
    INSERT INTO public."user" (username, owned_services)
    VALUES (${username}, ${sql.array(owned_services)})
    RETURNING id, username, owned_services
  `;

  return c.json({ user }, 201);
});

export default register;
