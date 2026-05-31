import { defineRoute } from '@antinesjs/core'
import { s } from '@antinesjs/schema'

export default defineRoute({
  schema: {
    input: s.object({
      message: s.string(),
    }),
    output: s.object({
      echoed: s.string(),
    }),
  },
  handler: async (ctx) => {
    return { echoed: ctx.message as string }
  },
})
