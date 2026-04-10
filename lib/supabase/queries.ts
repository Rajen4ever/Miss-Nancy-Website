import { auth, currentUser } from "@clerk/nextjs/server";

import {
  createSupabaseServerClient,
  type AppSupabaseClient,
  type Database,
  type Json
} from "@/lib/supabase";
import { slugify, truncate } from "@/lib/utils";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type MemoryRow = Database["public"]["Tables"]["memory_items"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];
type TaskPriority = Database["public"]["Enums"]["task_priority"];
type MemoryKind = Database["public"]["Enums"]["memory_kind"];

type AuthenticatedContext = {
  userId: string;
  supabase: AppSupabaseClient;
};

export type MessageRole = MessageRow["role"];

export type ChatMessageInput = {
  role: MessageRole;
  content: string;
  model?: string | null;
  toolName?: string | null;
  toolCallId?: string | null;
  metadata?: Json;
};

export type CreateSessionInput = {
  title?: string;
  summary?: string | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  projectId?: string | null;
  createdFromSessionId?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueAt?: string | null;
  source?: string;
  metadata?: Json;
};

export type CreateProjectInput = {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  color?: string | null;
  metadata?: Json;
};

export type SaveMemoryInput = {
  content: string;
  kind?: MemoryKind;
  importance?: number;
  projectId?: string | null;
  sessionId?: string | null;
  source?: string;
  metadata?: Json;
};

export type WorkspaceOverview = {
  profile: {
    firstName: string | null;
    email: string | null;
  };
  counts: {
    sessions: number;
    tasks: number;
    projects: number;
    memoryItems: number;
  };
  recentSessions: SessionRow[];
  recentTasks: TaskRow[];
  recentProjects: ProjectRow[];
  recentMemoryItems: MemoryRow[];
};

function createTextContent(text: string): Json {
  return [
    {
      type: "text",
      text
    }
  ];
}

function extractTextContent(content: Json): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: string }).type === "text" &&
          "text" in part
        ) {
          const value = (part as { text?: unknown }).text;
          return typeof value === "string" ? value : "";
        }

        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (content && typeof content === "object" && "text" in content) {
    const value = (content as { text?: unknown }).text;
    return typeof value === "string" ? value : "";
  }

  return "";
}

function assertNoError(error: { message: string } | null): asserts error is null {
  if (error) {
    throw new Error(error.message);
  }
}

async function requireAuthenticatedContext(): Promise<AuthenticatedContext> {
  const authObject = await auth();

  if (!authObject.userId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createSupabaseServerClient();
  await ensureProfile();

  return {
    userId: authObject.userId,
    supabase
  };
}

export async function ensureProfile() {
  const authObject = await auth();

  if (!authObject.userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("Unable to load current Clerk user.");
  }

  const supabase = await createSupabaseServerClient();

  const primaryEmail =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;

  if (!primaryEmail) {
    throw new Error("Current user does not have a valid email address.");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: authObject.userId,
      email: primaryEmail,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      image_url: user.imageUrl ?? null
    },
    {
      onConflict: "clerk_user_id"
    }
  );

  assertNoError(error);
}

async function assertSessionOwnership(
  supabase: AppSupabaseClient,
  sessionId: string
): Promise<SessionRow> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  assertNoError(error);

  if (!data) {
    throw new Error("Session not found.");
  }

  return data;
}

async function assertProjectOwnership(
  supabase: AppSupabaseClient,
  projectId: string
): Promise<ProjectRow> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  assertNoError(error);

  if (!data) {
    throw new Error("Project not found.");
  }

  return data;
}

async function buildUniqueProjectSlug(
  supabase: AppSupabaseClient,
  projectName: string
) {
  const baseSlug = slugify(projectName) || "project";

  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);

  assertNoError(error);

  const existing = new Set((data ?? []).map((item) => item.slug));

  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export async function listSessions(limit = 20): Promise<SessionRow[]> {
  const { supabase } = await requireAuthenticatedContext();

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(limit);

  assertNoError(error);

  return (data ?? []) as SessionRow[];
}

export async function getSessionById(sessionId: string): Promise<SessionRow> {
  const { supabase } = await requireAuthenticatedContext();
  return assertSessionOwnership(supabase, sessionId);
}

