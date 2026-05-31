import { defineRoute } from '@antinesjs/core'
import { s } from '@antinesjs/schema'

export default defineRoute({
  schema: {
    output: s.object({
      status: s.string(),
      uptime: s.number(),
    }),
  },
})
