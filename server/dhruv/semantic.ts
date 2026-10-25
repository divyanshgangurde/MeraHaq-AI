import { invokeLLM } from "../_core/llm";
import { ENV } from "../_core/env";
import { normalizeText } from "./normalization";

export type SemanticProfile = { terms: string[] };

function parseProfile(content: unknown): SemanticProfile | null {
  if (typeof content !== "string") return null;
  try {
    const parsed = JSON.parse(content) as { terms?: unknown };
    if (
      !Array.isArray(parsed.terms) ||
      !parsed.terms.every(term => typeof term === "string")
    ) {
      return null;
    }
    return {
      terms: Array.from(
        new Set(parsed.terms.map(term => normalizeText(term)).filter(Boolean))
      ).slice(0, 16),
    };
  } catch {
    return null;
  }
}

export async function createSemanticProfile(
  text: string
): Promise<SemanticProfile> {
  const normalized = normalizeText(text).slice(0, 6_000);
  if (!normalized) return { terms: [] };
  try {
    const response = await invokeLLM({
      model: ENV.llmModel,
      messages: [
        {
          role: "system",
          content:
            "Extract up to 16 concise semantic concepts from the supplied policy text. Return only concepts grounded in the text; do not infer missing facts.",
        },
        { role: "user", content: normalized },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dhruv_semantic_profile",
          strict: true,
          schema: {
            type: "object",
            properties: { terms: { type: "array", items: { type: "string" } } },
            required: ["terms"],
            additionalProperties: false,
          },
        },
      },
    });
    return parseProfile(response.choices[0]?.message.content) ?? { terms: [] };
  } catch {
    // Retrieval remains safely lexical when the semantic adapter is unavailable.
    return { terms: [] };
  }
}

export function semanticOverlap(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const leftSet = new Set(left.map(normalizeText));
  const rightSet = new Set(right.map(normalizeText));
  let shared = 0;
  leftSet.forEach(term => {
    if (rightSet.has(term)) shared += 1;
  });
  return shared / Math.max(leftSet.size, rightSet.size);
}
