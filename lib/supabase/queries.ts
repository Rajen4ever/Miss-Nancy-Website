import { auth, currentUser } from "@clerk/nextjs/server";

import {
  createSupabaseServerClient,
  type AppSupabaseClient,
  type Database,
  type Json
} from "@/lib/supabase";
import { slugify, truncate } from "@/lib/utils";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type MemoryRow = Database["public"]["Tables"]["memory_items"]["Row"];
type MemoryInsert = Database["public"]["Tables"]["memory_items"]["Insert"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
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

type SingleResult<T> = Promise<{
  data: T | null;
  error: { message: string } | null;
}>;

type ManyResult<T> = Promise<{
  data: T[] | null;
  error: { message: string } | null;
}>;

export function deriveSessionTitleFromPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "New chat";
  }

  return truncate(normalized, 120);
}

function createTextContent(text: string): Json {
  return [
    {
      type: "text",
      text
    }
  ];
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

  const profilesTable = supabase.from("profiles") as unknown as {
    upsert: (
      values: ProfileInsert,
      options: { onConflict: "clerk_user_id" }
    ) => Promise<{ error: { message: string } | null }>;
  };

  const { error } = await profilesTable.upsert(
    {
      clerk_user_id: authObject.userId,
      email: primaryEmail,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      image_url: user.imageUrl ?? null
    },
    { onConflict: "clerk_user_id" }
  );

  assertNoError(error);
}

async function assertSessionOwnership(
  supabase: AppSupabaseClient,
  sessionId: string
): Promise<SessionRow> {
  const sessionsTable = supabase.from("sessions") as unknown as {
    select: (columns: "*") => {
      eq: (column: "id", value: string) => {
        maybeSingle: () => SingleResult<SessionRow>;
      };
    };
  };

  const { data, error } = await sessionsTable.select("*").eq("id", sessionId).maybeSingle();

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
  const projectsTable = supabase.from("projects") as unknown as {
    select: (columns: "*") => {
      eq: (column: "id", value: string) => {
        maybeSingle: () => SingleResult<ProjectRow>;
      };
    };
  };

  const { data, error } = await projectsTable.select("*").eq("id", projectId).maybeSingle();

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

  const projectsTable = supabase.from("projects") as unknown as {
    select: (columns: "slug") => {
      ilike: (column: "slug", pattern: string) => ManyResult<{ slug: string }>;
    };
  };

  const { data, error } = await projectsTable.select("slug").ilike("slug", `${baseSlug}%`);

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

export async function getSessionById(sessionId: string): Promise<SessionRow> {
  const { supabase } = await requireAuthenticatedContext();
  return assertSessionOwnership(supabase, sessionId);
}

export async function createSession(input: CreateSessionInput = {}): Promise<SessionRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  const title = truncate(input.title?.trim() || "New chat", 120);

  const sessionsTable = supabase.from("sessions") as unknown as {
    insert: (values: SessionInsert) => {
      select: (columns: "*") => {
        single: () => SingleResult<SessionRow>;
      };
    };
  };

  const { data, error } = await sessionsTable
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

  return data;
}

export async function appendMessage(
  sessionId: string,
  message: ChatMessageInput
): Promise<MessageRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  await assertSessionOwnership(supabase, sessionId);

  const messagesTable = supabase.from("messages") as unknown as {
    insert: (values: MessageInsert) => {
      select: (columns: "*") => {
        single: () => SingleResult<MessageRow>;
      };
    };
  };

  const { data, error } = await messagesTable
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

  return data;
}

export async function createTask(input: CreateTaskInput): Promise<TaskRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  if (input.projectId) {
    await assertProjectOwnership(supabase, input.projectId);
  }

  if (input.createdFromSessionId) {
    await assertSessionOwnership(supabase, input.createdFromSessionId);
  }

  const tasksTable = supabase.from("tasks") as unknown as {
    insert: (values: TaskInsert) => {
      select: (columns: "*") => {
        single: () => SingleResult<TaskRow>;
      };
    };
  };

  const { data, error } = await tasksTable
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

  return data;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectRow> {
  const { userId, supabase } = await requireAuthenticatedContext();

  const name = truncate(input.name.trim(), 140);
  const slug = await buildUniqueProjectSlug(supabase, name);

  const projectsTable = supabase.from("projects") as unknown as {
    insert: (values: ProjectInsert) => {
      select: (columns: "*") => {
        single: () => SingleResult<ProjectRow>;
      };
    };
  };

  const { data, error } = await projectsTable
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

  return data;
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

  const memoryTable = supabase.from("memory_items") as unknown as {
    insert: (values: MemoryInsert) => {
      select: (columns: "*") => {
        single: () => SingleResult<MemoryRow>;
      };
    };
  };

  const { data, error } = await memoryTable
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

  return data;
}
