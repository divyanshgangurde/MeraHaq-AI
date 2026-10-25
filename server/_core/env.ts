export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // LLM provider (OpenAI-compatible). Defaults target OpenRouter so the app
  // runs outside Manus; set LLM_BASE_URL / LLM_API_KEY / LLM_MODEL to use any
  // compatible provider (OpenRouter, OpenAI, Gemini's compatible endpoint...).
  llmBaseUrl: process.env.LLM_BASE_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "openai/gpt-5-mini",
  // Default output cap applied when a caller does not set maxTokens.
  // OpenRouter reserves credit against the model's maximum output when no
  // cap is sent (65536 tokens for gpt-5-mini), which 402s low-balance keys
  // even for short answers. A sane default keeps requests affordable.
  llmMaxTokens: Number(process.env.LLM_MAX_TOKENS ?? "4096"),
  // Embedding model on the same OpenAI-compatible provider (OpenRouter
  // serves it at /api/v1/embeddings). Used for chunk + query vectors; the
  // system degrades to lexical + term-overlap ranking when unset/failing.
  embeddingModel:
    process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-small",
  // Local-disk object storage root (replaces the Manus Forge S3 flow).
  storageDir: process.env.STORAGE_DIR ?? "",
  // Legacy Manus Forge settings, kept only as a fallback when the LLM_*
  // variables above are not set. New deployments should not use these.
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
