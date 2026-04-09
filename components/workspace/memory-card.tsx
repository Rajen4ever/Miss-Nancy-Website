import Link from "next/link";
import { BrainCircuit, FolderKanban, Pin } from "lucide-react";

import type { Database } from "@/lib/supabase";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type MemoryRow = Database["public"]["Tables"]["memory_items"]["Row"];

export type MemoryCardProps = {
  memory: MemoryRow;
  projectName?: string | null;
  href?: string;
  compact?: boolean;
  className?: string;
};

const kindClasses: Record<MemoryRow["kind"], string> = {
  general: "border-zinc-700 bg-zinc-900 text-zinc-300",
  preference: "border-violet-400/20 bg-violet-500/10 text-violet-200",
  fact: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  constraint: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  summary: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  decision: "border-rose-400/20 bg-rose-400/10 text-rose-300"
};

export function MemoryCard({
  memory,
  projectName,
  href,
  compact = false,
  className
}: MemoryCardProps) {
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
                <BrainCircuit className="h-4 w-4" />
              </div>
              <Badge className={kindClasses[memory.kind]}>{memory.kind}</Badge>
              <div className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950/70 px-2.5 py-1 text-xs text-zinc-400">
                <Pin className="h-3.5 w-3.5" />
                <span>{memory.importance}/5</span>
              </div>
            </div>

            <p className="text-sm leading-7 text-zinc-200">{memory.content}</p>
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

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-500">
            <span>Saved</span>
            <span className="text-zinc-300">{formatDateTime(memory.created_at)}</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-500">
            <span>Source</span>
            <span className="text-zinc-300">{memory.source}</span>
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
