import { auth } from "@clerk/nextjs/server";
import { streamText, tool } from "ai";
import { z } from "zod";

import {
  appendMessage,
  createProject,
  createSession,
  createTask,
  deriveSessionTitleFromPrompt,
  ensureProfile,
  getSessionById,
  saveMemory
} from "@/lib/supabase/queries";

const chatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().trim().min(1).max(12000)
      })
    )
    .min(1)
    .max(40)
});

const SYSTEM_PROMPT = `
You are Miss Nancy inside the authenticated workspace.

Operate as an execution-first AI companion.
Use tools when the user asks to:
- create or track a task,
- create a project,
- save reusable context or memory.

Ground all claims in the real workspace foundation:
- authenticated workspace,
- persistent sessions,
- tasks,
- projects,
- memory_items,
- streamed chat,
- Supabase-backed persistence.

Never claim:
- background work after the chat ends,
- unlimited memory,
- unconfigured external tools,
- hidden CRM or calendar execution,
- successful actions that did not occur.

When appropriate:
- createTask for actionable next steps,
- createProject for named workstreams or initiatives,
- saveMemory for durable facts, preferences, decisions, or constraints.

Be concise, practical, and structured.
`.trim();

function createPlainTextStreamResponse(
  text: string,
  init?: ResponseInit & {
    chunkDelayMs?: number;
  }
) {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/).filter(Boolean);
  const chunkDelayMs = init?.chunkDelayMs ?? 10;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of words) {
        controller.enqueue(encoder.encode(chunk));
        if (chunkDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, chunkDelayMs));
        }
      }

      controller.close();
    }
  });

  return new Response(stream, {
    status: init?.status ?? 200,
    statusText: init?.statusText,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...(init?.headers ?? {})
    }
  });
}

