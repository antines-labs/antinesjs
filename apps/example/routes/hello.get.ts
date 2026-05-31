import { defineRoute } from '@antinesjs/core'
import { s } from '@antinesjs/schema'

export default defineRoute({
  schema: {
    input: s.object({
      name: s.string().min(1).max(100),
    }),
    output: s.object({
      message: s.string(),
    }),
  },
  handler: async (ctx) => {
    return { message: `Hello, ${ctx.name}!` }
  },
})