export async function createSession(
  input: CreateSessionInput = {}
): Promise<SessionRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  const title = truncate(input.title?.trim() || "New chat", 120);

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      clerk_user_id: userId,
      title,
      summary: input.summary ?? null
    })
    .select("*")
    .single();

  assertNoError(error);

  if (!data) {
    throw new Error("Session creation returned no data.");
  }

  return data as SessionRow;
}

export async function updateSession(
  sessionId: string,
  input: Partial<CreateSessionInput>
): Promise<SessionRow> {
  const { supabase } = await requireAuthenticatedContext();

  await assertSessionOwnership(supabase, sessionId);

  const payload: Database["public"]["Tables"]["sessions"]["Update"] = {};

  if (typeof input.title === "string") {
    payload.title = truncate(input.title.trim() || "New chat", 120);
  }

  if ("summary" in input) {
    payload.summary = input.summary ?? null;
  }

  const { data, error } = await supabase
    .from("sessions")
    .update(payload)
    .eq("id", sessionId)
    .select("*")
    .single();

  assertNoError(error);

  if (!data) {
    throw new Error("Session update returned no data.");
  }

  return data as SessionRow;
}

export async function archiveSession(
  sessionId: string,
  archived = true
): Promise<SessionRow> {
  const { supabase } = await requireAuthenticatedContext();

  await assertSessionOwnership(supabase, sessionId);

  const { data, error } = await supabase
    .from("sessions")
    .update({ archived })
    .eq("id", sessionId)
    .select("*")
    .single();

  assertNoError(error);

  if (!data) {
    throw new Error("Session archive returned no data.");
  }

  return data as SessionRow;
}

export async function listMessages(sessionId: string) {
  const { supabase } = await requireAuthenticatedContext();

  await assertSessionOwnership(supabase, sessionId);

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  assertNoError(error);

  return ((data ?? []) as MessageRow[]).map((message) => ({
    ...message,
    text: extractTextContent(message.content)
  }));
}

export async function appendMessage(
  sessionId: string,
  message: ChatMessageInput
): Promise<MessageRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  await assertSessionOwnership(supabase, sessionId);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      clerk_user_id: userId,
      role: message.role,
      content: createTextContent(message.content),
      model: message.model ?? null,
      tool_name: message.toolName ?? null,
      tool_call_id: message.toolCallId ?? null,
      metadata: message.metadata ?? {}
    })
    .select("*")
    .single();

  assertNoError(error);

  if (!data) {
    throw new Error("Message insert returned no data.");
  }

  return data as MessageRow;
}

export async function appendMessages(
  sessionId: string,
  messages: ChatMessageInput[]
): Promise<MessageRow[]> {
  const { userId, supabase } = await requireAuthenticatedContext();

  await assertSessionOwnership(supabase, sessionId);

  if (!messages.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .insert(
      messages.map((message) => ({
        session_id: sessionId,
        clerk_user_id: userId,
        role: message.role,
        content: createTextContent(message.content),
        model: message.model ?? null,
        tool_name: message.toolName ?? null,
        tool_call_id: message.toolCallId ?? null,
        metadata: message.metadata ?? {}
      }))
    )
    .select("*");

  assertNoError(error);

  return (data ?? []) as MessageRow[];
}

export async function createTask(input: CreateTaskInput): Promise<TaskRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  if (input.projectId) {
    await assertProjectOwnership(supabase, input.projectId);
  }

  if (input.createdFromSessionId) {
    await assertSessionOwnership(supabase, input.createdFromSessionId);
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      clerk_user_id: userId,
      project_id: input.projectId ?? null,
      created_from_session_id: input.createdFromSessionId ?? null,
      title: truncate(input.title.trim(), 200),
      description: input.description?.trim() || null,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      due_at: input.dueAt ?? null,
      source: input.source ?? "assistant",
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();

  assertNoError(error);

  if (!data) {
    throw new Error("Task creation returned no data.");
  }

  return data as TaskRow;
}

export async function listTasks(limit = 20): Promise<TaskRow[]> {
  const { supabase } = await requireAuthenticatedContext();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  assertNoError(error);

  return (data ?? []) as TaskRow[];
}

export async function createProject(
  input: CreateProjectInput
): Promise<ProjectRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  const name = truncate(input.name.trim(), 140);
  const slug = await buildUniqueProjectSlug(supabase, name);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      clerk_user_id: userId,
      name,
      slug,
      description: input.description?.trim() || null,
      status: input.status ?? "active",
      color: input.color ?? null,
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();

  assertNoError(error);

  if (!data) {
    throw new Error("Project creation returned no data.");
  }

  return data as ProjectRow;
}

