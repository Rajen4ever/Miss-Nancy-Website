"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Product", href: "#product" },
  { label: "Demo", href: "#demo-preview" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-2xl">
        <div className="section-shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-glow">
              <span className="font-display text-base font-bold text-zinc-50">MN</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-display text-sm font-semibold tracking-[-0.02em] text-zinc-50">
                Miss Nancy
              </p>
              <p className="text-xs text-zinc-500">The AI Agent That Actually Gets Things Done</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100",
                    active && "bg-zinc-900 text-zinc-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Button asChild variant="ghost">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">
                Start workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-label="Close mobile navigation overlay"
            />
            <motion.div
              className="fixed inset-x-4 top-[4.75rem] z-50 rounded-3xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-panel md:hidden"
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
                    onClick={() => setOpen(false)}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-4 w-4 text-zinc-500" />
                  </Link>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/sign-in" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/sign-up" onClick={() => setOpen(false)}>
                    Start workspace
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
