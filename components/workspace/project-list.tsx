import type { Database } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/workspace/project-card";
import { Card, CardContent } from "@/components/ui/card";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectListProps = {
  projects: ProjectRow[];
  taskCountByProjectId?: Record<string, number>;
  hrefBuilder?: (project: ProjectRow) => string;
  compact?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProjectList({
  projects,
  taskCountByProjectId,
  hrefBuilder,
  compact = false,
  className,
  emptyTitle = "No projects yet",
  emptyDescription = "Create a named initiative to group related tasks and saved context."
}: ProjectListProps) {
  if (!projects.length) {
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
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          compact={compact}
          href={hrefBuilder?.(project)}
          taskCount={taskCountByProjectId?.[project.id]}
        />
      ))}
    </div>
  );
}
