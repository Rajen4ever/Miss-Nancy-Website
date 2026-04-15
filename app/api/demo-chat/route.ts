import { streamText } from "ai";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000)
      })
    )
    .max(24)
    .optional()
});

const SYSTEM_PROMPT = `
You are Miss Nancy running in a public demo route for a marketing site.

Behavior rules:
- Be concise, sharp, helpful, and execution-oriented.
- Help with planning, prioritization, breaking work into tasks, project framing, and explaining how Miss Nancy works.
- Do not claim background work after the chat ends.
- Do not claim private account access, secret integrations, unlimited memory, or live tool execution unless the user explicitly asks about the authenticated workspace foundations.
- If asked to perform external actions, explain that the protected workspace and configured connectors are required.
- If the user asks what Miss Nancy can do, ground the answer in the real shipped foundation: streamed chat, persistent sessions, tasks, projects, memory_items, auth, persistence, billing readiness, and connector-ready lanes.
- Keep responses safe for a public preview.
`.trim();

function createPlainTextStreamResponse(
  text: string,
  init?: ResponseInit & {
    chunkDelayMs?: number;
  }
) {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/).filter(Boolean);
  const chunkDelayMs = init?.chunkDelayMs ?? 12;

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

function buildFallbackText(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (
    normalized.includes("launch") ||
    normalized.includes("plan") ||
    normalized.includes("roadmap")
  ) {
    return `Fallback demo mode is active because no live AI key is configured.

Here is a practical execution plan:

1. Define the outcome in one sentence.
2. Turn the outcome into 3 milestones.
3. Create the first 5 tasks with owners or deadlines.
4. Save decision criteria as memory so later sessions stay aligned.
5. Review blockers before expanding scope.

Inside the full Miss Nancy workspace, this kind of prompt maps cleanly to a streamed conversation plus structured task, project, and memory creation.`;
  }

  if (
    normalized.includes("task") ||
    normalized.includes("todo") ||
    normalized.includes("organize")
  ) {
    return `Fallback demo mode is active because no live AI key is configured.

A strong way to organize this is:
- capture the objective,
- group work into 3 buckets,
- create the next smallest executable tasks,
- mark blockers separately,
- save reusable context as memory.

That mirrors how Miss Nancy is designed to turn conversation into persistent structured work inside the protected workspace.`;
  }

  if (
    normalized.includes("memory") ||
    normalized.includes("remember") ||
    normalized.includes("context")
  ) {
    return `Fallback demo mode is active because no live AI key is configured.

memory_items are best used for facts, preferences, decisions, constraints, and reusable summaries. The point is not fake unlimited memory. The point is deliberate saved context that can be reviewed and reused across future workspace sessions.`;
  }

  return `Fallback demo mode is active because no live AI key is configured.

You can use this public demo to test the product shape:
- ask for a plan,
- ask for task breakdowns,
- ask how projects or memory should be structured,
- ask what the authenticated workspace does.

The real product foundation is a protected workspace with streamed chat, persistent sessions, tasks, projects, memory_items, auth, Supabase persistence, and billing-ready infrastructure.`;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return createPlainTextStreamResponse(
        "Please send a valid prompt or message history for the demo chat.",
        {
          status: 400
        }
      );
    }

    const prompt =
      parsed.data.prompt ??
      parsed.data.messages?.filter((message) => message.role === "user").at(-1)?.content ??
      "";

    if (!prompt) {
      return createPlainTextStreamResponse("Please enter a prompt to start the demo.", {
        status: 400
      });
    }

    const aiGatewayApiKey = process.env["AI_GATEWAY_API_KEY"];

    if (!aiGatewayApiKey) {
      return createPlainTextStreamResponse(buildFallbackText(prompt), {
        headers: {
          "X-Demo-Mode": "fallback"
        }
      });
    }

    const result = streamText({
      model: "openai/gpt-5.4",
      system: SYSTEM_PROMPT,
      messages:
        parsed.data.messages?.map((message) => ({
          role: message.role,
          content: message.content
        })) ?? [{ role: "user", content: prompt }],
      abortSignal: request.signal
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-store",
        "X-Demo-Mode": "live"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The public demo route hit an unexpected error.";

    return createPlainTextStreamResponse(
      `Demo fallback response:\n\n${message}\n\nTry again, or configure AI_GATEWAY_API_KEY to enable live streaming.`,
      {
        status: 200,
        headers: {
          "X-Demo-Mode": "error-fallback"
        }
      }
    );
  }
}
