import "server-only";

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type RichMessage = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

export function helperEnabled() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function helperModel() {
  return process.env.OPENROUTER_MODEL || "z-ai/glm-5.3-flash";
}

/**
 * Streams a chat completion from OpenRouter and yields the text as it
 * arrives. By default only providers that don't collect or train on prompts
 * are used (young people are typing into this); set
 * OPENROUTER_ALLOW_DATA_COLLECTION=true to relax that.
 */
export async function* streamChat(messages: ChatMessage[], origin: string, signal?: AbortSignal): AsyncGenerator<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": origin,
      "X-Title": "PG Scouts JOTA-JOTI badges",
    },
    body: JSON.stringify({
      model: helperModel(),
      messages,
      stream: true,
      max_tokens: 700,
      temperature: 0.4,
      reasoning: { effort: "low", exclude: true },
      provider: process.env.OPENROUTER_ALLOW_DATA_COLLECTION === "true" ? undefined : { data_collection: "deny" },
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue; // skips ": OPENROUTER PROCESSING" keep-alives
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        if (json.error) throw new Error(json.error.message ?? "OpenRouter error");
        const text = json.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  }
}

// Best-effort per-person limit, in memory.
const usage = new Map<string, number[]>();
const LIMIT_PER_HOUR = 40;

export function overHelperLimit(key: string) {
  const now = Date.now();
  const recent = (usage.get(key) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= LIMIT_PER_HOUR) {
    usage.set(key, recent);
    return true;
  }
  recent.push(now);
  usage.set(key, recent);
  return false;
}

/** One complete (non-streamed) reply, for background jobs like describing evidence or writing feedback. */
export async function chatComplete(messages: RichMessage[], options: { maxTokens?: number; temperature?: number } = {}) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "PG Scouts JOTA-JOTI badges",
    },
    body: JSON.stringify({
      model: helperModel(),
      messages,
      max_tokens: options.maxTokens ?? 400,
      temperature: options.temperature ?? 0.3,
      reasoning: { effort: "low", exclude: true },
      provider: process.env.OPENROUTER_ALLOW_DATA_COLLECTION === "true" ? undefined : { data_collection: "deny" },
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}
