import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";

// Define the Bindings
type Bindings = {
  nutrillacta: KVNamespace;
  EMAIL: any;
};

// Create the Hono app
const app = new Hono<{ Bindings: Bindings }>();
app.use(cors());
// Define the API key for authentication

// Middleware for API key validation
const apiKeyMiddleware = createMiddleware(async (c, next) => {
  const email = c.req.header("Email");
  if (email !== c.env.EMAIL) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

// Route: Add user
app.post("/user", apiKeyMiddleware, async (c) => {
  const { email } = await c.req.json();
  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const KV = c.env.nutrillacta;
  const existingUser = await KV.get(email);

  if (existingUser) {
    return c.json({ error: "User already exists" }, 400);
  }

  await KV.put(email, JSON.stringify({ createdAt: new Date().toISOString() }));
  return c.json({ message: "User added successfully" }, 201);
});
app.get("/", apiKeyMiddleware, async (c) => {
  const KV = c.env.nutrillacta;
  const userData = await KV.list();

  if (!userData) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(userData);
});
app.get("/images", async (c) => {
  const KV = c.env.nutrillacta;
  const userData = await KV.get("images");

  if (!userData) {
    return c.json({ error: "User not found" }, 404);
  }
  const jsonParse = JSON.parse(userData);
  return c.json(jsonParse);
});
app.post("/images", apiKeyMiddleware, async (c) => {
  const { img } = await c.req.json();
  const KV = c.env.nutrillacta;
  try {
    await KV.put("images", JSON.stringify(img));
    c.status(200);
    return c.json({});
  } catch (error) {
    c.status(404);
    return c.json({});
  }
});
// Route: Get user
app.get("/user", async (c) => {
  const email = c.req.query("email");
  if (email == c.env.EMAIL) {
    return c.json({ email });
  }
  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const KV = c.env.nutrillacta;
  const userData = await KV.get(email);

  if (!userData) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ email, data: JSON.parse(userData) });
});
app.delete("/user", apiKeyMiddleware, async (c) => {
  const { email } = await c.req.json();
  if (email == c.env.EMAIL) {
    return c.json({ email });
  }
  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const KV = c.env.nutrillacta;
  await KV.delete(email);
  c.status(200);
  return c.json({ email });
});

export default app;
