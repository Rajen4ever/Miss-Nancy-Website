"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, FolderKanban, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type HeroSectionProps = {
  badge: string;
  headline: string;
  highlight: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
};

export function HeroSection({
  badge,
  headline,
  highlight,
  description,
  primaryCta,
  secondaryCta
}: HeroSectionProps) {
  const title = headline.replace(highlight, "").trim();

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-hero-radial" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] hero-grid opacity-40" />
      <div className="section-shell grid min-h-[calc(100vh-4rem)] items-center gap-14 pt-20 pb-16 md:pt-28 md:pb-20 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge className="mb-5 border-violet-400/20 bg-violet-500/10 text-violet-200">
            {badge}
          </Badge>

          <h1 className="max-w-[12ch] font-display text-5xl font-bold leading-none tracking-[-0.045em] text-zinc-50 md:text-7xl">
            {title} <span className="text-gradient">{highlight}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-zinc-300 md:text-xl">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              "Real streamed AI chat",
              "Persistent sessions + memory",
              "Tasks, projects, billing"
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute -inset-10 -z-10 rounded-full bg-violet-500/15 blur-3xl" />
          <Card className="overflow-hidden border-zinc-800/90 bg-zinc-950/90 shadow-panel">
            <CardContent className="p-0">
              <div className="border-b border-zinc-800/80 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-lg text-zinc-50">/workspace</p>
                    <p className="text-sm text-zinc-500">
                      Authenticated AI console with persistence
                    </p>
                  </div>
                  <Badge variant="secondary">Protected</Badge>
                </div>
              </div>

              <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
                <div className="hidden border-r border-zinc-800/80 bg-zinc-900/70 p-4 lg:block">
                  <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    Sessions
                  </p>
                  <div className="space-y-2">
                    {["Weekly launch plan", "Hiring pipeline", "Q2 roadmap"].map((session, index) => (
                      <div
                        key={session}
                        className={`rounded-2xl border px-3 py-3 text-sm ${
                          index === 0
                            ? "border-violet-400/20 bg-violet-500/10 text-zinc-50"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {session}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-5 md:p-6">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-7 text-zinc-50">
                    Create a launch project, break it into execution tasks, and save the decision
                    criteria for future sessions.
                  </div>

                  <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-7 text-zinc-200">
                    Creating the project now, turning the plan into structured tasks, and saving
                    the reusable criteria into memory.
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <FolderKanban className="h-4 w-4 text-violet-300" />
                          <div>
                            <p className="text-sm font-medium text-zinc-50">Project created</p>
                            <p className="text-xs text-zinc-400">Launch System</p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-emerald-300" />
                          <div>
                            <p className="text-sm font-medium text-zinc-50">3 tasks added</p>
                            <p className="text-xs text-zinc-400">Execution queue updated</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-4 w-4 text-sky-300" />
                          <div>
                            <p className="text-sm font-medium text-zinc-50">Memory saved</p>
                            <p className="text-xs text-zinc-400">Criteria reused later</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-1 pt-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400" />
                    <span className="text-xs text-zinc-500">Streaming response active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
