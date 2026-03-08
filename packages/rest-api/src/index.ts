import { Hono } from "hono"
import { cors } from "hono/cors"
import { apiKeyMiddleware } from "./middleware/api-key"
import type { ApiEnv } from "./middleware/api-key"
import templates from "./routes/templates"
import generations from "./routes/generations"
import generate from "./routes/generate"
import usage from "./routes/usage"

export function createRestApi() {
  const api = new Hono<ApiEnv>()

  api.use("/*", cors())
  api.use("/*", apiKeyMiddleware)

  api.route("/templates", templates)
  api.route("/generations", generations)
  api.route("/generate", generate)
  api.route("/usage", usage)

  return api
}

export type { ApiEnv, ApiKeyContext } from "./middleware/api-key"