function buildFallbackText(prompt: string, sessionId: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("task")) {
    return `Live AI is not configured, so the workspace is running in graceful fallback mode.

I can still maintain the authenticated session structure, but I cannot generate a live model response right now.

Best next move:
1. State the outcome.
2. Split it into 3 to 5 tasks.
3. Save the important decision criteria as memory.
4. Put everything under one project if the work spans multiple steps.

Session ready: ${sessionId}`;
  }

  if (normalized.includes("project")) {
    return `Live AI is not configured, so the workspace is running in graceful fallback mode.

Use one project for the named initiative, then attach tasks and memory_items beneath it. This keeps the workspace structured without pretending there is autonomous background execution.

Session ready: ${sessionId}`;
  }

  if (normalized.includes("memory")) {
    return `Live AI is not configured, so the workspace is running in graceful fallback mode.

Save facts, constraints, decisions, and preferences as memory_items. That gives the workspace deliberate continuity without claiming unlimited memory.

Session ready: ${sessionId}`;
  }

  return `Live AI is not configured, so the workspace is running in graceful fallback mode.

The authenticated chat route is active, Clerk authentication is verified, and session persistence is available. Configure AI_GATEWAY_API_KEY to enable full model streaming and tool-driven execution.

Session ready: ${sessionId}`;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const authObject = await auth();

  if (!authObject.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = chatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return createPlainTextStreamResponse(
        "Please send a valid sessionId and chat message history.",
        {
          status: 400
        }
      );
    }

    await ensureProfile();

    const latestUserMessage = [...parsed.data.messages]
      .reverse()
      .find((message) => message.role === "user");

    if (!latestUserMessage) {
      return createPlainTextStreamResponse("At least one user message is required.", {
        status: 400
      });
    }

    const session = parsed.data.sessionId
      ? await getSessionById(parsed.data.sessionId)
      : await createSession({
          title: deriveSessionTitleFromPrompt(latestUserMessage.content)
        });

    await appendMessage(session.id, {
      role: "user",
      content: latestUserMessage.content,
      metadata: {
        source: "workspace_chat"
      }
    });

    if (!process.env.AI_GATEWAY_API_KEY) {
      const fallbackText = buildFallbackText(latestUserMessage.content, session.id);

      await appendMessage(session.id, {
        role: "assistant",
        content: fallbackText,
        model: "fallback",
        metadata: {
          fallback: true
        }
      });

      return createPlainTextStreamResponse(fallbackText, {
        headers: {
          "X-Chat-Mode": "fallback",
          "X-Session-Id": session.id
        }
      });
    }

    const result = streamText({
      model: "openai/gpt-5.4",
      system: SYSTEM_PROMPT,
      messages: parsed.data.messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      tools: {
        createTask: tool({
          description:
            "Create a task in the authenticated workspace when the user asks to track or execute an actionable next step.",
          inputSchema: z.object({
            title: z.string().trim().min(1).max(200),
            description: z.string().trim().max(2000).optional(),
            projectId: z.string().uuid().optional(),
            priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
            status: z.enum(["todo", "in_progress", "blocked", "done"]).default("todo"),
            dueAt: z.string().datetime().optional()
          }),
          execute: async (input) => {
            const task = await createTask({
              title: input.title,
              description: input.description ?? null,
              projectId: input.projectId ?? null,
              createdFromSessionId: session.id,
              priority: input.priority,
              status: input.status,
              dueAt: input.dueAt ?? null,
              source: "assistant",
              metadata: {
                origin: "api_chat_tool"
              }
            });

            return {
              id: task.id,
              title: task.title,
              status: task.status,
              priority: task.priority,
              projectId: task.project_id,
              dueAt: task.due_at
            };
          }
        }),
        createProject: tool({
          description:
            "Create a project in the authenticated workspace when the user wants a named initiative, workstream, or container for tasks.",
          inputSchema: z.object({
            name: z.string().trim().min(1).max(140),
            description: z.string().trim().max(2000).optional(),
            status: z.enum(["active", "on_hold", "completed", "archived"]).default("active"),
            color: z.string().trim().max(32).optional()
          }),
          execute: async (input) => {
            const project = await createProject({
              name: input.name,
              description: input.description ?? null,
              status: input.status,
              color: input.color ?? null,
              metadata: {
                origin: "api_chat_tool"
              }
            });

            return {
              id: project.id,
              name: project.name,
              slug: project.slug,
              status: project.status,
              color: project.color
            };
          }
        }),
        saveMemory: tool({
          description:
            "Save a reusable memory item when the user shares a durable preference, fact, decision, constraint, or summary that should persist.",
          inputSchema: z.object({
            content: z.string().trim().min(1).max(4000),
            kind: z
              .enum(["general", "preference", "fact", "constraint", "summary", "decision"])
              .default("general"),
            importance: z.number().int().min(1).max(5).default(3),
            projectId: z.string().uuid().optional()
          }),
          execute: async (input) => {
            const memory = await saveMemory({
              content: input.content,
              kind: input.kind,
              importance: input.importance,
              projectId: input.projectId ?? null,
              sessionId: session.id,
              source: "assistant",
              metadata: {
                origin: "api_chat_tool"
              }
            });

            return {
              id: memory.id,
              content: memory.content,
              kind: memory.kind,
              importance: memory.importance
            };
          }
        })
      },
      maxSteps: 5,
      abortSignal: request.signal,
      onFinish: async ({ text, steps, finishReason }) => {
        const toolResults = steps.flatMap((step) =>
          (step.toolResults ?? []).map((result) => ({
            toolName: result.toolName,
            result: result.output
          }))
        );

        const finalText =
          text.trim() ||
          "I completed the request, but the model returned no visible text.";

        await appendMessage(session.id, {
          role: "assistant",
          content: finalText,
          model: "openai/gpt-5.4",
          metadata: {
            finishReason,
            toolResults
          }
        });
      }
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-store",
        "X-Chat-Mode": "live",
        "X-Session-Id": session.id
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected workspace chat error.";

    return createPlainTextStreamResponse(
      `The authenticated chat route encountered an error.\n\n${message}`,
      {
        status: 500,
        headers: {
          "X-Chat-Mode": "error"
        }
      }
    );
  }
}
