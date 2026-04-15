"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  FolderKanban,
  Loader2,
  Plus,
  Send,
  Sparkles,
  StopCircle
} from "lucide-react";

import { cn, formatRelativeLabel, truncate } from "@/lib/utils";
import { MemoryList } from "@/components/workspace/memory-list";
import { ProjectList } from "@/components/workspace/project-list";
import { TaskList } from "@/components/workspace/task-list";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type SessionItem = {
  id: string;
  title: string;
  last_message_at: string;
};

type TaskItem = {
  id: string;
  project_id: string | null;
  created_from_session_id: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_at: string | null;
  completed_at: string | null;
  sort_order: number;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  clerk_user_id: string;
};

type ProjectItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "active" | "on_hold" | "completed" | "archived";
  color: string | null;
  metadata: Record<string, unknown>;
  archived: boolean;
  created_at: string;
  updated_at: string;
  clerk_user_id: string;
};

type MemoryItem = {
  id: string;
  project_id: string | null;
  session_id: string | null;
  content: string;
  kind: "general" | "preference" | "fact" | "constraint" | "summary" | "decision";
  importance: number;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  clerk_user_id: string;
};

type InitialMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  metadata?: Record<string, unknown>;
};

type ToolResult = {
  toolName: string;
  result: unknown;
};

