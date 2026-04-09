"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlanKey = "operator" | "enterprise";

const plans = [
  {
    key: "operator" as const,
    name: "Operator",
    price: "$49",
    period: "/month",
    badge: "For builders and operators",
    description:
      "The core Miss Nancy product for solo users who want a real authenticated AI workspace with persistence, streaming, and structured execution objects.",
    features: [
      "Protected /workspace access",
      "Real streamed AI chat",
      "Persistent sessions",
      "Tasks, projects, and memory_items",
      "Clerk auth + Supabase persistence",
      "Stripe-ready billing foundation"
    ],
    ctaLabel: "Start Operator",
    secondaryLabel: "Book a demo"
  },
  {
    key: "enterprise" as const,
    name: "Enterprise",
    price: "Custom",
    period: "",
    badge: "For teams and workflow design",
    description:
      "For teams that need premium rollout support, billing, demo orchestration, lead capture, and a connector-ready implementation path.",
    features: [
      "Everything in Operator",
      "Team rollout support",
      "Priority implementation guidance",
      "Advanced workflow design",
      "Lead capture + demo funnel support",
      "Enterprise onboarding path"
    ],
    ctaLabel: "Talk to sales",
    secondaryLabel: "Contact us"
  }
];

const comparisonRows = [
  { feature: "Authenticated workspace", operator: true, enterprise: true },
  { feature: "Real streamed AI chat", operator: true, enterprise: true },
  { feature: "Persistent sessions", operator: true, enterprise: true },
  { feature: "Tasks, projects, memory_items", operator: true, enterprise: true },
  { feature: "Stripe-ready billing", operator: true, enterprise: true },
  { feature: "Calendly-assisted demo flow", operator: false, enterprise: true },
  { feature: "Priority onboarding", operator: false, enterprise: true },
  { feature: "Enterprise workflow guidance", operator: false, enterprise: true }
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOperatorCheckout() {
    setLoadingPlan("operator");
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "operator" })
      });

      if (!response.ok) {
        throw new Error("Checkout session could not be created.");
      }

      const payload = (await response.json()) as { url?: string };

      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("Checkout URL missing from response.");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to start checkout right now.";
      setError(message);
      router.push("/sign-up?plan=operator");
    } finally {
      setLoadingPlan(null);
    }
  }

  function handleEnterpriseIntent() {
    setLoadingPlan("enterprise");
    setError(null);
    router.push("/book-demo?plan=enterprise");
  }

  return (
    <main className="relative overflow-x-clip">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-hero-radial" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[24rem] hero-grid opacity-40" />
        <div className="section-shell pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-5 border-violet-400/20 bg-violet-500/10 text-violet-200">Pricing</Badge>
            <h1 className="font-display text-5xl font-bold tracking-[-0.045em] text-zinc-50 md:text-7xl">
              Choose the plan that matches the way you operate.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-300 md:text-xl">
              Miss Nancy is priced around real product primitives: protected workspace access,
              streamed AI chat, persistence, structured work objects, and a serious execution model.
            </p>
          </div>
          {error ? <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">{error}</div> : null}
        </div>
      </section>
      <section className="section-shell pb-20 md:pb-28">
        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card key={plan.key} className={plan.key === "operator" ? "relative overflow-hidden border-violet-400/20 bg-zinc-900 shadow-glow" : "border-zinc-800 bg-zinc-900/80"}>
              {plan.key === "operator" ? <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" /> : null}
              <CardHeader className="space-y-5 p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge className={plan.key === "operator" ? "border-violet-400/20 bg-violet-500/10 text-violet-200" : "border-zinc-700 bg-zinc-900 text-zinc-300"}>{plan.badge}</Badge>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-300">
                    {plan.key === "operator" ? <Zap className="h-5 w-5 text-violet-300" /> : <ShieldCheck className="h-5 w-5 text-zinc-300" />}
                  </div>
                </div>
                <div>
                  <CardTitle className="font-display text-3xl text-zinc-50 md:text-4xl">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="font-display text-5xl font-bold tracking-[-0.04em] text-zinc-50">{plan.price}</span>
                    {plan.period ? <span className="pb-1 text-zinc-400">{plan.period}</span> : null}
                  </div>
                </div>
                <p className="text-sm leading-7 text-zinc-400">{plan.description}</p>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 grid gap-3">
                  {plan.key === "operator" ? (
                    <>
                      <Button size="lg" className="w-full justify-between" onClick={handleOperatorCheckout} disabled={loadingPlan !== null}>
                        {loadingPlan === "operator" ? <><span>Starting checkout</span><Loader2 className="h-4 w-4 animate-spin" /></> : <><span>{plan.ctaLabel}</span><CreditCard className="h-4 w-4" /></>}
                      </Button>
                      <Button asChild variant="secondary" size="lg" className="w-full justify-between">
                        <Link href="/book-demo?plan=operator">{plan.secondaryLabel}<ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" className="w-full justify-between" onClick={handleEnterpriseIntent} disabled={loadingPlan !== null}>
                        {loadingPlan === "enterprise" ? <><span>Opening demo flow</span><Loader2 className="h-4 w-4 animate-spin" /></> : <><span>{plan.ctaLabel}</span><ArrowRight className="h-4 w-4" /></>}
                      </Button>
                      <Button asChild variant="secondary" size="lg" className="w-full justify-between">
                        <Link href="/contact?intent=enterprise">{plan.secondaryLabel}<ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="section-shell pb-20 md:pb-28">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader className="p-8">
            <Badge variant="secondary" className="mb-4 w-fit">Feature comparison</Badge>
            <CardTitle className="font-display text-3xl text-zinc-50">What each plan unlocks</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[1.3fr_0.85fr_0.85fr] border-b border-zinc-800 px-8 py-4 text-sm text-zinc-400"><div>Capability</div><div className="text-center">Operator</div><div className="text-center">Enterprise</div></div>
              {comparisonRows.map((row) => (
                <div key={row.feature} className="grid grid-cols-[1.3fr_0.85fr_0.85fr] items-center border-b border-zinc-800/80 px-8 py-4 text-sm">
                  <div className="text-zinc-200">{row.feature}</div>
                  <div className="flex justify-center">{row.operator ? <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><Check className="h-4 w-4" /></div> : <span className="text-zinc-500">—</span>}</div>
                  <div className="flex justify-center">{row.enterprise ? <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"><Check className="h-4 w-4" /></div> : <span className="text-zinc-500">—</span>}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
