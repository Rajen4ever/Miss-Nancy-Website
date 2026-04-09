"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Sparkles, StopCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type PublicDemoChatProps = {
  apiRoute?: string;
  mode?: "public" | "workspace";
  title?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  initialMessages?: DemoMessage[];
};

const DEFAULT_MESSAGES: DemoMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    content:
      "I’m the safe public demo. Ask me to plan something, break work into tasks, or explain how Miss Nancy turns chat into structured execution."
  }
];

const PUBLIC_SUGGESTIONS = [
  "Plan a product launch week",
  "Turn this idea into 5 tasks",
  "Explain how memory_items would help"
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function PublicDemoChat({
  apiRoute = "/api/demo-chat",
  mode = "public",
  title = "Public demo chat",
  description = "Try a safe streamed preview of Miss Nancy.",
  placeholder = "Ask Miss Nancy to plan, organize, or explain something...",
  className,
  initialMessages = DEFAULT_MESSAGES
}: PublicDemoChatProps) {
  const [messages, setMessages] = useState<DemoMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = useMemo(
    () => (mode === "public" ? PUBLIC_SUGGESTIONS : ["Draft today’s priorities", "Create a new project", "Save this as memory"]),
    [mode]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function sendPrompt(prompt: string) {
    const trimmed = prompt.trim();

    if (!trimmed || isStreaming) {
      return;
    }

    setError(null);
    setInput("");

    const userMessage: DemoMessage = {
      id: createId("user"),
      role: "user",
      content: trimmed
    };

    const assistantId = createId("assistant");
    const assistantPlaceholder: DemoMessage = {
      id: assistantId,
      role: "assistant",
      content: ""
    };

    const nextMessages = [...messages, userMessage, assistantPlaceholder];
    setMessages(nextMessages);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: trimmed,
          messages: nextMessages
            .filter((message) => message.id !== assistantId)
            .map(({ role, content }) => ({ role, content }))
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Request failed.");
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
            message.id === assistantId ? { ...message, content: streamedText } : message
          )
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  streamedText.trim() ||
                  "I’m here, but I could not generate a response for that prompt."
              }
            : message
        )
      );
    } catch (caughtError) {
      const aborted =
        caughtError instanceof DOMException && caughtError.name === "AbortError";

      const message = aborted
        ? "Streaming stopped."
        : caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while generating the demo response.";

      setError(aborted ? null : message);

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: aborted
                  ? "Streaming stopped before the response completed."
                  : "I hit an error while generating that response. Please try again."
              }
            : item
        )
      );
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendPrompt(input);
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-zinc-800 bg-zinc-950/90 shadow-panel",
        mode === "workspace" && "border-zinc-800 bg-zinc-950",
        className
      )}
    >
      <CardHeader className="border-b border-zinc-800/80 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <p className="font-display text-xl font-semibold tracking-[-0.02em] text-zinc-50">
                {title}
              </p>
              <Badge
                className={cn(
                  mode === "public"
                    ? "border-violet-400/20 bg-violet-500/10 text-violet-200"
                    : "border-zinc-700 bg-zinc-900 text-zinc-300"
                )}
              >
                {mode === "public" ? "Safe preview" : "Workspace chat"}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <Button type="button" variant="secondary" size="sm" onClick={handleStop}>
                <StopCircle className="h-4 w-4" />
                Stop
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => void sendPrompt(suggestion)}
              disabled={isStreaming}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="scrollbar-subtle h-[460px] overflow-y-auto px-4 py-5 md:px-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-7 md:max-w-[82%]",
                    message.role === "user"
                      ? "rounded-br-md border-zinc-800 bg-zinc-900 text-zinc-100"
                      : "rounded-bl-md border-zinc-800 bg-zinc-900/70 text-zinc-200"
                  )}
                >
                  {message.content ? (
                    <p className="whitespace-pre-wrap text-pretty">{message.content}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Streaming…</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-zinc-800/80 px-4 py-4 md:px-6">
          {error ? (
            <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          ) : null}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={placeholder}
              className="min-h-[104px] resize-none"
              disabled={isStreaming}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                {mode === "public"
                  ? "Public-safe preview with graceful fallback when no AI key is configured."
                  : "Basic streamed workspace UI wired for the current demo route."}
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
  );
}
