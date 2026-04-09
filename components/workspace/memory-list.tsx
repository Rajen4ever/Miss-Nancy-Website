import type { Database } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { MemoryCard } from "@/components/workspace/memory-card";
import { Card, CardContent } from "@/components/ui/card";

type MemoryRow = Database["public"]["Tables"]["memory_items"]["Row"];

export type MemoryListProps = {
  items: MemoryRow[];
  projectNameById?: Record<string, string>;
  hrefBuilder?: (item: MemoryRow) => string;
  compact?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function MemoryList({
  items,
  projectNameById,
  hrefBuilder,
  compact = false,
  className,
  emptyTitle = "No memory saved yet",
  emptyDescription = "Save durable facts, constraints, summaries, and decisions to make continuity explicit."
}: MemoryListProps) {
  if (!items.length) {
    return (
      <Card className={cn("border-zinc-800 bg-zinc-900/80", className)}>
        <CardContent className="p-5">
          <p className="font-display text-lg text-zinc-50">{emptyTitle}</p>
          <p className="mt-2 text-sm leading-7 text-zinc-400">{emptyDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <MemoryCard
          key={item.id}
          memory={item}
          compact={compact}
          href={hrefBuilder?.(item)}
          projectName={item.project_id ? projectNameById?.[item.project_id] : undefined}
        />
      ))}
    </div>
  );
}
