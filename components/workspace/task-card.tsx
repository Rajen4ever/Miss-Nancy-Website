import Link from "next/link";
import { CalendarClock, FolderKanban, ListTodo } from "lucide-react";

import type { Database } from "@/lib/supabase";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskCardProps = {
  task: TaskRow;
  projectName?: string | null;
  href?: string;
  compact?: boolean;
  className?: string;
};

const statusClasses: Record<TaskRow["status"], string> = {
  todo: "border-zinc-700 bg-zinc-900 text-zinc-300",
  in_progress: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  blocked: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  done: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
};

const priorityClasses: Record<TaskRow["priority"], string> = {
  low: "border-zinc-700 bg-zinc-900 text-zinc-300",
  medium: "border-violet-400/20 bg-violet-500/10 text-violet-200",
  high: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  urgent: "border-rose-400/20 bg-rose-400/10 text-rose-300"
};

function formatEnumLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function TaskCard({
  task,
  projectName,
  href,
  compact = false,
  className
}: TaskCardProps) {
  const content = (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900/80 transition-colors",
        href && "hover:border-zinc-700 hover:bg-zinc-900",
        className
      )}
    >
      <CardHeader className={cn("space-y-4", compact ? "p-4" : "p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-400">
                <ListTodo className="h-4 w-4" />
              </div>
              <Badge className={statusClasses[task.status]}>{formatEnumLabel(task.status)}</Badge>
              <Badge className={priorityClasses[task.priority]}>{task.priority}</Badge>
            </div>

            <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-zinc-50">
              {task.title}
            </h3>

            {task.description ? (
              <p className="mt-2 text-sm leading-7 text-zinc-400">{task.description}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", compact ? "p-4 pt-0" : "p-5 pt-0")}>
        <div className="flex flex-wrap gap-2">
          {projectName ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-400">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>{projectName}</span>
            </div>
          ) : null}

          {task.due_at ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-400">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>{formatDateTime(task.due_at)}</span>
            </div>
          ) : null}

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-500">
            <span>Source</span>
            <span className="text-zinc-300">{task.source}</span>
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
