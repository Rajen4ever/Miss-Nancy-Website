"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { InlineWidget } from "react-calendly";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Sparkles
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DemoFormState = {
  fullName: string;
  email: string;
  company: string;
  role: string;
  teamSize: string;
  useCase: string;
};

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? "";

export default function BookDemoPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  const initialUseCase = useMemo(() => {
    if (plan === "enterprise") {
      return "I want an Enterprise demo focused on rollout, implementation, and pricing.";
    }

    if (plan === "operator") {
      return "I want a product demo before starting the Operator plan.";
    }

    return "";
  }, [plan]);

  const [form, setForm] = useState<DemoFormState>({
    fullName: "",
    email: "",
    company: "",
    role: "",
    teamSize: "",
    useCase: initialUseCase
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField<K extends keyof DemoFormState>(key: K, value: DemoFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          company: form.company.trim() || null,
          role: form.role.trim() || null,
          teamSize: form.teamSize.trim() || null,
          useCase: form.useCase.trim()
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Demo request failed.");
      }

      setSuccessMessage("Your demo request has been submitted. We’ll follow up shortly.");
      setForm({
        fullName: "",
        email: "",
        company: "",
        role: "",
        teamSize: "",
        useCase: initialUseCase
      });
    } catch (caughtError) {
      setErrorMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while submitting your demo request."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative overflow-x-clip">
      <SiteHeader />

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-hero-radial" />
        <div className="section-shell pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <Badge className="mb-5 border-violet-400/20 bg-violet-500/10 text-violet-200">
                Book a demo
              </Badge>
              <h1 className="font-display text-5xl font-bold tracking-[-0.045em] text-zinc-50 md:text-6xl">
                See the real workspace, not a vague AI pitch.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                Book a demo to walk through the public site, authenticated workspace, streamed chat,
                persistent sessions, and structured execution model.
              </p>

              <div className="mt-8 grid gap-3">
                {[
                  "Protected /workspace walkthrough",
                  "Streamed chat + tool calling demo",
                  "Pricing, rollout, and implementation discussion"
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900/80">
                  <CardContent className="p-5">
                    <CalendarClock className="h-5 w-5 text-zinc-300" />
                    <p className="mt-4 font-display text-xl text-zinc-50">Live conversation</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">
                      Best for pricing, architecture, rollout, and implementation questions.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/80">
                  <CardContent className="p-5">
                    <Sparkles className="h-5 w-5 text-violet-300" />
                    <p className="mt-4 font-display text-xl text-zinc-50">Two booking paths</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">
                      Submit the form now, or open the Calendly embed when it is configured.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/85 shadow-panel">
              <CardHeader className="p-8">
                <CardTitle className="font-display text-3xl text-zinc-50">Request your demo</CardTitle>
              </CardHeader>

              <CardContent className="p-8 pt-0">
                {successMessage ? (
                  <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                    {successMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
                    {errorMessage}
                  </div>
                ) : null}

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium text-zinc-300">Full name</label>
                      <Input id="fullName" value={form.fullName} onChange={(event)=>updateField("fullName",event.target.value)} placeholder="Your name" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-zinc-300">Work email</label>
                      <Input id="email" type="email" value={form.email} onChange={(event)=>updateField("email",event.target.value)} placeholder="you@company.com" required />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium text-zinc-300">Company</label>
                      <Input id="company" value={form.company} onChange={(event)=>updateField("company",event.target.value)} placeholder="Company name" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium text-zinc-300">Role</label>
                      <Input id="role" value={form.role} onChange={(event)=>updateField("role",event.target.value)} placeholder="Founder, Ops, Product..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="teamSize" className="text-sm font-medium text-zinc-300">Team size</label>
                    <Input id="teamSize" value={form.teamSize} onChange={(event)=>updateField("teamSize",event.target.value)} placeholder="1-5, 6-20, 21-100..." />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="useCase" className="text-sm font-medium text-zinc-300">What do you want to see?</label>
                    <Textarea id="useCase" value={form.useCase} onChange={(event)=>updateField("useCase",event.target.value)} placeholder="Tell us the workflow, team need, or use case you want to cover..." required />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-zinc-500">This form posts to <code>/api/book-demo</code>.</p>
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Sending</> : <>Request demo<ArrowRight className="h-4 w-4" /></>}
                    </Button>
                  </div>
                </form>

                <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg text-zinc-50">Prefer to pick a time?</p>
                      <p className="mt-1 text-sm text-zinc-400">Use the Calendly option when a public booking URL is configured.</p>
                    </div>
                    {calendlyUrl ? (
                      <Button type="button" variant="secondary" onClick={() => setShowCalendly((current) => !current)}>
                        <PlayCircle className="h-4 w-4" />
                        {showCalendly ? "Hide Calendly" : "Open Calendly"}
                      </Button>
                    ) : (
                      <Button asChild variant="secondary">
                        <Link href="/contact">Contact instead<ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {calendlyUrl && showCalendly ? (
        <section className="section-shell pb-20 md:pb-28">
          <Card className="overflow-hidden border-zinc-800 bg-zinc-900/85 shadow-panel">
            <CardHeader className="p-8">
              <Badge variant="secondary" className="mb-4 w-fit">Calendly</Badge>
              <CardTitle className="font-display text-3xl text-zinc-50">Schedule directly</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[760px] w-full">
                <InlineWidget
                  url={calendlyUrl}
                  styles={{ height: "100%", minWidth: "320px" }}
                  pageSettings={{
                    backgroundColor: "09090b",
                    hideEventTypeDetails: false,
                    hideLandingPageDetails: false,
                    primaryColor: "8b5cf6",
                    textColor: "fafafa"
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  );
}
