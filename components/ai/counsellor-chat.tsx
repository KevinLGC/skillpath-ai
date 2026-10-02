"use client";

import { useRef, useState } from "react";
import { Bot, Info, Loader2, Send, Sparkles, User as UserIcon } from "lucide-react";
import { Alert, Badge, Button, Card, CardContent, Input } from "@/components/ui/primitives";
import { Disclaimer, SourceList } from "@/components/ui/misc";
import type { AnswerSource, GroundingLevel, Locale } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  grounding?: GroundingLevel | null;
  sources?: AnswerSource[];
  mode?: "llm" | "retrieval" | null;
  uncertainty?: string | null;
}

const GROUNDING_COPY: Record<GroundingLevel, { en: string; te: string; variant: "success" | "warning" | "accent" | "muted" }> = {
  sourced: { en: "From sources", te: "మూలాల నుండి", variant: "success" },
  estimated: { en: "Contains estimates", te: "అంచనాలు ఉన్నాయి", variant: "warning" },
  guidance: { en: "General guidance", te: "సాధారణ మార్గదర్శనం", variant: "accent" },
  uncertain: { en: "Not in sources", te: "మూలాలలో లేదు", variant: "muted" },
};

export function CounsellorChat({
  locale,
  roleContext,
  suggestedQuestions,
}: {
  locale: Locale;
  roleContext: "student" | "family" | "counsellor";
  suggestedQuestions: string[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 3 || busy) return;
    setBusy(true);
    setError(null);
    setMessages((previous) => [...previous, { role: "user", content: trimmed }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, roleContext, sessionId }),
      });

      const body = (await response.json()) as {
        error?: string;
        detail?: string;
        sessionId?: string;
        answer?: string;
        grounding?: GroundingLevel;
        sources?: AnswerSource[];
        uncertainty?: string | null;
        mode?: "llm" | "retrieval";
      };

      if (!response.ok) {
        setError(body.detail ?? body.error ?? "The counsellor is unavailable right now.");
        setBusy(false);
        return;
      }

      if (body.sessionId) setSessionId(body.sessionId);
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: body.answer ?? "",
          grounding: body.grounding ?? "guidance",
          sources: body.sources ?? [],
          mode: body.mode ?? "retrieval",
          uncertainty: body.uncertainty ?? null,
        },
      ]);
    } catch {
      setError("Network problem — the rest of the platform still works, and your plan is unchanged.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card className="flex min-h-[520px] flex-col">
        <CardContent className="flex flex-1 flex-col gap-3 pt-5">
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-2 rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
                <p className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {locale === "te" ? "ఒక ప్రశ్నతో ప్రారంభించండి" : "Start with a question"}
                </p>
                <p>
                  {locale === "te"
                    ? "సమాధానాలు నాలెడ్జ్ బేస్ పత్రాల ఆధారంగా ఉంటాయి, మూలాలతో సహా. మూలాలు లేకపోతే 'దొరకలేదు' అని చెబుతుంది."
                    : "Answers are grounded in the knowledge base and cite their sources. If nothing relevant is found, it says so instead of guessing."}
                </p>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                {message.role === "assistant" ? (
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--accent)]">
                    <Bot className="h-4 w-4" aria-hidden />
                  </span>
                ) : null}
                <div className={cn("max-w-[85%] space-y-2 rounded-xl border p-3 text-sm", message.role === "user" ? "bg-[var(--secondary)]" : "border-[var(--border)]")}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {message.grounding ? (
                          <Badge variant={GROUNDING_COPY[message.grounding].variant}>
                            {GROUNDING_COPY[message.grounding][locale]}
                          </Badge>
                        ) : null}
                        {message.mode === "retrieval" ? (
                          <Badge variant="outline">
                            {locale === "te" ? "మోడల్ లేకుండా, మూలాల నుండి" : "retrieval-only (no model used)"}
                          </Badge>
                        ) : null}
                      </div>
                      {message.uncertainty ? (
                        <p className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                          <Info className="mt-0.5 h-3 w-3" aria-hidden />
                          {message.uncertainty}
                        </p>
                      ) : null}
                      <SourceList sources={message.sources ?? []} locale={locale} />
                    </>
                  ) : (
                    <span className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <UserIcon className="h-3 w-3" aria-hidden />
                      {locale === "te" ? "మీరు" : "You"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {busy ? (
              <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {locale === "te" ? "నాలెడ్జ్ బేస్ చూస్తున్నాను…" : "Checking the knowledge base…"}
              </p>
            ) : null}
          </div>

          {error ? <Alert variant="warning" title={locale === "te" ? "సమస్య" : "Something interrupted that"}>
            <p>{error}</p>
          </Alert> : null}

          <form
            className="flex items-center gap-2 border-t border-[var(--border)] pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
          >
            <label className="sr-only" htmlFor="chat-input">
              {locale === "te" ? "ప్రశ్న" : "Question"}
            </label>
            <Input
              id="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={locale === "te" ? "ఒక ప్రశ్న అడగండి…" : "Ask a question…"}
              disabled={busy}
            />
            <Button type="submit" disabled={busy || input.trim().length < 3}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {locale === "te" ? "అడగండి" : "Ask"}
            </Button>
          </form>
          <Disclaimer locale={locale} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-2 pt-5">
            <p className="text-sm font-semibold">{locale === "te" ? "సూచించిన ప్రశ్నలు" : "Suggested questions"}</p>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void ask(question)}
                  className="rounded-lg border border-[var(--border)] p-2 text-left text-sm hover:bg-[var(--secondary)]"
                  disabled={busy}
                >
                  {question}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 pt-5 text-sm text-[var(--muted-foreground)]">
            <p className="font-medium text-[var(--foreground)]">
              {locale === "te" ? "ఈ సహాయకుడు ఏమి చేయదు" : "What this assistant will not do"}
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>{locale === "te" ? "జీతం లేదా ఉద్యోగం హామీ ఇవ్వదు" : "It will not guarantee a salary, job or admission"}</li>
              <li>{locale === "te" ? "మీ తరఫున నిర్ణయం తీసుకోదు" : "It will not decide for the student"}</li>
              <li>{locale === "te" ? "మూలాలు లేకుండా సమాధానం ఇవ్వదు" : "It will not answer without citing a retrieved source"}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
