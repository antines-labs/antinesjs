import { defineRoute } from "../../../../src/index.js";
import { s } from "@antinesjs/schema";

export default defineRoute({
  schema: {
    input: s.object({
      email: s.string().email(),
      password: s.string().min(8),
    }),
    output: s.object({
      token: s.string(),
      user: s.object({
        id: s.string().uuid(),
        name: s.string(),
      }),
    }),
    errors: {
      invalid_credentials: { status: 401, message: "E-mail ou senha inválidos" },
    },
  },
  handler: async (_ctx) => {
    return { token: "abc", user: { id: crypto.randomUUID(), name: _ctx.email } };
  },
});
