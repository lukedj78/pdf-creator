import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().url().optional(),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),

    // OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // AI Gateway
    AI_GATEWAY_URL: z.string().url().optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),

    // Storage
    BLOB_READ_WRITE_TOKEN: z.string().optional(),

    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // Rate limiting bypass
    SKIP_RATE_LIMIT: z
      .string()
      .transform((v) => v === "true")
      .default("false"),

    // Polar (billing)
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_WEBHOOK_SECRET: z.string().optional(),
    POLAR_AI_METER_ID: z.string().optional(),
    POLAR_PRO_PRODUCT_ID: z.string().optional(),
    POLAR_ENTERPRISE_PRODUCT_ID: z.string().optional(),
    POLAR_CREDITS_100_PRODUCT_ID: z.string().optional(),
    POLAR_CREDITS_500_PRODUCT_ID: z.string().optional(),
    POLAR_CREDITS_1000_PRODUCT_ID: z.string().optional(),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    AI_GATEWAY_URL: process.env.AI_GATEWAY_URL,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SKIP_RATE_LIMIT: process.env.SKIP_RATE_LIMIT,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    POLAR_AI_METER_ID: process.env.POLAR_AI_METER_ID,
    POLAR_PRO_PRODUCT_ID: process.env.POLAR_PRO_PRODUCT_ID,
    POLAR_ENTERPRISE_PRODUCT_ID: process.env.POLAR_ENTERPRISE_PRODUCT_ID,
    POLAR_CREDITS_100_PRODUCT_ID: process.env.POLAR_CREDITS_100_PRODUCT_ID,
    POLAR_CREDITS_500_PRODUCT_ID: process.env.POLAR_CREDITS_500_PRODUCT_ID,
    POLAR_CREDITS_1000_PRODUCT_ID: process.env.POLAR_CREDITS_1000_PRODUCT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
})
