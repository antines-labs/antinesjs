import { defineRoute } from "@antines/core";
import { s } from "@antines/schema";

export default defineRoute({
  schema: {
    output: s.object({
      status: s.string(),
      uptime: s.number(),
    }),
  },
});