type WorkspaceChatClientProps = {
  initialSessionId: string | null;
  initialMessages: InitialMessage[];
  sessions: SessionItem[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  memoryItems: MemoryItem[];
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractToolResults(metadata?: Record<string, unknown>): ToolResult[] {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const maybeResults = metadata["toolResults"];

  if (!Array.isArray(maybeResults)) {
    return [];
  }

  return maybeResults
    .filter(
      (item): item is ToolResult =>
        Boolean(
          item &&
            typeof item === "object" &&
            "toolName" in item &&
            typeof (item as { toolName?: unknown }).toolName === "string"
        )
    )
    .map((item) => ({
      toolName: item.toolName,
      result: "result" in item ? item.result : null
    }));
}

function getToolResultSummary(toolName: string, result: unknown) {
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;

    if (typeof record["title"] === "string") {
      return record["title"];
    }

    if (typeof record["name"] === "string") {
      return record["name"];
    }

    if (typeof record["content"] === "string") {
      return truncate(record["content"], 96);
    }

    if (typeof record["id"] === "string") {
      return record["id"];
    }
  }

  return toolName;
}

export function WorkspaceChatClient({
  initialSessionId,
  initialMessages,
  sessions,
  tasks,
  projects,
  memoryItems
}: WorkspaceChatClientProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      metadata: message.metadata
    }))
  );
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"live" | "fallback" | "error" | "ready">("ready");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const projectNameById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project.name])),
    [projects]
  );

  const taskCountByProjectId = useMemo(
    () =>
      tasks.reduce<Record<string, number>>((acc, task) => {
        if (task.project_id) {
          acc[task.project_id] = (acc[task.project_id] ?? 0) + 1;
        }
        return acc;
      }, {}),
    [tasks]
  );

  useEffect(() => {
    setSessionId(initialSessionId);
    setMessages(
      initialMessages.map((message) => ({
        id: message.id,
        role: message.role,
        text: message.text,
        metadata: message.metadata
      }))
    );
  }, [initialSessionId, initialMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await streamChat(input);
  }

  async function streamChat(prompt: string) {
    const trimmed = prompt.trim();

    if (!trimmed || isStreaming) {
      return;
    }

    setError(null);
    setInput("");

    const userMessage: ChatMessage = {
      id: createId("user"),
      role: "user",
      text: trimmed
    };

    const assistantId = createId("assistant");
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: ""
    };

    const nextMessages = [...messages, userMessage, assistantMessage];
    setMessages(nextMessages);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let returnedSessionId: string | null = sessionId;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId: sessionId ?? undefined,
          messages: nextMessages
            .filter((message) => message.id !== assistantId)
            .map((message) => ({
              role: message.role,
              content: message.text
            }))
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Chat request failed.");
      }

      returnedSessionId = response.headers.get("X-Session-Id") ?? returnedSessionId;

      if (returnedSessionId && returnedSessionId !== sessionId) {
        setSessionId(returnedSessionId);
      }

      const nextMode = response.headers.get("X-Chat-Mode");
      if (nextMode === "live" || nextMode === "fallback" || nextMode === "error") {
        setMode(nextMode);
      } else {
        setMode("ready");
      }

      if (!response.body) {
        throw new Error("Streaming response body is missing.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        streamedText += decoder.decode(value, { stream: true });

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, text: streamedText } : message
          )
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text:
                  streamedText.trim() ||
                  "The request completed, but the assistant returned no visible text."
              }
            : message
        )
      );

      if (returnedSessionId) {
        router.replace(`/workspace/chat?session=${returnedSessionId}`, { scroll: false });
      } else {
        router.replace("/workspace/chat", { scroll: false });
      }

      router.refresh();
    } catch (caughtError) {
      const aborted =
        caughtError instanceof DOMException && caughtError.name === "AbortError";

      const message = aborted
        ? "Streaming stopped."
        : caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while streaming chat.";

      if (!aborted) {
        setMode("error");
        setError(message);
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                text: aborted
                  ? "Streaming stopped before the response completed."
                  : "The authenticated chat route hit an error. Please try again."
              }
            : item
        )
      );

      if (!aborted) {
        router.refresh();
      }
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleNewSession() {
    abortRef.current?.abort();
    setSessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
    setMode("ready");
    router.replace("/workspace/chat", { scroll: false });
  }

  const sessionRail = (
    <div className="space-y-3">
      <Button onClick={handleNewSession} variant="secondary" className="w-full justify-between">
        <span>New session</span>
        <Plus className="h-4 w-4" />
      </Button>

      {sessions.length ? (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/workspace/chat?session=${session.id}`}
              className={cn(
                "block rounded-2xl border px-4 py-3 transition-colors",
                session.id === sessionId
                  ? "border-violet-400/20 bg-violet-500/10"
                  : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
              )}
            >
              <p className="text-sm font-medium text-zinc-50">{truncate(session.title, 42)}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatRelativeLabel(session.last_message_at)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 text-sm text-zinc-500">
          No sessions yet. Start the first conversation.
        </div>
      )}
    </div>
  );

  return (
    <WorkspaceShell
      title="Chat"
      subtitle="Authenticated streamed conversation with persistent session history"
      topbarActions={
        <>
          <Badge
            className={cn(
              mode === "live" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
              mode === "fallback" && "border-amber-400/20 bg-amber-400/10 text-amber-300",
              mode === "error" && "border-rose-400/20 bg-rose-400/10 text-rose-300",
              mode === "ready" && "border-violet-400/20 bg-violet-500/10 text-violet-200"
            )}
          >
            {mode === "live"
              ? "Live AI route"
              : mode === "fallback"
                ? "Graceful fallback"
                : mode === "error"
                  ? "Route error"
                  : "Authenticated chat"}
          </Badge>
          <Button asChild variant="secondary">
            <Link href="/workspace">
              <ArrowRight className="h-4 w-4 rotate-180" />
              Overview
            </Link>
          </Button>
          <Button onClick={handleNewSession}>
            <Plus className="h-4 w-4" />
            New session
          </Button>
        </>
      }
      sessionRail={sessionRail}
      tasksDrawer={
        <TaskList
          tasks={tasks.slice(0, 6)}
          compact
          projectNameById={projectNameById}
          emptyTitle="No tasks yet"
        />
      }
      projectsDrawer={
        <ProjectList
          projects={projects.slice(0, 6)}
          compact
          taskCountByProjectId={taskCountByProjectId}
          emptyTitle="No projects yet"
        />
      }
      memoryDrawer={
        <MemoryList
          items={memoryItems.slice(0, 6)}
          compact
          projectNameById={projectNameById}
          emptyTitle="No memory saved yet"
        />
      }
      menuDrawerExtras={
        <div>
          <p className="font-display text-base text-zinc-50">Live workspace data</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Session history, tasks, projects, and memory shown here are loaded from Supabase for the
            signed-in user.
          </p>
        </div>
      }
      desktopSidebarFooter={
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm font-medium text-zinc-50">Tool-enabled route</p>
          <p className="mt-1 text-xs text-zinc-500">
            createTask · createProject · saveMemory
          </p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden border-zinc-800 bg-zinc-950/90 shadow-panel">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <CardTitle className="font-display text-2xl text-zinc-50">Workspace chat</CardTitle>
                  <Badge className="border-violet-400/20 bg-violet-500/10 text-violet-200">
                    Persistent
                  </Badge>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Ask Miss Nancy to plan work, create a project, save memory, or break a goal into
                  tasks. Messages and results are tied to your real workspace session.
                </p>
              </div>

              {isStreaming ? (
                <Button type="button" variant="secondary" onClick={handleStop}>
                  <StopCircle className="h-4 w-4" />
                  Stop
                </Button>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="scrollbar-subtle h-[600px] overflow-y-auto px-4 py-5 md:px-6">
              {messages.length ? (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const toolResults = extractToolResults(message.metadata);

                    return (
                      <div key={message.id} className="space-y-3">
                        <div
                          className={cn(
                            "flex",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-7 md:max-w-[84%]",
                              message.role === "user"
                                ? "rounded-br-md border-zinc-800 bg-zinc-900 text-zinc-100"
                                : "rounded-bl-md border-zinc-800 bg-zinc-900/70 text-zinc-200"
                            )}
                          >
                            {message.text ? (
                              <p className="whitespace-pre-wrap text-pretty">{message.text}</p>
                            ) : (
                              <div className="flex items-center gap-2 text-zinc-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Streaming…</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {message.role === "assistant" && toolResults.length ? (
                          <div className="space-y-2 pl-0 md:pl-4">
                            {toolResults.map((toolResult, index) => (
                              <div
                                key={`${message.id}-${toolResult.toolName}-${index}`}
                                className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4"
                              >
                                <div className="flex items-center gap-3">
                                  {toolResult.toolName === "createProject" ? (
                                    <FolderKanban className="h-4 w-4 text-violet-300" />
                                  ) : toolResult.toolName === "saveMemory" ? (
                                    <BrainCircuit className="h-4 w-4 text-sky-300" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-emerald-300" />
                                  )}
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-zinc-50">
                                      {toolResult.toolName}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-300">
                                      {getToolResultSummary(toolResult.toolName, toolResult.result)}
                                    </p>
                                  </div>
                                </div>

                                {toolResult.result && typeof toolResult.result === "object" ? (
                                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs leading-6 text-zinc-400">
                                    {JSON.stringify(toolResult.result, null, 2)}
                                  </pre>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  <div ref={endRef} />
                </div>
              ) : (
                <div className="flex h-full min-h-[480px] items-center justify-center">
                  <div className="max-w-xl text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-3xl text-zinc-50">
                      Start a workspace conversation
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">
                      Create a new session and use natural language to generate tasks, projects, and
                      saved memory directly into your workspace.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800/80 px-4 py-4 md:px-6">
              {error ? (
                <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask Miss Nancy to create tasks, open a project, save memory, or plan execution..."
                  className="min-h-[108px] resize-none"
                  disabled={isStreaming}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
                    <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                    Authenticated chat is session-aware and backed by real workspace data.
                  </div>

                  <Button type="submit" disabled={!input.trim() || isStreaming}>
                    {isStreaming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Streaming
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <Badge className="mb-3 w-fit border-violet-400/20 bg-violet-500/10 text-violet-200">
                Recent projects
              </Badge>
              <CardTitle className="font-display text-xl text-zinc-50">Live workspace data</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectList
                projects={projects.slice(0, 4)}
                compact
                taskCountByProjectId={taskCountByProjectId}
                emptyTitle="No projects yet"
              />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <Badge variant="secondary" className="mb-3 w-fit">
                Recent memory
              </Badge>
              <CardTitle className="font-display text-xl text-zinc-50">Saved context</CardTitle>
            </CardHeader>
            <CardContent>
              <MemoryList
                items={memoryItems.slice(0, 3)}
                compact
                projectNameById={projectNameById}
                emptyTitle="No memory saved yet"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  );
}
