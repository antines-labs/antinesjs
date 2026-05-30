export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

const VALID_METHODS = new Set<string>(['get', 'post', 'put', 'delete', 'patch', 'head', 'options'])

export interface ScannedRoute {
  method: HttpMethod
  path: string
  params: string[]
  handlerFile: string
}

/**
 * Parse the name of a route file and extract the method, path, and params.
 *
 * Examples:
 *   "users.get.ts", this method is GET with path: /users, with params: []
 *   "users.[id].get.ts" this method is GET, with path: /users/:id, with params: ["id"]
 *   "auth/login.post.ts" this method is POST, with path: /auth/login, with params: []
 *   "users.[id].posts.post.ts" this method is POST, with path: /users/:id/posts, with params: ["id"]
 */
export function scanRouteFile(relativePath: string): ScannedRoute {
  const withoutExt = relativePath.replace(/\.ts$/, '')

  const lastSlash = withoutExt.lastIndexOf('/')
  const dirPart = lastSlash >= 0 ? withoutExt.slice(0, lastSlash) : ''
  const basename = lastSlash >= 0 ? withoutExt.slice(lastSlash + 1) : withoutExt

  const segments = basename.split('.')
  const methodStr = segments.pop()
  if (!methodStr || !VALID_METHODS.has(methodStr)) {
    throw new Error(
      `Invalid method "${methodStr}" in "${relativePath}". ` +
      `Method must be one of: ${[...VALID_METHODS].join(', ')}`
    )
  }
  const method = methodStr.toUpperCase() as HttpMethod

  const pathNameSegments = segments
  if (pathNameSegments.length === 0) {
    throw new Error(`Missing path name in "${relativePath}"`)
  }

  const allSegments: string[] = []
  if (dirPart) {
    allSegments.push(...dirPart.split('/'))
  }
  allSegments.push(...pathNameSegments)

  const params: string[] = []
  const pathParts = allSegments.map((seg) => {
    const paramMatch = seg.match(/^\[(.+)\]$/)
    if (paramMatch) {
      params.push(paramMatch[1]!)
      return `:${paramMatch[1]}`
    }
    // Filter out "index" only if it's the last segment and dir is non-empty
    // (keeps the logic simple for now — index is a regular segment)
    return seg
  })

  const path = '/' + pathParts.join('/')

  return { method, path, params, handlerFile: relativePath }
}
