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

// Route: Home
app.get("/", (c) => {
  return c.text("Hello Hono!");
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

export default app;
