import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";

const demoSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(160).nullable().optional(),
  role: z.string().trim().max(120).nullable().optional(),
  teamSize: z.string().trim().max(80).nullable().optional(),
  useCase: z.string().trim().min(10).max(4000),
  calendlyEventUri: z.string().trim().url().nullable().optional(),
});

type DemoInsertPayload = {
  clerk_user_id?: string | null;
  full_name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  team_size?: string | null;
  use_case: string;
  calendly_event_uri?: string | null;
  status?: "new" | "in_review" | "scheduled" | "closed" | "spam";
  metadata?: Record<string, unknown>;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server environment is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

async function submitToHubSpotDemoForm(input: {
  fullName: string;
  email: string;
  company?: string | null;
  role?: string | null;
  teamSize?: string | null;
  useCase: string;
}) {
  const portalId = process.env["HUBSPOT_PORTAL_ID"];
  const formGuid = process.env["HUBSPOT_DEMO_FORM_GUID"];

  if (!portalId || !formGuid) {
    return {
      ok: false,
      reason: "HubSpot demo form configuration is missing.",
    } as const;
  }

  const [firstName, ...rest] = input.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ");

  const response = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: [
          { name: "firstname", value: firstName || input.fullName },
          { name: "lastname", value: lastName || input.fullName },
          { name: "email", value: input.email },
          { name: "company", value: input.company ?? "" },
          { name: "jobtitle", value: input.role ?? "" },
          { name: "team_size", value: input.teamSize ?? "" },
          { name: "use_case", value: input.useCase },
        ],
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      reason: text || "HubSpot demo submission failed.",
    } as const;
  }

  return { ok: true } as const;
}

async function sendDemoConfirmationEmail(input: {
  fullName: string;
  email: string;
  company?: string | null;
  useCase: string;
  calendlyUrl?: string | null;
}) {
  const resendApiKey = process.env["RESEND_API_KEY"];
  const fromEmail = process.env["RESEND_FROM_EMAIL"];

  if (!resendApiKey || !fromEmail) {
    return { ok: false, reason: "Resend is not configured." } as const;
  }

  const resend = new Resend(resendApiKey);

  const calendlyBlock = input.calendlyUrl
    ? `<p style="margin: 16px 0 0;">If you want to schedule immediately, use this booking link:
         <a href="${escapeHtml(input.calendlyUrl)}">${escapeHtml(input.calendlyUrl)}</a></p>`
    : "";

  await resend.emails.send({
    from: fromEmail,
    to: input.email,
    subject: "Your Miss Nancy demo request is in",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #18181B;">
        <h2 style="margin: 0 0 12px;">Demo request received</h2>
        <p style="margin: 0 0 12px;">We received your request for a Miss Nancy demo and will follow up soon.</p>
        <div style="margin: 16px 0; padding: 16px; border-radius: 16px; background: #F4F4F5; border: 1px solid #E4E4E7;">
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(input.fullName)}</p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
          <p style="margin: 0 0 8px;"><strong>Company:</strong> ${escapeHtml(input.company ?? "—")}</p>
          <p style="margin: 0;"><strong>Use case:</strong> ${escapeHtml(input.useCase)}</p>
        </div>
        ${calendlyBlock}
      </div>
    `,
  });

  return { ok: true } as const;
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
    const parsed = demoSchema.safeParse(body);

    if (!parsed.success) {
      return new Response("Invalid demo request payload.", { status: 400 });
    }

    const { userId } = await auth();
    const supabase = getSupabaseAdminClient();
    const calendlyUrl = process.env["NEXT_PUBLIC_CALENDLY_URL"] ?? null;

    const payload: DemoInsertPayload = {
      clerk_user_id: userId ?? null,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      company: parsed.data.company ?? null,
      role: parsed.data.role ?? null,
      team_size: parsed.data.teamSize ?? null,
      use_case: parsed.data.useCase,
      calendly_event_uri: parsed.data.calendlyEventUri ?? null,
      status: parsed.data.calendlyEventUri ? "scheduled" : "new",
      metadata: {
        userAgent: request.headers.get("user-agent"),
        submittedAt: new Date().toISOString(),
        calendlyUrl,
      },
    };

    const { data, error } = await supabase
      .from("demo_requests")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const warnings: string[] = [];

    try {
      const hubspotResult = await submitToHubSpotDemoForm({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        company: parsed.data.company ?? null,
        role: parsed.data.role ?? null,
        teamSize: parsed.data.teamSize ?? null,
        useCase: parsed.data.useCase,
      });

      if (!hubspotResult.ok) {
        warnings.push(hubspotResult.reason);
      }
    } catch (error) {
      warnings.push(
        error instanceof Error ? error.message : "HubSpot submission failed."
      );
    }

    try {
      const resendResult = await sendDemoConfirmationEmail({
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        company: parsed.data.company ?? null,
        useCase: parsed.data.useCase,
        calendlyUrl,
      });

      if (!resendResult.ok) {
        warnings.push(resendResult.reason);
      }
    } catch (error) {
      warnings.push(
        error instanceof Error ? error.message : "Resend delivery failed."
      );
    }

    return Response.json(
      {
        ok: true,
        id: data?.id ?? null,
        message: "Demo request stored successfully.",
        calendlyUrl,
        warnings,
      },
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Unable to process demo request.",
      { status: 500 }
    );
  }
}
