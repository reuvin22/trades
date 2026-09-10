import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'

/**
 * Runs the files in `api/` during `vite dev`.
 *
 * Without this, /api/* falls through to the SPA fallback and returns index.html,
 * so anything calling an endpoint locally silently gets HTML instead of JSON.
 * Serving the real handlers means local development exercises the same code
 * that Vercel runs in production.
 */
export function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',

    configureServer(server) {
      // Vite only exposes VITE_-prefixed variables to the client. Server-side
      // secrets live unprefixed, so lift them into process.env for the handlers.
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()

        const route = url.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '')
        const file = resolve(process.cwd(), 'api', `${route}.ts`)

        if (route === '' || route.includes('..') || !existsSync(file)) return next()

        try {
          const module = await server.ssrLoadModule(file)
          const handler = module.default

          if (typeof handler !== 'function') {
            res.statusCode = 500
            res.end(JSON.stringify({ error: `api/${route}.ts has no default export.` }))
            return
          }

          await handler(await asVercelRequest(req, url), asVercelResponse(res))
        } catch (cause) {
          server.config.logger.error(
            `[dev-api] ${route} failed: ${cause instanceof Error ? cause.stack : String(cause)}`,
          )
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(
              JSON.stringify({
                error: cause instanceof Error ? cause.message : 'Handler threw.',
              }),
            )
          }
        }
      })
    },
  }
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return undefined

  const raw = Buffer.concat(chunks).toString('utf8')
  if (raw.trim() === '') return undefined

  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** Adds the few extras a Vercel handler expects on top of IncomingMessage. */
async function asVercelRequest(req: IncomingMessage, url: string) {
  const parsed = new URL(url, 'http://localhost')
  return Object.assign(req, {
    query: Object.fromEntries(parsed.searchParams),
    cookies: {},
    body: await readBody(req),
  })
}

/** Adds the Express-style helpers a Vercel handler expects. */
function asVercelResponse(res: ServerResponse) {
  const shim = res as ServerResponse & {
    status: (code: number) => typeof shim
    json: (payload: unknown) => typeof shim
    send: (payload: unknown) => typeof shim
  }

  shim.status = (code: number) => {
    shim.statusCode = code
    return shim
  }

  shim.json = (payload: unknown) => {
    shim.setHeader('content-type', 'application/json')
    shim.end(JSON.stringify(payload))
    return shim
  }

  shim.send = (payload: unknown) => {
    shim.end(typeof payload === 'string' ? payload : JSON.stringify(payload))
    return shim
  }

  return shim
}
