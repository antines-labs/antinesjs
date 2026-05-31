import { defineRoute } from '@antines/core'
import { s } from '@antines/schema'

export default defineRoute({
  schema: {
    input: s.object({
      message: s.string(),
      autor: s.string(),
    }),
    output: s.object({
      echoed: s.string(),
    }),
  },
  handler: async (ctx) => {
    return { echoed: `Echo: ${ctx.message} (by ${ctx.autor})` }
  },
})
