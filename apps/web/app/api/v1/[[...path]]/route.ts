import { Hono } from "hono"
import { createRestApi } from "@workspace/rest-api"
import { handle } from "hono/vercel"

const app = new Hono().basePath("/api/v1")
app.route("/", createRestApi())

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
