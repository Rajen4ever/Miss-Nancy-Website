"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BrainCircuit,
  FolderKanban,
  LayoutGrid,
  ListTodo,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type WorkspaceNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
};

type WorkspaceShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  navItems?: WorkspaceNavItem[];
  topbarActions?: React.ReactNode;
  desktopSidebarFooter?: React.ReactNode;
  sessionRail?: React.ReactNode;
  tasksDrawer?: React.ReactNode;
  projectsDrawer?: React.ReactNode;
  memoryDrawer?: React.ReactNode;
  menuDrawerExtras?: React.ReactNode;
};

type MobilePanel = "menu" | "tasks" | "projects" | "memory" | null;

const defaultNavItems: WorkspaceNavItem[] = [
  {
    title: "Overview",
    href: "/workspace",
    icon: LayoutGrid
  },
  {
    title: "Chat",
    href: "/workspace/chat",
    icon: MessageSquareText
  },
  {
    title: "Tasks",
    href: "/workspace/tasks",
    icon: ListTodo
  },
  {
    title: "Projects",
    href: "/workspace/projects",
    icon: FolderKanban
  },
  {
    title: "Memory",
    href: "/workspace/memory",
    icon: BrainCircuit
  }
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/workspace") {
    return currentPath === href;
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function WorkspaceShell({
  title,
  subtitle,
  children,
  navItems = defaultNavItems,
  topbarActions,
  desktopSidebarFooter,
  sessionRail,
  tasksDrawer,
  projectsDrawer,
  memoryDrawer,
  menuDrawerExtras
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);

  const panelContent = useMemo(() => {
    switch (mobilePanel) {
      case "tasks":
        return {
          title: "Tasks",
          content: tasksDrawer
        };
      case "projects":
        return {
          title: "Projects",
          content: projectsDrawer
        };
      case "memory":
        return {
          title: "Memory",
          content: memoryDrawer
        };
      case "menu":
        return {
          title: "Workspace",
          content: (
            <div className="space-y-6">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobilePanel(null)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors",
                        active
                          ? "border-violet-400/20 bg-violet-500/10 text-zinc-50"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      {item.badge ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
              {menuDrawerExtras ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                  {menuDrawerExtras}
                </div>
              ) : null}
            </div>
          )
        };
      default:
        return {
          title: "",
          content: null
        };
    }
  }, [memoryDrawer, menuDrawerExtras, mobilePanel, navItems, pathname, projectsDrawer, tasksDrawer]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[auto_1fr]">
        <aside
          className={cn(
            "hidden border-r border-zinc-800/80 bg-sidebar/95 backdrop-blur-xl lg:flex lg:flex-col",
            collapsedSidebar ? "w-[92px]" : "w-[280px]"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-zinc-800/80 px-4">
            <Link href="/" className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 shadow-glow">
                <span className="font-display text-sm font-bold text-zinc-50">MN</span>
              </div>
              {!collapsedSidebar ? (
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-zinc-50">
                    Miss Nancy
                  </p>
                  <p className="truncate text-xs text-zinc-500">Authenticated workspace</p>
                </div>
              ) : null}
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setCollapsedSidebar((current) => !current)}
              aria-label={collapsedSidebar ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsedSidebar ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="scrollbar-subtle flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-2xl border px-3 py-3 transition-colors",
                      active
                        ? "border-violet-400/20 bg-violet-500/10 text-zinc-50"
                        : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100",
                      collapsedSidebar ? "justify-center" : "justify-between"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsedSidebar ? <span className="text-sm font-medium">{item.title}</span> : null}
                    </div>
                    {!collapsedSidebar && item.badge ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            {!collapsedSidebar && sessionRail ? (
              <div className="mt-6 space-y-3">
                <div className="px-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Recent sessions
                </div>
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-3">
                  {sessionRail}
                </div>
              </div>
            ) : null}
          </div>

          {!collapsedSidebar && desktopSidebarFooter ? (
            <div className="border-t border-zinc-800/80 p-3">{desktopSidebarFooter}</div>
          ) : null}
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-semibold tracking-[-0.02em] text-zinc-50">
                  {title}
                </p>
                {subtitle ? <p className="truncate text-sm text-zinc-500">{subtitle}</p> : null}
              </div>

              <div className="hidden items-center gap-3 md:flex">{topbarActions}</div>

              <Button
                variant="secondary"
                size="icon"
                className="md:hidden"
                onClick={() => setMobilePanel("menu")}
                aria-label="Open workspace menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 pb-24 md:px-6 lg:px-8 lg:pb-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-zinc-950/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          <Link
            href="/workspace/chat"
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
              isActivePath(pathname, "/workspace/chat")
                ? "bg-violet-500/10 text-zinc-50"
                : "text-zinc-500"
            )}
          >
            <MessageSquareText className="h-4 w-4" />
            Chat
          </Link>

          <button
            type="button"
            onClick={() => setMobilePanel("tasks")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
              mobilePanel === "tasks" ? "bg-violet-500/10 text-zinc-50" : "text-zinc-500"
            )}
          >
            <ListTodo className="h-4 w-4" />
            Tasks
          </button>

          <button
            type="button"
            onClick={() => setMobilePanel("projects")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
              mobilePanel === "projects" ? "bg-violet-500/10 text-zinc-50" : "text-zinc-500"
            )}
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </button>

          <button
            type="button"
            onClick={() => setMobilePanel("memory")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
              mobilePanel === "memory" ? "bg-violet-500/10 text-zinc-50" : "text-zinc-500"
            )}
          >
            <BrainCircuit className="h-4 w-4" />
            Memory
          </button>

          <button
            type="button"
            onClick={() => setMobilePanel("menu")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors",
              mobilePanel === "menu" ? "bg-violet-500/10 text-zinc-50" : "text-zinc-500"
            )}
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobilePanel ? (
          <>
            <motion.button
              type="button"
              aria-label="Close mobile panel"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobilePanel(null)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-hidden rounded-t-[2rem] border-t border-zinc-800 bg-zinc-950/98 shadow-panel lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-zinc-700" />
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-display text-lg text-zinc-50">{panelContent.title}</p>
                  <p className="text-sm text-zinc-500">Workspace quick access</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobilePanel(null)}
                  aria-label="Close mobile panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="scrollbar-subtle overflow-y-auto px-5 pb-8">
                {panelContent.content ?? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
                    Nothing to show yet.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
