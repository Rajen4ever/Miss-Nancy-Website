import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "What we collect",
    body: [
      "Account details such as name, email address, and authentication metadata when you sign in with Clerk.",
      "Workspace data you create, including sessions, messages, tasks, projects, memory_items, contact submissions, and demo requests.",
      "Billing-related identifiers such as Stripe customer and subscription references when checkout is used.",
      "Basic technical metadata such as request timestamps and limited request headers needed for reliability and abuse prevention."
    ]
  },
  {
    title: "How we use data",
    body: [
      "To provide the authenticated workspace, streamed chat, structured execution objects, billing flows, and customer support.",
      "To persist sessions, tasks, projects, and memory_items in Supabase under user-scoped access controls.",
      "To process lead and demo submissions and optionally route them into configured services such as HubSpot, Resend, or Calendly.",
      "To maintain security, diagnose issues, and improve product reliability."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="relative overflow-x-clip">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-hero-radial" />
        <div className="section-shell pt-24 pb-14 md:pt-32 md:pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-5 border-violet-400/20 bg-violet-500/10 text-violet-200">Privacy</Badge>
            <h1 className="font-display text-5xl font-bold tracking-[-0.045em] text-zinc-50 md:text-6xl">
              Privacy grounded in the real product.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
              This privacy page describes the data flows implied by the current Miss Nancy product.
            </p>
          </div>
        </div>
      </section>
      <section className="section-shell pb-20 md:pb-28">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900/80"><CardContent className="p-6"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300"><Lock className="h-5 w-5" /></div><h2 className="mt-4 font-display text-2xl text-zinc-50">Authentication boundary</h2><p className="mt-3 text-sm leading-7 text-zinc-400">Protected workspace access is gated by Clerk. Workspace data access is intended to be scoped through Supabase row-level security and authenticated server logic.</p></CardContent></Card>
            <Card className="border-zinc-800 bg-zinc-900/80"><CardContent className="p-6"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-300"><ShieldCheck className="h-5 w-5" /></div><h2 className="mt-4 font-display text-2xl text-zinc-50">Connector honesty</h2><p className="mt-3 text-sm leading-7 text-zinc-400">Optional services like HubSpot, Resend, Stripe, and Calendly only operate when they are configured.</p></CardContent></Card>
          </div>
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.title} className="border-zinc-800 bg-zinc-900/80">
                <CardHeader className="p-6"><CardTitle className="font-display text-2xl text-zinc-50">{section.title}</CardTitle></CardHeader>
                <CardContent className="p-6 pt-0"><ul className="space-y-3 text-sm leading-7 text-zinc-400">{section.body.map((item) => <li key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">{item}</li>)}</ul></CardContent>
              </Card>
            ))}
            <Card className="border-zinc-800 bg-zinc-900/80"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-display text-2xl text-zinc-50">Need a privacy clarification?</p><p className="mt-2 text-sm leading-7 text-zinc-400">Use the contact page for implementation, storage, or connector questions.</p></div><Button asChild><Link href="/contact">Contact us<ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>
          </div>
        </div>
      </section>
    </main>
  );
}
