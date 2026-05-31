import { defineRoute } from "../../../src/index.js";
import { s } from "@antines/schema";

export default defineRoute({
  schema: {
    output: s.object({
      status: s.string(),
      uptime: s.number(),
    }),
  },
  // no handler, because Go-only
});
