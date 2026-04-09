import type { Database } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/workspace/task-card";
import { Card, CardContent } from "@/components/ui/card";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskListProps = {
  tasks: TaskRow[];
  projectNameById?: Record<string, string>;
  hrefBuilder?: (task: TaskRow) => string;
  compact?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function TaskList({
  tasks,
  projectNameById,
  hrefBuilder,
  compact = false,
  className,
  emptyTitle = "No tasks yet",
  emptyDescription = "Create tasks from chat or add them directly to start tracking execution."
}: TaskListProps) {
  if (!tasks.length) {
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
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          compact={compact}
          href={hrefBuilder?.(task)}
          projectName={task.project_id ? projectNameById?.[task.project_id] : undefined}
        />
      ))}
    </div>
  );
}
