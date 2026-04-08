import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CALENDLY_URL: z.string().url()
});

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_SUPABASE_JWT_TEMPLATE: z.string().min(1).default("supabase"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  AI_GATEWAY_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  HUBSPOT_ACCESS_TOKEN: z.string().min(1),
  HUBSPOT_PORTAL_ID: z.string().min(1),
  HUBSPOT_CONTACT_FORM_GUID: z.string().min(1),
  HUBSPOT_DEMO_FORM_GUID: z.string().min(1)
});

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
}

function parseClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CALENDLY_URL: process.env.NEXT_PUBLIC_CALENDLY_URL
  });

  if (!parsed.success) {
    throw new Error(`Invalid client environment variables:\n${formatZodError(parsed.error)}`);
  }

  return parsed.data;
}

function parseServerEnv() {
  const parsed = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_SUPABASE_JWT_TEMPLATE: process.env.CLERK_SUPABASE_JWT_TEMPLATE,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    HUBSPOT_ACCESS_TOKEN: process.env.HUBSPOT_ACCESS_TOKEN,
    HUBSPOT_PORTAL_ID: process.env.HUBSPOT_PORTAL_ID,
    HUBSPOT_CONTACT_FORM_GUID: process.env.HUBSPOT_CONTACT_FORM_GUID,
    HUBSPOT_DEMO_FORM_GUID: process.env.HUBSPOT_DEMO_FORM_GUID
  });

  if (!parsed.success) {
    throw new Error(`Invalid server environment variables:\n${formatZodError(parsed.error)}`);
  }

  return parsed.data;
}

const clientEnv = parseClientEnv();
const serverEnv = typeof window === "undefined" ? parseServerEnv() : null;

export const env = {
  ...clientEnv,
  ...(serverEnv ?? {})
};

export type Env = typeof env;
