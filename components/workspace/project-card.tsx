import Link from "next/link";
import { FolderKanban, Hash, Layers3 } from "lucide-react";

import type { Database } from "@/lib/supabase";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectCardProps = {
  project: ProjectRow;
  taskCount?: number;
  href?: string;
  compact?: boolean;
  className?: string;
};

const statusClasses: Record<ProjectRow["status"], string> = {
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  on_hold: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  completed: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  archived: "border-zinc-700 bg-zinc-900 text-zinc-300"
};

function formatEnumLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function ProjectCard({
  project,
  taskCount,
  href,
  compact = false,
  className
}: ProjectCardProps) {
  const colorDot = project.color ?? "#8B5CF6";

  const content = (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900/80 transition-colors",
        href && "hover:border-zinc-700 hover:bg-zinc-900",
        className
      )}
    >
      <CardHeader className={cn("space-y-4", compact ? "p-4" : "p-5")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-400">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colorDot }}
                aria-hidden="true"
              />
              <Badge className={statusClasses[project.status]}>{formatEnumLabel(project.status)}</Badge>
            </div>

            <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-zinc-50">
              {project.name}
            </h3>

            {project.description ? (
              <p className="mt-2 text-sm leading-7 text-zinc-400">{project.description}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", compact ? "p-4 pt-0" : "p-5 pt-0")}>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-400">
            <Hash className="h-3.5 w-3.5" />
            <span>{project.slug}</span>
          </div>

          {typeof taskCount === "number" ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-400">
              <Layers3 className="h-3.5 w-3.5" />
              <span>{taskCount} tasks</span>
            </div>
          ) : null}

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-500">
            <span>Updated</span>
            <span className="text-zinc-300">{formatDateTime(project.updated_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
