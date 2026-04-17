import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";

import type { Database } from "@/lib/supabase";

const leadSchema = z.object({
  type: z.literal("contact").optional(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(160).nullable().optional(),
  message: z.string().trim().min(10).max(4000)
});

type ContactInsert = Database["public"]["Tables"]["contact_submissions"]["Insert"];

function getSupabaseAdminClient() {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server environment is not configured.");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

function normalizeHubSpotError(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "HubSpot contact form sync failed.";
  }

  if (/HTTP ERROR 404|Resource not found/i.test(normalized)) {
    return "HubSpot contact form sync is misconfigured right now.";
  }

  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

async function submitToHubSpotContactForm(input: {
  fullName: string;
  email: string;
  company?: string | null;
  message: string;
}) {
  const portalId = process.env["HUBSPOT_PORTAL_ID"];
  const formGuid = process.env["HUBSPOT_CONTACT_FORM_GUID"];

  if (!portalId || !formGuid) {
    return {
      ok: false,
      reason: "HubSpot contact form configuration is missing."
    } as const;
  }

  const [firstName, ...rest] = input.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ");

  const response = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: [
          { name: "firstname", value: firstName || input.fullName },
          { name: "lastname", value: lastName || input.fullName },
          { name: "email", value: input.email },
          { name: "company", value: input.company ?? "" },
          { name: "message", value: input.message }
        ]
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();

    return {
      ok: false,
      reason: normalizeHubSpotError(text)
    } as const;
  }

  return {
    ok: true
  } as const;
}

function normalizeResendError(value: unknown) {
  if (!value) {
    return "Resend delivery failed.";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "message" in value) {
    const message = value["message"];

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return "Resend delivery failed.";
}

async function sendContactConfirmationEmail(input: {
  fullName: string;
  email: string;
  company?: string | null;
  message: string;
}) {
  const resendApiKey = process.env["RESEND_API_KEY"];
  const fromEmail = process.env["RESEND_FROM_EMAIL"];

  if (!resendApiKey || !fromEmail) {
    return {
      ok: false,
      reason: "Resend is not configured."
    } as const;
  }

  const resend = new Resend(resendApiKey);

  const result = await resend.emails.send({
    from: fromEmail,
    to: input.email,
    subject: "We received your Miss Nancy contact request",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #18181B;">
        <h2 style="margin: 0 0 12px;">Thanks for reaching out</h2>
        <p style="margin: 0 0 12px;">
          We received your message about Miss Nancy and will follow up soon.
        </p>
        <div style="margin: 16px 0; padding: 16px; border-radius: 16px; background: #F4F4F5; border: 1px solid #E4E4E7;">
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(input.fullName)}</p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
          <p style="margin: 0 0 8px;"><strong>Company:</strong> ${escapeHtml(input.company ?? "—")}</p>
          <p style="margin: 0;"><strong>Message:</strong> ${escapeHtml(input.message)}</p>
        </div>
        <p style="margin: 16px 0 0;">
          If your request is urgent, reply to this email and include the main priority.
        </p>
      </div>
    `
  });

  if (result && typeof result === "object" && "error" in result && result.error) {
    return {
      ok: false,
      reason: normalizeResendError(result.error)
    } as const;
  }

  return {
    ok: true
  } as const;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return new Response("Invalid contact form payload.", { status: 400 });
    }

    const { userId } = await auth();
    const supabase = getSupabaseAdminClient();

    const payload: ContactInsert = {
      clerk_user_id: userId ?? null,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      company: parsed.data.company ?? null,
      message: parsed.data.message,
      source: "website-contact-form",
      status: "new",
      metadata: {
        kind: "contact",
        userAgent: request.headers.get("user-agent"),
        submittedAt: new Date().toISOString()
      }
    };

    const contactSubmissionsTable = supabase.from(
      "contact_submissions"
    ) as unknown as {
      insert: (values: ContactInsert) => {
        select: (columns: "id") => {
          single: () => Promise<{
            data: { id: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };

    const { data, error } = await contactSubmissionsTable
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Contact request insert returned no id.");
    }

    const warnings: string[] = [];

    try {
      const hubspotResult = await submitToHubSpotContactForm({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        company: parsed.data.company ?? null,
        message: parsed.data.message
      });

      if (!hubspotResult.ok) {
        warnings.push(hubspotResult.reason);
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "HubSpot submission failed.");
    }

    try {
      const resendResult = await sendContactConfirmationEmail({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        company: parsed.data.company ?? null,
        message: parsed.data.message
      });

      if (!resendResult.ok) {
        warnings.push(resendResult.reason);
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "Resend delivery failed.");
    }

    return Response.json(
      {
        ok: true,
        id: data.id,
        message: "Contact request stored successfully.",
        warnings
      },
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Unable to process contact request.",
      { status: 500 }
    );
  }
}