export async function listProjects(limit = 20): Promise<ProjectRow[]> {
  const { supabase } = await requireAuthenticatedContext();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  assertNoError(error);

  return (data ?? []) as ProjectRow[];
}

export async function saveMemory(input: SaveMemoryInput): Promise<MemoryRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  if (input.projectId) {
    await assertProjectOwnership(supabase, input.projectId);
  }

  if (input.sessionId) {
    await assertSessionOwnership(supabase, input.sessionId);
  }

  const importance = Math.min(5, Math.max(1, Math.round(input.importance ?? 3)));

  const { data, error } = await supabase
    .from("memory_items")
    .insert({
      clerk_user_id: userId,
      project_id: input.projectId ?? null,
      session_id: input.sessionId ?? null,
      content: input.content.trim(),
      kind: input.kind ?? "general",
      importance,
      source: input.source ?? "assistant",
      metadata: input.metadata ?? {}
    })
    .select("*")
    .single();

  assertNoError(error);

  if (!data) {
    throw new Error("Memory creation returned no data.");
  }

  return data as MemoryRow;
}

export async function listMemoryItems(limit = 20): Promise<MemoryRow[]> {
  const { supabase } = await requireAuthenticatedContext();

  const { data, error } = await supabase
    .from("memory_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  assertNoError(error);

  return (data ?? []) as MemoryRow[];
}

export async function getWorkspaceOverview(): Promise<WorkspaceOverview> {
  const { supabase } = await requireAuthenticatedContext();
  const user = await currentUser();

  const [
    sessionsCountResult,
    tasksCountResult,
    projectsCountResult,
    memoryCountResult,
    sessionsResult,
    tasksResult,
    projectsResult,
    memoryResult
  ] = await Promise.all([
    supabase.from("sessions").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("memory_items").select("id", { count: "exact", head: true }),
    supabase
      .from("sessions")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(6),
    supabase.from("tasks").select("*").order("updated_at", { ascending: false }).limit(6),
    supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(6),
    supabase
      .from("memory_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  assertNoError(sessionsCountResult.error);
  assertNoError(tasksCountResult.error);
  assertNoError(projectsCountResult.error);
  assertNoError(memoryCountResult.error);
  assertNoError(sessionsResult.error);
  assertNoError(tasksResult.error);
  assertNoError(projectsResult.error);
  assertNoError(memoryResult.error);

  return {
    profile: {
      firstName: user?.firstName ?? null,
      email:
        user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null
    },
    counts: {
      sessions: sessionsCountResult.count ?? 0,
      tasks: tasksCountResult.count ?? 0,
      projects: projectsCountResult.count ?? 0,
      memoryItems: memoryCountResult.count ?? 0
    },
    recentSessions: (sessionsResult.data ?? []) as SessionRow[],
    recentTasks: (tasksResult.data ?? []) as TaskRow[],
    recentProjects: (projectsResult.data ?? []) as ProjectRow[],
    recentMemoryItems: (memoryResult.data ?? []) as MemoryRow[]
  };
}

export async function getOrCreateSession(
  sessionId: string | null | undefined,
  prompt?: string
): Promise<SessionRow> {
  if (sessionId) {
    return getSessionById(sessionId);
  }

  return createSession({
    title: prompt ? truncate(prompt, 80) : "New chat"
  });
}

export function toPlainTextMessages(
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>
) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content.trim()
  }));
}

export async function getAuthenticatedUserId() {
  const authObject = await auth();

  if (!authObject.userId) {
    throw new Error("Unauthorized");
  }

  return authObject.userId;
}

export async function getAuthenticatedSupabaseContext() {
  return requireAuthenticatedContext();
}

export function readMessageText(message: Pick<MessageRow, "content">) {
  return extractTextContent(message.content);
}

export function deriveSessionTitleFromPrompt(prompt: string) {
  return truncate(prompt.replace(/\s+/g, " ").trim(), 80) || "New chat";
}
