import { Hono } from "hono";
import z from "zod";
import sql from "../db.ts";
import { createNotification } from "../utils/notifications.ts";
import { supabase } from "../utils/supabase.ts";
import { LoginBodySchema, RegisterBodySchema } from "../validators/auth.ts";

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

    await createNotification(
      authData.user.id,
      `Welcome to Pillarboxd, ${username}! Start by adding a show to your queue.`,
    ).catch((err) => console.error("Welcome notification failed:", err));

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

auth.post("/refresh", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = z.object({ refresh_token: z.string() }).safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Missing or invalid refresh_token" }, 400);
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: parsed.data.refresh_token,
  });

  if (error || !data.session) {
    return c.json(
      { error: error?.message ?? "Failed to refresh session" },
      401,
    );
  }

  return c.json({ session: data.session, user: data.user });
});

auth.post("/signout", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "Invalid token" }, 401);
  }

  const { error: signOutError } = await supabase.auth.admin.signOut(
    data.user.id,
  );
  if (signOutError) {
    return c.json({ error: signOutError.message }, 500);
  }

  return c.json({ message: "Signed out successfully" });
});

export default auth;
