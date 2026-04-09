import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  Sparkles,
  Workflow
} from "lucide-react";

import { HeroSection } from "@/components/hero-section";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: MessageSquareText,
    title: "Real streamed AI chat",
    description:
      "Fast conversational UX powered by Vercel AI SDK with live response streaming inside a protected workspace."
  },
  {
    icon: Workflow,
    title: "Tool-driven execution",
    description:
      "Miss Nancy can turn conversation into real product objects through createTask, createProject, and saveMemory."
  },
  {
    icon: BrainCircuit,
    title: "Persistent sessions",
    description:
      "Sessions, messages, tasks, projects, and memory_items persist in Supabase under strict user boundaries."
  },
  {
    icon: Lock,
    title: "Authenticated workspace",
    description:
      "Clerk-secured access separates public marketing from the real application experience at /workspace."
  }
];

const workflow = [
  {
    step: "01",
    title: "Talk to Miss Nancy",
    description:
      "Start a streamed session in the workspace with context-rich prompts, follow-ups, and execution requests."
  },
  {
    step: "02",
    title: "Create structured work",
    description:
      "Miss Nancy turns the conversation into tasks, projects, and memory items instead of leaving ideas trapped in chat."
  },
  {
    step: "03",
    title: "Return to a persistent system",
    description:
      "Your sessions and execution objects remain available when you come back, making continuity part of the product."
  }
];

const proof = [
  "Protected authenticated workspace",
  "Persistent chat sessions",
  "Supabase-backed task, project, and memory objects",
  "Stripe billing foundation",
  "HubSpot, Resend, and Calendly integration lanes"
];

