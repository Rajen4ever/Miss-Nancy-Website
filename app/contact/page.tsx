"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Loader2, Mail, MessageSquareText, Sparkles } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ContactFormState = {
  fullName: string;
  email: string;
  company: string;
  message: string;
};

const initialState: ContactFormState = {
  fullName: "",
  email: "",
  company: "",
  message: ""
};

export default function ContactPage() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  const initialMessage = useMemo(() => {
    if (intent === "enterprise") {
      return "I’m interested in the Enterprise plan and want to discuss rollout, pricing, and implementation.";
    }
    if (intent === "sales") {
      return "I want to talk to sales about Miss Nancy.";
    }
    return "";
  }, [intent]);

  const [form, setForm] = useState<ContactFormState>({
    ...initialState,
    message: initialMessage
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          company: form.company.trim() || null,
          message: form.message.trim()
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Lead submission failed.");
      }

      setSuccessMessage("Your message has been sent. We’ll follow up soon.");
      setForm({ ...initialState, message: initialMessage });
    } catch (caughtError) {
      setErrorMessage(caughtError instanceof Error ? caughtError.message : "Something went wrong while sending your message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="relative overflow-x-clip">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="section-shell pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <Badge className="mb-5 border-violet-400/20 bg-violet-500/10 text-violet-200">Contact</Badge>
              <h1 className="font-display text-5xl font-bold tracking-[-0.045em] text-zinc-50 md:text-6xl">Talk to us about Miss Nancy.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">Use the contact form for product questions, pricing conversations, enterprise rollout, or implementation support.</p>
              <div className="mt-8 grid gap-3">{["Pricing and plan questions","Enterprise rollout conversations","Implementation and workspace setup"].map((item)=><div key={item} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300"><Sparkles className="h-4 w-4 text-violet-300" /><span>{item}</span></div>)}</div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900/80"><CardContent className="p-5"><Mail className="h-5 w-5 text-zinc-300" /><p className="mt-4 font-display text-xl text-zinc-50">Sales conversations</p><p className="mt-2 text-sm leading-7 text-zinc-400">Reach out when you need plan guidance or team rollout help.</p></CardContent></Card>
                <Card className="border-zinc-800 bg-zinc-900/80"><CardContent className="p-5"><MessageSquareText className="h-5 w-5 text-zinc-300" /><p className="mt-4 font-display text-xl text-zinc-50">Fast next step</p><p className="mt-2 text-sm leading-7 text-zinc-400">Prefer a live conversation? Book a demo instead of sending a note.</p><Button asChild variant="ghost" className="mt-3 px-0 text-violet-300 hover:bg-transparent hover:text-violet-200"><Link href="/book-demo">Book demo<ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>
              </div>
            </div>

            <Card className="border-zinc-800 bg-zinc-900/85 shadow-panel">
              <CardHeader className="p-8"><CardTitle className="font-display text-3xl text-zinc-50">Send a message</CardTitle></CardHeader>
              <CardContent className="p-8 pt-0">
                {successMessage ? <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{successMessage}</div> : null}
                {errorMessage ? <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{errorMessage}</div> : null}
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><label htmlFor="fullName" className="text-sm font-medium text-zinc-300">Full name</label><Input id="fullName" value={form.fullName} onChange={(event)=>updateField("fullName",event.target.value)} placeholder="Your name" required /></div>
                    <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium text-zinc-300">Email</label><Input id="email" type="email" value={form.email} onChange={(event)=>updateField("email",event.target.value)} placeholder="you@company.com" required /></div>
                  </div>
                  <div className="space-y-2"><label htmlFor="company" className="text-sm font-medium text-zinc-300">Company</label><Input id="company" value={form.company} onChange={(event)=>updateField("company",event.target.value)} placeholder="Optional" /></div>
                  <div className="space-y-2"><label htmlFor="message" className="text-sm font-medium text-zinc-300">Message</label><Textarea id="message" value={form.message} onChange={(event)=>updateField("message",event.target.value)} placeholder="Tell us what you need help with..." required /></div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2"><p className="text-xs text-zinc-500">This form posts directly to <code>/api/leads</code>.</p><Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Sending</> : <>Send message<ArrowRight className="h-4 w-4" /></>}</Button></div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
