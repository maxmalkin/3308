import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { RegisterBodySchema, LoginBodySchema } from "../validators/auth.ts";
import { supabase } from "../utils/supabase.ts";

const auth = new Hono();

auth.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = RegisterBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { email, password, username, owned_services } = parsed.data;

  const existing = await sql`
    SELECT 1 FROM public."user" WHERE username = ${username}
  `;
  if (existing.length > 0) {
    return c.json({ error: "Username already taken" }, 409);
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return c.json(
      { error: authError?.message ?? "Failed to create account" },
      400,
    );
  }

  try {
    const [user] = await sql`
      INSERT INTO public."user" (id, username, email, owned_services)
      VALUES (${authData.user.id}, ${username}, ${email}, ${sql.array(owned_services)})
      RETURNING id, username, email, owned_services
    `;
    return c.json({ user, session: authData.session }, 201);
  } catch {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return c.json({ error: "Failed to create user profile" }, 500);
  }
});

auth.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = LoginBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: z.treeifyError(parsed.error) }, 400);
  }

  const { email, password } = parsed.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return c.json({ error: error.message }, 401);
  }

  return c.json({ session: data.session, user: data.user });
});

export default auth;