export default function HomePage() {
  return (
    <main className="relative overflow-x-clip">
      <SiteHeader />

      <HeroSection
        badge="Now shipping a real workspace foundation"
        headline="The AI Agent That Actually Gets Things Done."
        highlight="Actually Gets Things Done."
        description="Miss Nancy combines a premium public product experience with a real authenticated workspace: streamed AI chat, persistent sessions, tasks, projects, memory, billing, and connector-ready execution lanes."
        primaryCta={{
          label: "Start your workspace",
          href: "/sign-up"
        }}
        secondaryCta={{
          label: "Book a demo",
          href: "/book-demo"
        }}
      />

      <section id="product" className="section-shell py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            Product foundation
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-zinc-50 md:text-5xl">
            Not a generic chatbot. A real AI workspace with structured persistence.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
            Public site on the outside. Protected operational console on the inside. Every core
            claim maps to a real product primitive: auth, streaming, storage, structured objects,
            billing, and integration lanes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((item) => (
            <Card key={item.title} className="border-zinc-800 bg-zinc-900/85 shadow-card">
              <CardHeader className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="font-display text-xl text-zinc-50">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm leading-7 text-zinc-400">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="demo-preview" className="section-shell py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge variant="secondary" className="mb-4">
              Public demo preview
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-zinc-50 md:text-5xl">
              Show the product. Do not hide behind vague AI marketing.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              The homepage should make the runtime legible: chat is streamed, actions are
              tool-mediated, and the result is saved into structured objects that users can inspect
              later inside the workspace.
            </p>

            <div className="mt-8 grid gap-3">
              {proof.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/workspace">
                  Explore workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>

          <Card className="relative overflow-hidden border-zinc-800 bg-zinc-950/90 shadow-panel">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/80 to-transparent" />
            <CardHeader className="border-b border-zinc-800/80 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xl text-zinc-50">Demo chat preview</p>
                  <p className="mt-1 text-sm text-zinc-400">Streamed response + structured tool calls</p>
                </div>
                <Badge className="border-violet-400/20 bg-violet-500/10 text-violet-200">
                  Live-feel UI
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-7 text-zinc-100">
                Plan my launch week, create the project, save the decision criteria, and add the
                first three tasks.
              </div>

              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-7 text-zinc-200">
                I’m creating a project, saving your launch criteria as memory, and turning the next
                steps into structured tasks.
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-4 w-4 text-violet-300" />
                      <div>
                        <p className="text-sm font-medium text-zinc-50">createProject</p>
                        <p className="text-xs text-zinc-400">Product Launch Week</p>
                      </div>
                    </div>
                    <Badge variant="success">created</Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-4 w-4 text-sky-300" />
                      <div>
                        <p className="text-sm font-medium text-zinc-50">saveMemory</p>
                        <p className="text-xs text-zinc-400">Decision criteria stored for reuse</p>
                      </div>
                    </div>
                    <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-200">saved</Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4 text-emerald-300" />
                      <div>
                        <p className="text-sm font-medium text-zinc-50">createTask × 3</p>
                        <p className="text-xs text-zinc-400">
                          Draft launch copy · Review checkout flow · Book demo follow-ups
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">queued</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1 pt-2">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-xs text-zinc-500">Streaming response continues…</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="how-it-works" className="section-shell py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">
            How it works
          </Badge>
          <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-zinc-50 md:text-5xl">
            Conversation becomes execution.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {workflow.map((item) => (
            <Card key={item.step} className="border-zinc-800 bg-zinc-900/80 shadow-card">
              <CardHeader className="space-y-5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 font-mono text-sm text-zinc-300">
                  {item.step}
                </div>
                <CardTitle className="font-display text-2xl text-zinc-50">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm leading-7 text-zinc-400">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="section-shell py-20 md:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge variant="secondary" className="mb-4">
              Pricing foundation
            </Badge>
            <h2 className="font-display text-4xl font-bold tracking-[-0.03em] text-zinc-50 md:text-5xl">
              Billing-ready from day one.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              The product foundation already includes Stripe-ready billing lanes, protected routes,
              and plan-aware user state so monetization is part of the architecture, not an
              afterthought.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader>
                <Badge variant="secondary" className="mb-4 w-fit">
                  Starter
                </Badge>
                <CardTitle className="font-display text-3xl text-zinc-50">For early users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-zinc-300">
                <p>Access the authenticated workspace, streamed chat, and persistent structured objects.</p>
                <ul className="space-y-3 text-zinc-400">
                  <li>• Streamed AI chat</li>
                  <li>• Persistent sessions</li>
                  <li>• Tasks, projects, memory</li>
                  <li>• Protected workspace</li>
                </ul>
                <Button asChild className="mt-2 w-full">
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-violet-400/20 bg-zinc-900 shadow-glow">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
              <CardHeader>
                <Badge className="mb-4 w-fit border-violet-400/20 bg-violet-500/10 text-violet-200">
                  Most powerful
                </Badge>
                <CardTitle className="font-display text-3xl text-zinc-50">
                  Teams & workflows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-zinc-300">
                <p>Layer billing, CRM capture, transactional email, and demo conversion into one premium product shell.</p>
                <ul className="space-y-3 text-zinc-400">
                  <li>• Stripe billing foundation</li>
                  <li>• HubSpot capture lanes</li>
                  <li>• Resend transactional email</li>
                  <li>• Calendly demo flow</li>
                </ul>
                <Button asChild variant="secondary" className="mt-2 w-full">
                  <Link href="/book-demo">Book a demo</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="section-shell py-20 md:py-28">
        <Card className="overflow-hidden border-zinc-800 bg-zinc-900/85 shadow-panel">
          <CardContent className="grid gap-8 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div>
              <Badge className="mb-4 border-white/10 bg-white/5 text-zinc-200">Ready to convert</Badge>
              <h2 className="max-w-xl font-display text-4xl font-bold tracking-[-0.03em] text-zinc-50 md:text-5xl">
                Ship a site that sells the product by showing the product.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                Lead with clarity. Show the workspace. Show the streamed runtime. Show the
                persistence layer. Then convert users into signup, pricing, contact, or demo.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start your workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/book-demo">Book a live demo</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/contact">Contact sales</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <footer className="mt-10 border-t border-zinc-800/80 pt-8 text-sm text-zinc-500">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <p>Miss Nancy — The AI Agent That Actually Gets Things Done.</p>
            <div className="flex flex-wrap gap-5">
              <Link href="/pricing" className="hover:text-zinc-300">
                Pricing
              </Link>
              <Link href="/book-demo" className="hover:text-zinc-300">
                Demo
              </Link>
              <Link href="/contact" className="hover:text-zinc-300">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-zinc-300">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-zinc-300">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
