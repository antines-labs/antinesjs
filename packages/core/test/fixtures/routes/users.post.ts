import { defineRoute } from "../../../src/index.js";
import { s } from "@antines/schema";

export default defineRoute({
  schema: {
    input: s.object({
      name: s.string().min(2).max(100),
      email: s.string().email(),
      role: s.enum(["admin", "member", "viewer"]),
    }),
    output: s.object({
      id: s.string().uuid(),
      name: s.string(),
      email: s.string(),
      createdAt: s.date(),
    }),
    errors: {
      email_taken: { status: 409, message: "Este e-mail já está em uso" },
    },
  },
  handler: async (_ctx) => {
    return { id: crypto.randomUUID(), name: _ctx.name, email: _ctx.email, createdAt: new Date() };
  },
});
