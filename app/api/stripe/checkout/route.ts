import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { z } from "zod";

import type { Database } from "@/lib/supabase";

const checkoutSchema = z.object({
  plan: z.literal("operator")
});

function getStripeClient() {
  const stripeSecretKey = process.env["STRIPE_SECRET_KEY"];

  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured.");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia"
  });
}

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

async function getOrCreateStripeCustomer(args: {
  stripe: Stripe;
  clerkUserId: string;
  email: string;
  fullName?: string | null;
}) {
  const supabase = getSupabaseAdminClient();

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("clerk_user_id, email, first_name, last_name, image_url, stripe_customer_id")
    .eq("clerk_user_id", args.clerkUserId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (existingProfile?.stripe_customer_id) {
    return { customerId: existingProfile.stripe_customer_id };
  }

  const stripeCustomer = await args.stripe.customers.create({
    email: args.email,
    name: args.fullName ?? undefined,
    metadata: {
      clerk_user_id: args.clerkUserId
    }
  });

  const nameParts = (args.fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const firstName = existingProfile?.first_name ?? nameParts[0] ?? null;
  const lastName =
    existingProfile?.last_name ??
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);

  const profilesUpsertTable = supabase.from("profiles") as unknown as {
    upsert: (
      values: Database["public"]["Tables"]["profiles"]["Insert"],
      options: { onConflict: "clerk_user_id" }
    ) => Promise<{ error: { message: string } | null }>;
  };

  const { error: upsertError } = await profilesUpsertTable.upsert(
    {
      clerk_user_id: args.clerkUserId,
      email: existingProfile?.email ?? args.email,
      first_name: firstName,
      last_name: lastName,
      image_url: existingProfile?.image_url ?? null,
      stripe_customer_id: stripeCustomer.id
    },
    { onConflict: "clerk_user_id" }
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return { customerId: stripeCustomer.id };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authObject = await auth();

    if (!authObject.userId) {
      return new Response("Authentication required.", { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return new Response("Invalid checkout payload.", { status: 400 });
    }

    const operatorPriceId = process.env["STRIPE_OPERATOR_PRICE_ID"];
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"];

    if (!operatorPriceId) {
      return new Response("Operator price is not configured.", { status: 500 });
    }

    if (!appUrl) {
      return new Response("Application URL is not configured.", { status: 500 });
    }

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null;

    if (!email) {
      return new Response("Authenticated user is missing a valid email address.", { status: 400 });
    }

    const fullName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || null;

    const stripe = getStripeClient();
    const { customerId } = await getOrCreateStripeCustomer({
      stripe,
      clerkUserId: authObject.userId,
      email,
      fullName
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: authObject.userId,
      allow_promotion_codes: true,
      success_url: `${appUrl}/workspace?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      line_items: [{ price: operatorPriceId, quantity: 1 }],
      metadata: {
        clerk_user_id: authObject.userId,
        plan: parsed.data.plan
      },
      subscription_data: {
        metadata: {
          clerk_user_id: authObject.userId,
          plan: parsed.data.plan
        }
      }
    });

    return Response.json({ ok: true, url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Unable to create checkout session.",
      { status: 500 }
    );
  }
}
