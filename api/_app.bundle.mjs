var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/vite-stub.ts
var vite_stub_exports = {};
__export(vite_stub_exports, {
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
async function setupVite(_app, _server) {
  throw new Error(
    "setupVite is unavailable in the serverless bundle (Vercel serves the frontend)."
  );
}
function serveStatic(_app) {
  throw new Error(
    "serveStatic is unavailable in the serverless bundle (Vercel serves the frontend)."
  );
}
var init_vite_stub = __esm({
  "server/_core/vite-stub.ts"() {
  }
});

// server/_core/app.ts
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import {
  boolean,
  float,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var schemes = mysqlTable(
  "schemes",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: varchar("name", { length: 512 }).notNull(),
    description: text("description"),
    issuingDepartment: varchar("issuingDepartment", { length: 512 }),
    coverageStatus: mysqlEnum("coverageStatus", [
      "supported",
      "planned",
      "archived"
    ]).default("planned").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [uniqueIndex("schemes_slug_unique").on(table.slug)]
);
var documents = mysqlTable(
  "documents",
  {
    id: int("id").autoincrement().primaryKey(),
    schemeId: int("schemeId").notNull().references(() => schemes.id),
    title: varchar("title", { length: 1024 }).notNull(),
    documentNumber: varchar("documentNumber", { length: 512 }),
    issuingAuthority: varchar("issuingAuthority", { length: 512 }).notNull(),
    documentType: mysqlEnum("documentType", [
      "guideline",
      "amendment",
      "clarification",
      "corrigendum",
      "notification",
      "order",
      "other"
    ]).notNull(),
    issuedOn: timestamp("issuedOn"),
    effectiveFrom: timestamp("effectiveFrom"),
    effectiveTo: timestamp("effectiveTo"),
    sourceUrl: varchar("sourceUrl", { length: 2048 }).notNull(),
    storageKey: varchar("storageKey", { length: 1024 }),
    extractedTextStorageKey: varchar("extractedTextStorageKey", {
      length: 1024
    }),
    documentHash: varchar("documentHash", { length: 128 }).notNull(),
    pageCount: int("pageCount"),
    metadataJson: json("metadataJson"),
    isOfficial: boolean("isOfficial").default(false).notNull(),
    processingState: mysqlEnum("processingState", [
      "discovered",
      "stored",
      "extracted",
      "indexed",
      "failed"
    ]).default("discovered").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [
    uniqueIndex("documents_hash_unique").on(table.documentHash),
    index("documents_scheme_issued_idx").on(table.schemeId, table.issuedOn),
    index("documents_number_idx").on(table.documentNumber)
  ]
);
var documentArtifacts = mysqlTable(
  "documentArtifacts",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull().references(() => documents.id),
    artifactType: mysqlEnum("artifactType", [
      "original_pdf",
      "extracted_text",
      "page_image"
    ]).notNull(),
    storageKey: varchar("storageKey", { length: 1024 }).notNull(),
    contentHash: varchar("contentHash", { length: 128 }),
    mimeType: varchar("mimeType", { length: 160 }),
    pageNumber: int("pageNumber"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [
    index("artifacts_document_type_idx").on(
      table.documentId,
      table.artifactType
    )
  ]
);
var documentReferences = mysqlTable(
  "documentReferences",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceDocumentId: int("sourceDocumentId").notNull().references(() => documents.id),
    candidateDocumentId: int("candidateDocumentId").references(
      () => documents.id
    ),
    referencedNumber: varchar("referencedNumber", { length: 512 }),
    referencedDate: timestamp("referencedDate"),
    evidenceText: text("evidenceText").notNull(),
    pageStart: int("pageStart").notNull(),
    pageEnd: int("pageEnd").notNull(),
    resolutionState: mysqlEnum("resolutionState", [
      "unresolved",
      "matched",
      "ambiguous",
      "rejected"
    ]).default("unresolved").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [index("references_source_idx").on(table.sourceDocumentId)]
);
var documentRelationships = mysqlTable(
  "documentRelationships",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceDocumentId: int("sourceDocumentId").notNull().references(() => documents.id),
    targetDocumentId: int("targetDocumentId").notNull().references(() => documents.id),
    relationshipType: mysqlEnum("relationshipType", [
      "AMENDS",
      "SUPERSEDES",
      "CORRIGES",
      "REPLACES",
      "REVOKES",
      "EXTENDS",
      "REFERENCES",
      "CONTINUES"
    ]).notNull(),
    scope: text("scope"),
    confidence: float("confidence").notNull(),
    extractionMethod: mysqlEnum("extractionMethod", [
      "deterministic",
      "llm",
      "human"
    ]).notNull(),
    verificationState: mysqlEnum("verificationState", [
      "VERIFIED",
      "AMBIGUOUS",
      "UNVERIFIED",
      "REJECTED"
    ]).default("UNVERIFIED").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => [
    index("relationships_source_idx").on(table.sourceDocumentId),
    index("relationships_target_idx").on(table.targetDocumentId)
  ]
);
var relationshipEvidence = mysqlTable(
  "relationshipEvidence",
  {
    id: int("id").autoincrement().primaryKey(),
    relationshipId: int("relationshipId").notNull().references(() => documentRelationships.id),
    documentId: int("documentId").notNull().references(() => documents.id),
    evidenceText: text("evidenceText").notNull(),
    normalizedEvidenceText: text("normalizedEvidenceText").notNull(),
    pageStart: int("pageStart").notNull(),
    pageEnd: int("pageEnd").notNull(),
    sourceOffsetStart: int("sourceOffsetStart"),
    sourceOffsetEnd: int("sourceOffsetEnd"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [index("relationship_evidence_idx").on(table.relationshipId)]
);
var documentChunks = mysqlTable(
  "documentChunks",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").notNull().references(() => documents.id),
    chunkIndex: int("chunkIndex").notNull(),
    content: text("content").notNull(),
    pageStart: int("pageStart").notNull(),
    pageEnd: int("pageEnd").notNull(),
    tokenCount: int("tokenCount").notNull(),
    contentHash: varchar("contentHash", { length: 128 }).notNull(),
    embeddingJson: json("embeddingJson"),
    vectorDimensions: int("vectorDimensions"),
    lexicalTerms: json("lexicalTerms").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("chunks_document_index_unique").on(
      table.documentId,
      table.chunkIndex
    ),
    index("chunks_document_pages_idx").on(table.documentId, table.pageStart)
  ]
);
var lineageAssertions = mysqlTable(
  "lineageAssertions",
  {
    id: int("id").autoincrement().primaryKey(),
    schemeId: int("schemeId").notNull().references(() => schemes.id),
    documentId: int("documentId").notNull().references(() => documents.id),
    status: mysqlEnum("status", [
      "CURRENT_VERIFIED",
      "HISTORICAL",
      "AMBIGUOUS",
      "UNVERIFIED"
    ]).notNull(),
    scope: text("scope"),
    confidence: float("confidence").notNull(),
    basis: json("basis").notNull(),
    computedAt: timestamp("computedAt").defaultNow().notNull()
  },
  (table) => [
    index("assertions_scheme_status_idx").on(table.schemeId, table.status)
  ]
);
var ingestionRuns = mysqlTable(
  "ingestionRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    documentId: int("documentId").references(() => documents.id),
    sourceUrl: varchar("sourceUrl", { length: 2048 }).notNull(),
    state: mysqlEnum("state", ["queued", "processing", "completed", "failed"]).default("queued").notNull(),
    steps: json("steps").notNull(),
    errorSummary: text("errorSummary"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt")
  },
  (table) => [index("ingestion_runs_state_idx").on(table.state)]
);
var evaluationCases = mysqlTable(
  "evaluationCases",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    schemeId: int("schemeId").notNull().references(() => schemes.id),
    question: text("question").notNull(),
    expectedDocumentIds: json("expectedDocumentIds").notNull(),
    expectedRelationshipTypes: json("expectedRelationshipTypes").notNull(),
    expectedCitationDocumentIds: json("expectedCitationDocumentIds").notNull(),
    expectedVerificationState: mysqlEnum("expectedVerificationState", [
      "VERIFIED",
      "AMBIGUOUS",
      "UNVERIFIED"
    ]).notNull(),
    expectedAnswerNotes: text("expectedAnswerNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [uniqueIndex("evaluation_cases_slug_unique").on(table.slug)]
);
var evaluationRuns = mysqlTable(
  "evaluationRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    evaluationCaseId: int("evaluationCaseId").notNull().references(() => evaluationCases.id),
    mode: mysqlEnum("mode", ["baseline", "dhruv"]).notNull(),
    retrievedDocumentIds: json("retrievedDocumentIds").notNull(),
    selectedDocumentIds: json("selectedDocumentIds").notNull(),
    answer: text("answer"),
    citations: json("citations").notNull(),
    metrics: json("metrics").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
  },
  (table) => [
    index("evaluation_runs_case_mode_idx").on(
      table.evaluationCaseId,
      table.mode
    )
  ]
);

// server/_core/env.ts
var ENV = {
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
  embeddingModel: process.env.EMBEDDING_MODEL ?? "openai/text-embedding-3-small",
  // Local-disk object storage root (replaces the Manus Forge S3 flow).
  storageDir: process.env.STORAGE_DIR ?? "",
  // Legacy Manus Forge settings, kept only as a fallback when the LLM_*
  // variables above are not set. New deployments should not use these.
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path2 from "node:path";

// server/storage.ts
import { promises as fs } from "node:fs";
import path from "node:path";
function getStorageRoot() {
  return ENV.storageDir && ENV.storageDir.trim().length > 0 ? path.resolve(ENV.storageDir) : path.resolve(process.cwd(), "data", "storage");
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
function resolveStoragePath(relKey) {
  const root = getStorageRoot();
  const full = path.resolve(root, normalizeKey(relKey));
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error(`Invalid storage key: ${relKey}`);
  }
  return full;
}
async function storagePut(relKey, data, _contentType = "application/octet-stream") {
  const key = appendHashSuffix(normalizeKey(relKey));
  const full = resolveStoragePath(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  const buffer = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await fs.writeFile(full, buffer);
  return { key, url: `/storage/${key}` };
}

// server/_core/storageProxy.ts
var CONTENT_TYPES = {
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json",
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};
async function serveStorageObject(req, res) {
  const key = req.params[0];
  if (!key) {
    res.status(400).send("Missing storage key");
    return;
  }
  try {
    const full = resolveStoragePath(key);
    const info = await stat(full).catch(() => null);
    if (!info || !info.isFile()) {
      res.status(404).send("Storage object not found");
      return;
    }
    const contentType = CONTENT_TYPES[path2.extname(full).toLowerCase()] ?? "application/octet-stream";
    res.set("Content-Type", contentType);
    res.set("Content-Length", String(info.size));
    res.set("Cache-Control", "no-store");
    createReadStream(full).pipe(res);
  } catch (err) {
    console.error("[Storage] serve failed:", err);
    res.status(500).send("Storage error");
  }
}
function registerStorageProxy(app) {
  app.get("/storage/*", serveStorageObject);
  app.get("/manus-storage/*", serveStorageObject);
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/dhruv/catalog.ts
import { desc, eq as eq2 } from "drizzle-orm";
async function listSupportedPolicyDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    schemeSlug: schemes.slug,
    schemeName: schemes.name,
    documentId: documents.id,
    title: documents.title,
    documentType: documents.documentType,
    issuedOn: documents.issuedOn,
    sourceUrl: documents.sourceUrl,
    processingState: documents.processingState,
    isOfficial: documents.isOfficial
  }).from(documents).innerJoin(schemes, eq2(documents.schemeId, schemes.id)).where(eq2(schemes.coverageStatus, "supported")).orderBy(desc(documents.issuedOn));
}

// server/dhruv/curatedChains.ts
var curatedChains = [
  {
    schemeSlug: "jal-jeevan-mission",
    schemeName: "Jal Jeevan Mission \u2014 Key Resource Centres",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://jaljeevanmission.gov.in/guidelines",
    notes: "The 2020 KRC guideline and a 2023-amended official version are indexed. The verified AMENDS edge is backed by an indexed title-page source span.",
    documents: [
      {
        title: "Guidelines for Capacity Building by Key Resource Centres",
        sourceUrl: "https://jaljeevanmission.gov.in/sites/default/files/manual_document/revised_krc_guidelines.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED"
      },
      {
        title: "Amendment in guidelines for Capacity Building by Key Resource Centre (KRCs)",
        sourceUrl: "https://jaljeevanmission.gov.in/sites/default/files/guideline/Amendment-in-guidelines-for-capacity-building-by-KRCs.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "VERIFIED"
      }
    ]
  },
  {
    schemeSlug: "pm-kisan",
    schemeName: "PM-KISAN operational-guideline lineage",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://pmkisan.gov.in/",
    notes: "The original operational guidelines and paragraph 8.1 amendment are indexed. The AMENDS edge is supported by the indexed phrase \u2018have further been amended and shall be read as follows.\u2019 Link status 2026-10-25: both URLs are live (verified loading in a real browser), but pmkisan.gov.in drops direct fetches from some datacenter networks (empty reply), so the local seed retrieves authentic bytes via Internet Archive snapshots of these exact official URLs (see data/source-cache/manifest.json).",
    documents: [
      {
        title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) Operational Guidelines",
        sourceUrl: "https://pmkisan.gov.in/Documents/OPERATIONAL%20GUIDELINES.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED"
      },
      {
        title: "Amendment to Para 8.1 of Operational Guidelines of PM-KISAN Scheme",
        sourceUrl: "https://pmkisan.gov.in/Documents/Amendment%20to%20OG-converted.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "VERIFIED"
      }
    ]
  },
  {
    schemeSlug: "national-livestock-mission",
    schemeName: "National Livestock Mission operational-guideline lineage",
    status: "VERIFIED_SOURCE_CHAIN",
    sourceArchiveUrl: "https://dahd.gov.in/en/node/345",
    notes: "The July 2021 operational guidelines and the 28 December 2022 amendment order are indexed. The amendment\u2019s explicit subject and reference to the 2021 guidelines support the verified AMENDS edge. Link status 2026-10-25: both dahd.gov.in URLs below now return 404 since the DAHD site rebuild. The guideline's bytes were recovered from an Internet Archive snapshot of the official URL (see data/source-cache/manifest.json). The amendment order (R-99014/45/2021-Anlm_Dadf, 28 Dec 2022) currently survives only on the official NLM portal, nlm.udyamimitra.in, which the gov.in/nic.in-only ingestion rule excludes, and the file is a scanned PDF; local re-ingestion of the amendment is pending a decision on that exception.",
    documents: [
      {
        title: "Operational Guidelines for National Livestock Mission",
        sourceUrl: "https://dahd.gov.in/sites/default/files/2023-11/NLMGuidelinesFinalApprovedByEC.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "NOT_ASSERTED"
      },
      {
        title: "Amendment in the Operational Guidelines of National Livestock Mission (NLM)",
        sourceUrl: "https://dahd.gov.in/sites/default/files/2023-07/AmendmentintheOperationalGuidelinesofNLMreg.pdf",
        documentStatus: "VERIFIED_INDEXED",
        relationshipStatus: "VERIFIED"
      }
    ]
  },
  {
    schemeSlug: "pmfby",
    schemeName: "Pradhan Mantri Fasal Bima Yojana operational guidelines",
    status: "SOURCE_CANDIDATES_ONLY",
    sourceArchiveUrl: "https://pmfby.gov.in/guidelines",
    notes: "The official archive lists operational-guideline revisions. Documents remain unavailable to answers until byte hashing, extraction, and relationship review complete.",
    documents: [
      {
        title: "2023 Operational Guidelines of Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        sourceUrl: "https://pmfby.amnex.co.in/pmfby/pdf/operational_guidelines_pmfby.pdf",
        documentStatus: "CANDIDATE_NOT_INGESTED",
        relationshipStatus: "NOT_ASSERTED"
      }
    ]
  },
  {
    schemeSlug: "enam",
    schemeName: "National Agriculture Market (e-NAM)",
    status: "SOURCE_CANDIDATES_ONLY",
    sourceArchiveUrl: "https://agriwelfare.gov.in/sites/default/files/Revised_eNAM_guidelines_Oct2023.pdf",
    notes: "The official revised operational guideline is a candidate source only; it has no asserted predecessor or current-applicability result in DHRUV AI yet.",
    documents: [
      {
        title: "Revised e-NAM operational guidelines (October 2023)",
        sourceUrl: "https://agriwelfare.gov.in/sites/default/files/Revised_eNAM_guidelines_Oct2023.pdf",
        documentStatus: "CANDIDATE_NOT_INGESTED",
        relationshipStatus: "NOT_ASSERTED"
      }
    ]
  }
];

// server/dhruv/answering.ts
import { and, eq as eq3 } from "drizzle-orm";

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var DEFAULT_LLM_BASE_URL = "https://openrouter.ai/api/v1";
var resolveBaseUrl = () => {
  if (ENV.llmBaseUrl && ENV.llmBaseUrl.trim().length > 0) {
    return { base: ENV.llmBaseUrl.replace(/\/$/, ""), legacyForge: false };
  }
  if (ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0) {
    return { base: ENV.forgeApiUrl.replace(/\/$/, ""), legacyForge: true };
  }
  return { base: DEFAULT_LLM_BASE_URL, legacyForge: false };
};
var resolveApiKey = () => ENV.llmApiKey || ENV.forgeApiKey;
var resolveApiUrl = () => {
  const { base, legacyForge } = resolveBaseUrl();
  return legacyForge ? `${base}/v1/chat/completions` : `${base}/chat/completions`;
};
var assertApiKey = () => {
  if (!resolveApiKey()) {
    throw new Error(
      "LLM_API_KEY is not configured. Set LLM_API_KEY (and optionally LLM_BASE_URL / LLM_MODEL) for an OpenAI-compatible provider such as OpenRouter."
    );
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens ?? ENV.llmMaxTokens;
  if (typeof resolvedMaxTokens === "number" && resolvedMaxTokens > 0) {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${resolveApiKey()}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var EMBEDDING_BATCH_SIZE = 50;
async function createEmbeddings(inputs) {
  if (inputs.length === 0) return [];
  if (!resolveApiKey()) return null;
  const { base, legacyForge } = resolveBaseUrl();
  const url = legacyForge ? `${base}/v1/embeddings` : `${base}/embeddings`;
  const vectors = [];
  try {
    for (let start = 0; start < inputs.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = inputs.slice(start, start + EMBEDDING_BATCH_SIZE);
      const response = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${resolveApiKey()}`
        },
        body: JSON.stringify({ model: ENV.embeddingModel, input: batch })
      });
      if (!response.ok) {
        console.warn(
          `Embeddings request failed: ${response.status} ${response.statusText}`
        );
        return null;
      }
      const payload = await response.json();
      const ordered = [...payload.data].sort((a, b) => a.index - b.index);
      if (ordered.length !== batch.length || ordered.some((item) => !Array.isArray(item.embedding))) {
        console.warn("Embeddings response malformed; skipping vectors");
        return null;
      }
      vectors.push(...ordered.map((item) => item.embedding));
    }
  } catch (error) {
    console.warn("Embeddings request errored; skipping vectors", error);
    return null;
  }
  return vectors;
}

// server/dhruv/normalization.ts
function normalizeText(value) {
  return value.normalize("NFKC").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();
}
function normalizeDocumentNumber(value) {
  if (!value) return null;
  const normalized = value.toUpperCase().replace(/[‐‑–—]/g, "-").replace(/[^A-Z0-9/().-]+/g, "").trim();
  return normalized || null;
}
function normalizeDateReference(value) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return null;
  const [, day, month, rawYear] = match;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// server/dhruv/retrieval.ts
function tokenize(value) {
  return normalizeText(value).split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}
function cosineSimilarity(left, right) {
  if (!left || !right || left.length === 0 || left.length !== right.length)
    return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index2 = 0; index2 < left.length; index2 += 1) {
    dot += left[index2] * right[index2];
    leftMagnitude += left[index2] ** 2;
    rightMagnitude += right[index2] ** 2;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}
function lexicalScore(query, content) {
  const terms = tokenize(query);
  if (terms.length === 0) return 0;
  const contentTokens = tokenize(content);
  if (contentTokens.length === 0) return 0;
  const frequency = /* @__PURE__ */ new Map();
  for (const token of contentTokens)
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  const total = terms.reduce(
    (sum, term) => sum + Math.min(frequency.get(term) ?? 0, 3),
    0
  );
  return total / (terms.length * 3);
}
function lineageAdjustment(status, official) {
  if (status === "HISTORICAL") return -1;
  if (status === "CURRENT_VERIFIED") return official ? 0.3 : 0.1;
  if (status === "AMBIGUOUS") return -0.1;
  return official ? 0.05 : -0.05;
}
function rankCandidates(query, queryEmbedding, candidates, querySemanticTerms = []) {
  return candidates.map((candidate) => {
    const candidateLexicalScore = lexicalScore(query, candidate.content);
    const candidateSemanticScore = Math.max(
      semanticOverlap(querySemanticTerms, candidate.semanticTerms ?? []),
      0,
      cosineSimilarity(queryEmbedding, candidate.embedding)
    );
    return {
      ...candidate,
      lexicalScore: candidateLexicalScore,
      semanticScore: candidateSemanticScore,
      finalScore: 0.55 * candidateLexicalScore + 0.45 * candidateSemanticScore + lineageAdjustment(candidate.lineageStatus, candidate.official)
    };
  }).filter((candidate) => candidate.lineageStatus !== "HISTORICAL").sort((left, right) => right.finalScore - left.finalScore);
}
function semanticOverlap(left, right) {
  if (left.length === 0 || right.length === 0) return 0;
  const leftSet = new Set(left.map(normalizeText));
  const rightSet = new Set(right.map(normalizeText));
  let shared = 0;
  leftSet.forEach((term) => {
    if (rightSet.has(term)) shared += 1;
  });
  return shared / Math.max(leftSet.size, rightSet.size);
}

// server/dhruv/evidenceValidation.ts
function validateEvidenceQuote(input) {
  const normalizedEvidence = normalizeText(input.evidenceText);
  const normalizedSource = normalizeText(input.sourceText);
  if (!normalizedEvidence) {
    return {
      valid: false,
      normalizedEvidence,
      reason: "Evidence quote is empty"
    };
  }
  if (input.pageStart < 1 || input.pageEnd < input.pageStart) {
    return {
      valid: false,
      normalizedEvidence,
      reason: "Evidence page range is invalid"
    };
  }
  if (!normalizedSource.includes(normalizedEvidence)) {
    return {
      valid: false,
      normalizedEvidence,
      reason: "Evidence quote does not occur in the indexed source text"
    };
  }
  return { valid: true, normalizedEvidence, reason: null };
}

// server/dhruv/citationValidation.ts
function validateCitation(candidate) {
  try {
    const url = new URL(candidate.sourceUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return {
        valid: false,
        reason: "Citation source URL must use HTTP or HTTPS"
      };
    }
  } catch {
    return { valid: false, reason: "Citation source URL is invalid" };
  }
  const evidence = validateEvidenceQuote({
    sourceText: candidate.sourceText,
    evidenceText: candidate.quote,
    pageStart: candidate.pageStart,
    pageEnd: candidate.pageEnd
  });
  return { valid: evidence.valid, reason: evidence.reason };
}

// server/dhruv/semantic.ts
function parseProfile(content) {
  if (typeof content !== "string") return null;
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.terms) || !parsed.terms.every((term) => typeof term === "string")) {
      return null;
    }
    return {
      terms: Array.from(
        new Set(parsed.terms.map((term) => normalizeText(term)).filter(Boolean))
      ).slice(0, 16)
    };
  } catch {
    return null;
  }
}
async function createSemanticProfile(text2) {
  const normalized = normalizeText(text2).slice(0, 6e3);
  if (!normalized) return { terms: [] };
  try {
    const response = await invokeLLM({
      model: ENV.llmModel,
      messages: [
        {
          role: "system",
          content: "Extract up to 16 concise semantic concepts from the supplied policy text. Return only concepts grounded in the text; do not infer missing facts."
        },
        { role: "user", content: normalized }
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
            additionalProperties: false
          }
        }
      }
    });
    return parseProfile(response.choices[0]?.message.content) ?? { terms: [] };
  } catch {
    return { terms: [] };
  }
}

// server/dhruv/answering.ts
function abstain(reason) {
  return {
    answer: "I cannot verify an answer from DHRUV AI\u2019s indexed official-source corpus yet.",
    verificationState: "UNVERIFIED",
    caution: reason,
    citations: []
  };
}
function readModelJson(content) {
  if (typeof content !== "string") return null;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed.answer !== "string" || !Array.isArray(parsed.citedEvidenceIds) || !parsed.citedEvidenceIds.every((id) => typeof id === "number") || parsed.caution !== null && typeof parsed.caution !== "string") {
      return null;
    }
    return {
      answer: parsed.answer,
      citedEvidenceIds: parsed.citedEvidenceIds,
      caution: parsed.caution
    };
  } catch {
    return null;
  }
}
async function answerFromEvidence(question, snippets) {
  const validSnippets = snippets.filter(
    (snippet) => snippet.isOfficial && validateCitation(snippet).valid
  );
  if (validSnippets.length === 0) {
    return abstain(
      "No indexed official evidence with a validated source span matches this question."
    );
  }
  const evidenceBlock = validSnippets.map(
    (snippet) => [
      `EVIDENCE_ID: ${snippet.evidenceId}`,
      `TITLE: ${snippet.title}`,
      `SOURCE: ${snippet.sourceUrl}`,
      `PAGES: ${snippet.pageStart}-${snippet.pageEnd}`,
      `LINEAGE_STATUS: ${snippet.lineageStatus}`,
      `TEXT: ${snippet.sourceText}`
    ].join("\n")
  ).join("\n\n---\n\n");
  let response;
  try {
    response = await invokeLLM({
      model: ENV.llmModel,
      messages: [
        {
          role: "system",
          content: "You are DHRUV AI, an evidence-first Indian policy research assistant. Answer only from the evidence packets provided. Never invent a fact, document relationship, page, source, citation, hypothetical rule, alternative answer, or next step. If the evidence does not answer the question, say so briefly and cite no evidence IDs. Do not claim a document is current unless its packet says CURRENT_VERIFIED. Cite evidence IDs only when the answer is supported by that packet."
        },
        {
          role: "user",
          content: `QUESTION:
${question}

EVIDENCE PACKETS:
${evidenceBlock}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "grounded_dhruv_answer",
          strict: true,
          schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
              citedEvidenceIds: { type: "array", items: { type: "integer" } },
              caution: { type: ["string", "null"] }
            },
            required: ["answer", "citedEvidenceIds", "caution"],
            additionalProperties: false
          }
        }
      }
    });
  } catch {
    return abstain(
      "The answer generator is unavailable (LLM provider not configured or unreachable), so this question cannot be verified right now."
    );
  }
  const modelAnswer = readModelJson(response.choices[0]?.message.content);
  if (!modelAnswer)
    return abstain(
      "The answer generator did not return a valid structured response."
    );
  const byEvidenceId = new Map(
    validSnippets.map((snippet) => [snippet.evidenceId, snippet])
  );
  const citedSnippets = Array.from(new Set(modelAnswer.citedEvidenceIds)).map((id) => byEvidenceId.get(id)).filter((snippet) => Boolean(snippet));
  if (citedSnippets.length === 0) {
    return abstain(
      modelAnswer.caution ?? "No validated evidence packet was cited for this answer."
    );
  }
  const hasAmbiguity = citedSnippets.some(
    (snippet) => snippet.lineageStatus !== "CURRENT_VERIFIED"
  );
  return {
    answer: modelAnswer.answer,
    verificationState: hasAmbiguity ? "AMBIGUOUS" : "VERIFIED",
    caution: hasAmbiguity ? modelAnswer.caution ?? "The cited evidence does not establish a fully verified current-applicability status." : modelAnswer.caution,
    citations: citedSnippets.map((snippet) => ({
      title: snippet.title,
      sourceUrl: snippet.sourceUrl,
      pageStart: snippet.pageStart,
      pageEnd: snippet.pageEnd,
      quote: snippet.quote,
      lineageStatus: snippet.lineageStatus
    }))
  };
}
async function answerPolicyQuestion(input) {
  const db = await getDb();
  if (!db) return abstain("The policy corpus database is unavailable.");
  const rows = await db.select({
    chunkId: documentChunks.id,
    documentId: documents.id,
    content: documentChunks.content,
    embeddingJson: documentChunks.embeddingJson,
    pageStart: documentChunks.pageStart,
    pageEnd: documentChunks.pageEnd,
    title: documents.title,
    sourceUrl: documents.sourceUrl,
    isOfficial: documents.isOfficial,
    assertionStatus: lineageAssertions.status,
    schemeSlug: schemes.slug
  }).from(documentChunks).innerJoin(documents, eq3(documentChunks.documentId, documents.id)).innerJoin(schemes, eq3(documents.schemeId, schemes.id)).leftJoin(lineageAssertions, eq3(lineageAssertions.documentId, documents.id)).where(
    input.schemeSlug ? and(
      eq3(schemes.slug, input.schemeSlug),
      eq3(documents.processingState, "indexed")
    ) : eq3(documents.processingState, "indexed")
  ).limit(240);
  const queryProfile = await createSemanticProfile(input.question);
  const queryEmbeddings = await createEmbeddings([input.question]);
  const queryEmbedding = queryEmbeddings?.[0] ?? null;
  const candidates = rows.map((row) => ({
    documentId: row.documentId,
    content: row.content,
    embedding: typeof row.embeddingJson === "object" && row.embeddingJson !== null && Array.isArray(row.embeddingJson.embedding) ? row.embeddingJson.embedding.filter(
      (value) => typeof value === "number"
    ) : null,
    semanticTerms: typeof row.embeddingJson === "object" && row.embeddingJson !== null && Array.isArray(row.embeddingJson.terms) ? row.embeddingJson.terms.filter(
      (term) => typeof term === "string"
    ) : [],
    lineageStatus: row.assertionStatus ?? "UNVERIFIED",
    official: row.isOfficial
  }));
  const ranked = rankCandidates(
    input.question,
    queryEmbedding,
    candidates,
    queryProfile.terms
  ).slice(0, 6);
  const byChunkId = new Map(rows.map((row) => [row.chunkId, row]));
  const snippets = ranked.flatMap((candidate) => {
    const row = rows.find(
      (item) => item.documentId === candidate.documentId && item.content === candidate.content
    );
    if (!row || !byChunkId.has(row.chunkId)) return [];
    return [
      {
        evidenceId: row.chunkId,
        documentId: row.documentId,
        sourceUrl: row.sourceUrl,
        pageStart: row.pageStart,
        pageEnd: row.pageEnd,
        quote: row.content.slice(0, 500),
        sourceText: row.content,
        title: row.title,
        lineageStatus: candidate.lineageStatus,
        isOfficial: row.isOfficial
      }
    ];
  });
  return answerFromEvidence(input.question, snippets);
}

// server/dhruv/ingestion.ts
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import { and as and2, eq as eq4 } from "drizzle-orm";

// server/dhruv/relationshipRules.ts
var deterministicRules = [
  {
    relationshipType: "SUPERSEDES",
    pattern: /\b(?:supersedes|in supersession of)\b/i,
    confidence: 0.99,
    reason: "Explicit supersession language"
  },
  {
    relationshipType: "REVOKES",
    pattern: /\b(?:revokes|revoked|is hereby revoked)\b/i,
    confidence: 0.99,
    reason: "Explicit revocation language"
  },
  {
    relationshipType: "REPLACES",
    pattern: /\b(?:replaces|in substitution of)\b/i,
    confidence: 0.98,
    reason: "Explicit replacement language"
  },
  {
    relationshipType: "CORRIGES",
    pattern: /\b(?:corrigendum|corrigenda|corrects|correction to)\b/i,
    confidence: 0.98,
    reason: "Explicit correction language"
  },
  {
    relationshipType: "AMENDS",
    pattern: /\b(?:in partial modification of|partial modification of)\b/i,
    confidence: 0.97,
    scope: "partial modification",
    reason: "Explicit partial-modification language"
  },
  {
    relationshipType: "AMENDS",
    pattern: /\b(?:amendment\s+(?:in|to)\s+(?:the\s+)?(?:operational\s+)?guidelines|been amended|amended\s+(?:in|on|as of)|is amended|amends)\b/i,
    confidence: 0.97,
    reason: "Explicit amendment language"
  },
  {
    relationshipType: "EXTENDS",
    pattern: /\b(?:extends|extended until|extension of)\b/i,
    confidence: 0.96,
    reason: "Explicit extension language"
  },
  {
    relationshipType: "CONTINUES",
    pattern: /\b(?:shall continue|continues to remain in force|continued)\b/i,
    confidence: 0.94,
    reason: "Explicit continuation language"
  }
];
function detectDeterministicRelationship(evidenceText) {
  const normalized = normalizeText(evidenceText);
  if (!normalized) {
    return {
      state: "UNKNOWN",
      evidenceText,
      reason: "No evidence text was supplied"
    };
  }
  const rule = deterministicRules.find(
    (candidate) => candidate.pattern.test(evidenceText)
  );
  if (rule) {
    return {
      state: "MATCHED",
      relationshipType: rule.relationshipType,
      confidence: rule.confidence,
      scope: rule.scope ?? null,
      evidenceText,
      reason: rule.reason
    };
  }
  if (/\b(?:clarification|clarifies|interpretation of|with reference to)\b/i.test(
    evidenceText
  )) {
    return {
      state: "MATCHED",
      relationshipType: "REFERENCES",
      confidence: 0.9,
      scope: null,
      evidenceText,
      reason: "Explicit clarification or reference language"
    };
  }
  if (/\b(?:modification|change|revision)\b/i.test(evidenceText)) {
    return {
      state: "REQUIRES_HUMAN_REVIEW",
      evidenceText,
      reason: "Potential relationship language exists but does not classify the relationship deterministically"
    };
  }
  return {
    state: "UNKNOWN",
    evidenceText,
    reason: "No supported explicit relationship language was found"
  };
}

// server/dhruv/ingestion.ts
var MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
var MAX_PAGES = 80;
var FETCH_TIMEOUT_MS = 6e4;
function assertOfficialPdfUrl(sourceUrl) {
  const url = new URL(sourceUrl);
  const host = url.hostname.toLowerCase();
  const isOfficialDomain = host.endsWith(".gov.in") || host.endsWith(".nic.in");
  if (url.protocol !== "https:" || !isOfficialDomain) {
    throw new Error(
      "Only HTTPS documents hosted on official Indian government domains may be ingested"
    );
  }
  return url;
}
function assertPdfBytes(bytes) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error(
      "PDF is empty or exceeds the configured size limit"
    );
  }
  if (bytes.subarray(0, 4).toString() !== "%PDF")
    throw new Error("File does not have a PDF signature");
  return bytes;
}
async function downloadPdf(sourceUrl) {
  assertOfficialPdfUrl(sourceUrl);
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow",
    headers: {
      "user-agent": "DHRUV-AI official-source verifier/1.0",
      accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1"
    }
  });
  if (!response.ok)
    throw new Error(`Official source returned HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_DOCUMENT_BYTES)
    throw new Error("Official source PDF exceeds the configured size limit");
  if (!contentType.includes("pdf") && !sourceUrl.toLowerCase().includes(".pdf")) {
    throw new Error("Official source did not identify itself as a PDF");
  }
  return assertPdfBytes(Buffer.from(await response.arrayBuffer()));
}
async function readLocalPdfBytes(localBytesPath) {
  return assertPdfBytes(await readFile(localBytesPath));
}
function parsePdfDate(value) {
  if (typeof value !== "string") return null;
  const normalized = normalizeDateReference(value);
  if (normalized) return /* @__PURE__ */ new Date(`${normalized}T00:00:00.000Z`);
  const pdfDate = value.match(/^D:(\d{4})(\d{2})(\d{2})/);
  return pdfDate ? /* @__PURE__ */ new Date(`${pdfDate[1]}-${pdfDate[2]}-${pdfDate[3]}T00:00:00.000Z`) : null;
}
function extractDocumentMetadata(pages, info, parsedCreationDate) {
  const frontMatter = pages.slice(0, 2).map((page) => page.text).join("\n");
  const rawNumber = frontMatter.match(
    /(?:F\.?\s*No\.?|Order\s*No\.?|Notification\s*No\.?|No\.?)\s*([A-Za-z0-9/(). -]{3,80}?)(?=\s+(?:dated|date)\b|\n|$)/i
  )?.[1];
  const rawDate = frontMatter.match(
    /(?:dated|date)\s*[:.-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i
  )?.[1];
  const normalizedDate = normalizeDateReference(rawDate);
  return {
    pdfTitle: typeof info.Title === "string" ? info.Title.trim() || null : null,
    creator: typeof info.Creator === "string" ? info.Creator.trim() || null : null,
    creationDate: parsedCreationDate?.toISOString() ?? (typeof info.CreationDate === "string" ? info.CreationDate : null),
    documentNumber: normalizeDocumentNumber(rawNumber),
    issuedOn: normalizedDate ? /* @__PURE__ */ new Date(`${normalizedDate}T00:00:00.000Z`) : parsedCreationDate ?? parsePdfDate(info.CreationDate),
    pageCount: pages.length
  };
}
async function extractPageAwareText(pdfBytes) {
  const parser = new PDFParse({ data: pdfBytes });
  try {
    const info = await parser.getInfo({ parsePageInfo: true });
    const pageCount = Math.min(info.total, MAX_PAGES);
    const pages = [];
    for (let page = 1; page <= pageCount; page += 1) {
      const result = await parser.getText({ partial: [page] });
      const text2 = result.text.trim();
      if (text2) pages.push({ page, text: text2 });
    }
    if (pages.length === 0)
      throw new Error("No selectable text was extracted from the PDF");
    return {
      pages,
      metadata: extractDocumentMetadata(
        pages,
        info.info ?? {},
        info.getDateNode().CreationDate
      )
    };
  } finally {
    await parser.destroy();
  }
}
function createChunks(pages, maxLength = 1200, overlap = 180) {
  const chunks = [];
  for (const page of pages) {
    const text2 = page.text.replace(/\s+/g, " ").trim();
    for (let offset = 0; offset < text2.length; offset += maxLength - overlap) {
      const content = text2.slice(offset, offset + maxLength).trim();
      if (!content) continue;
      const lexicalTerms = Array.from(
        new Set(
          normalizeText(content).split(/[^a-z0-9]+/).filter((term) => term.length > 2)
        )
      ).slice(0, 160);
      chunks.push({
        content,
        pageStart: page.page,
        pageEnd: page.page,
        tokenCount: content.split(/\s+/).filter(Boolean).length,
        contentHash: createHash("sha256").update(content).digest("hex"),
        lexicalTerms
      });
      if (offset + maxLength >= text2.length) break;
    }
  }
  return chunks;
}
function extractReferenceCandidates(pages) {
  return pages.flatMap(
    (page) => page.text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(
      (sentence) => /\b(?:operational guidelines|amendment|clarification|corrigendum|supersedes|replaces|revokes|extends)\b/i.test(
        sentence
      )
    ).slice(0, 12).map((evidenceText) => ({
      evidenceText,
      pageStart: page.page,
      pageEnd: page.page,
      referencedNumber: evidenceText.match(/(?:No\.|Number)\s*([A-Za-z0-9/().-]+)/i)?.[1] ?? null
    }))
  );
}
function referenceResolution(evidenceText, hasRelatedDocument) {
  if (!hasRelatedDocument) return "unresolved";
  const detection = detectDeterministicRelationship(evidenceText);
  if (detection.state === "MATCHED") return "matched";
  return detection.state === "REQUIRES_HUMAN_REVIEW" ? "ambiguous" : "rejected";
}
function relationshipVerificationState(evidenceText, evidenceValid) {
  const detection = detectDeterministicRelationship(evidenceText);
  if (detection.state === "MATCHED" && evidenceValid) return "VERIFIED";
  if (detection.state === "REQUIRES_HUMAN_REVIEW") return "AMBIGUOUS";
  return "REJECTED";
}
async function ingestOfficialPdf(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const url = assertOfficialPdfUrl(input.sourceUrl);
  const scheme = await db.select().from(schemes).where(eq4(schemes.slug, input.schemeSlug)).limit(1);
  if (!scheme[0]) throw new Error(`Unknown scheme: ${input.schemeSlug}`);
  const runResult = await db.insert(ingestionRuns).values({
    sourceUrl: url.toString(),
    state: "processing",
    steps: [{ stage: "queued", at: (/* @__PURE__ */ new Date()).toISOString() }]
  });
  const runId = Number(runResult[0].insertId);
  try {
    const pdfBytes = input.localBytesPath ? await readLocalPdfBytes(input.localBytesPath) : await downloadPdf(url.toString());
    const documentHash = createHash("sha256").update(pdfBytes).digest("hex");
    const existing = await db.select().from(documents).where(eq4(documents.documentHash, documentHash)).limit(1);
    if (existing[0]) {
      await db.update(ingestionRuns).set({
        state: "completed",
        documentId: existing[0].id,
        completedAt: /* @__PURE__ */ new Date(),
        steps: [{ stage: "deduplicated", at: (/* @__PURE__ */ new Date()).toISOString() }]
      }).where(eq4(ingestionRuns.id, runId));
      return { document: existing[0], deduplicated: true };
    }
    const extracted = await extractPageAwareText(pdfBytes);
    const pageText = extracted.pages;
    const pdfObject = await storagePut(
      `dhruv-ai/documents/${scheme[0].slug}/${documentHash}.pdf`,
      pdfBytes,
      "application/pdf"
    );
    const textObject = await storagePut(
      `dhruv-ai/extracted-text/${scheme[0].slug}/${documentHash}.json`,
      JSON.stringify({ sourceUrl: url.toString(), pages: pageText }),
      "application/json"
    );
    const documentResult = await db.insert(documents).values({
      schemeId: scheme[0].id,
      title: input.title,
      issuingAuthority: input.issuingAuthority,
      documentType: input.documentType,
      documentNumber: extracted.metadata.documentNumber,
      issuedOn: input.issuedOn ?? extracted.metadata.issuedOn,
      sourceUrl: url.toString(),
      storageKey: pdfObject.key,
      extractedTextStorageKey: textObject.key,
      documentHash,
      pageCount: pageText.length,
      metadataJson: extracted.metadata,
      isOfficial: true,
      processingState: "indexed"
    });
    const documentId = Number(documentResult[0].insertId);
    const referenceCandidates = extractReferenceCandidates(pageText);
    if (referenceCandidates.length > 0) {
      await db.insert(documentReferences).values(
        referenceCandidates.map((reference) => ({
          sourceDocumentId: documentId,
          candidateDocumentId: input.relatedDocumentId ?? null,
          referencedNumber: reference.referencedNumber,
          evidenceText: reference.evidenceText,
          pageStart: reference.pageStart,
          pageEnd: reference.pageEnd,
          resolutionState: referenceResolution(
            reference.evidenceText,
            Boolean(input.relatedDocumentId)
          )
        }))
      );
    }
    if (input.relatedDocumentId) {
      const related = await db.select().from(documents).where(
        and2(
          eq4(documents.id, input.relatedDocumentId),
          eq4(documents.schemeId, scheme[0].id)
        )
      ).limit(1);
      if (!related[0]) {
        throw new Error(
          "The related document must belong to the same supported scheme"
        );
      }
      const relationshipCandidate = referenceCandidates.map((reference) => ({
        ...reference,
        detection: detectDeterministicRelationship(reference.evidenceText)
      })).find((candidate) => candidate.detection.state === "MATCHED");
      let persistedVerifiedRelationship = false;
      if (relationshipCandidate?.detection.state === "MATCHED") {
        const validation = validateEvidenceQuote({
          sourceText: pageText.find((page) => page.page === relationshipCandidate.pageStart)?.text ?? "",
          evidenceText: relationshipCandidate.evidenceText,
          pageStart: relationshipCandidate.pageStart,
          pageEnd: relationshipCandidate.pageEnd
        });
        if (validation.valid) {
          const relationshipResult = await db.insert(documentRelationships).values({
            sourceDocumentId: documentId,
            targetDocumentId: related[0].id,
            relationshipType: relationshipCandidate.detection.relationshipType,
            scope: relationshipCandidate.detection.scope,
            confidence: relationshipCandidate.detection.confidence,
            extractionMethod: "deterministic",
            verificationState: "VERIFIED"
          });
          await db.insert(relationshipEvidence).values({
            relationshipId: Number(relationshipResult[0].insertId),
            documentId,
            evidenceText: relationshipCandidate.evidenceText,
            normalizedEvidenceText: validation.normalizedEvidence,
            pageStart: relationshipCandidate.pageStart,
            pageEnd: relationshipCandidate.pageEnd
          });
          persistedVerifiedRelationship = true;
        }
      }
      if (!persistedVerifiedRelationship) {
        const candidate = relationshipCandidate ?? referenceCandidates[0];
        const verificationState = relationshipVerificationState(
          candidate?.evidenceText ?? "",
          false
        );
        await db.insert(documentRelationships).values({
          sourceDocumentId: documentId,
          targetDocumentId: related[0].id,
          relationshipType: "REFERENCES",
          scope: verificationState === "AMBIGUOUS" ? "Potential relationship requires human review" : "Candidate relationship rejected because evidence was absent or invalid",
          confidence: 0,
          extractionMethod: "deterministic",
          verificationState
        });
        if (verificationState === "AMBIGUOUS") {
          await db.insert(lineageAssertions).values({
            schemeId: scheme[0].id,
            documentId,
            status: "AMBIGUOUS",
            scope: "related-document relationship pending human review",
            confidence: 0,
            basis: {
              relatedDocumentId: related[0].id,
              evidenceText: candidate?.evidenceText ?? null
            }
          });
        }
      }
    }
    await db.insert(documentArtifacts).values([
      {
        documentId,
        artifactType: "original_pdf",
        storageKey: pdfObject.key,
        contentHash: documentHash,
        mimeType: "application/pdf"
      },
      {
        documentId,
        artifactType: "extracted_text",
        storageKey: textObject.key,
        contentHash: createHash("sha256").update(JSON.stringify(pageText)).digest("hex"),
        mimeType: "application/json"
      }
    ]);
    const chunks = createChunks(pageText);
    const semanticProfile = await createSemanticProfile(
      pageText.map((page) => page.text).join("\n").slice(0, 6e3)
    );
    const chunkEmbeddings = await createEmbeddings(
      chunks.map((chunk) => chunk.content)
    );
    if (chunks.length > 0) {
      await db.insert(documentChunks).values(
        chunks.map((chunk, chunkIndex) => {
          const embedding = chunkEmbeddings?.[chunkIndex];
          return {
            documentId,
            chunkIndex,
            ...chunk,
            embeddingJson: {
              terms: semanticProfile.terms,
              ...embedding ? { embedding } : {}
            },
            vectorDimensions: embedding ? embedding.length : semanticProfile.terms.length
          };
        })
      );
    }
    await db.update(ingestionRuns).set({
      documentId,
      state: "completed",
      completedAt: /* @__PURE__ */ new Date(),
      steps: [
        {
          stage: input.localBytesPath ? "bytes-from-local-cache" : "downloaded",
          at: (/* @__PURE__ */ new Date()).toISOString(),
          sha256: documentHash,
          ...input.byteSourceNote ? { byteSourceNote: input.byteSourceNote } : {}
        },
        {
          stage: "extracted",
          at: (/* @__PURE__ */ new Date()).toISOString(),
          pages: pageText.length,
          chunks: chunks.length
        },
        { stage: "indexed", at: (/* @__PURE__ */ new Date()).toISOString() }
      ]
    }).where(
      and2(eq4(ingestionRuns.id, runId), eq4(ingestionRuns.state, "processing"))
    );
    const inserted = await db.select().from(documents).where(eq4(documents.id, documentId)).limit(1);
    return { document: inserted[0], deduplicated: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion failure";
    await db.update(ingestionRuns).set({
      state: "failed",
      errorSummary: message,
      completedAt: /* @__PURE__ */ new Date(),
      steps: [{ stage: "failed", at: (/* @__PURE__ */ new Date()).toISOString(), message }]
    }).where(eq4(ingestionRuns.id, runId));
    throw error;
  }
}

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  project: router({
    info: publicProcedure.query(() => ({
      title: "MeraHaq AI"
    }))
  }),
  dhruv: router({
    catalog: publicProcedure.query(() => listSupportedPolicyDocuments()),
    curationManifest: publicProcedure.query(() => curatedChains),
    answer: publicProcedure.input(
      z2.object({
        question: z2.string().min(5).max(2e3),
        schemeSlug: z2.string().min(2).max(160).optional()
      })
    ).mutation(({ input }) => answerPolicyQuestion(input)),
    ingestOfficialPdf: protectedProcedure.input(
      z2.object({
        schemeSlug: z2.string().min(2).max(160),
        title: z2.string().min(4).max(1024),
        issuingAuthority: z2.string().min(4).max(512),
        documentType: z2.enum([
          "guideline",
          "amendment",
          "clarification",
          "corrigendum",
          "notification",
          "order",
          "other"
        ]),
        sourceUrl: z2.string().url().max(2048),
        issuedOn: z2.date().optional(),
        relatedDocumentId: z2.number().int().positive().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN" });
      }
      return ingestOfficialPdf(input);
    })
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
async function createApp(options = {}) {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (options.serveFrontend) {
    const { serveStatic: serveStatic2, setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite_stub(), vite_stub_exports));
    if (process.env.NODE_ENV === "development") {
      await setupVite2(app, server);
    } else {
      serveStatic2(app);
    }
  }
  return { app, server };
}

// server/_core/vercel-entry.ts
var builtApp;
async function handler(req, res) {
  builtApp ??= createApp({ serveFrontend: false });
  const { app } = await builtApp;
  return app(req, res);
}
export {
  handler as default
};
