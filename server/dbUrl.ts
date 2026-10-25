import type { ConnectionOptions } from "mysql2";

/**
 * Tolerant parser for DATABASE_URL.
 *
 * drizzle-orm's mysql2 driver internally runs `new URL(connectionString)`,
 * which throws ERR_INVALID_URL for valid TiDB/MySQL URLs whose password
 * contains URL-special characters, and for the raw JSON `ssl` query
 * parameter TiDB Cloud suggests. Parse the string manually and hand
 * drizzle a connection-config object instead, so no URL grammar is
 * involved at all.
 *
 * Splitting order is deliberate: userinfo ends at the LAST "@" and the
 * query is only looked for after it, so a password may contain
 * "@", ":", "/", "?" or "#" without breaking the parse.
 */
export function parseDbUrl(raw: string): ConnectionOptions {
  // Tolerate surrounding quotes: connection strings copied out of .env
  // files often carry them, and a stray leading quote makes every
  // downstream URL parser fail.
  const unquoted = raw.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
  const noScheme = unquoted.replace(/^mysql2?:\/\//, "");

  const atIdx = noScheme.lastIndexOf("@");
  const userinfo = atIdx >= 0 ? noScheme.slice(0, atIdx) : "";
  const rest = atIdx >= 0 ? noScheme.slice(atIdx + 1) : noScheme;

  // Password starts after the FIRST ":" so it may itself contain ":".
  const colonIdx = userinfo.indexOf(":");
  const user = colonIdx >= 0 ? userinfo.slice(0, colonIdx) : userinfo;
  const password = colonIdx >= 0 ? userinfo.slice(colonIdx + 1) : "";

  const slashIdx = rest.indexOf("/");
  const hostport = slashIdx >= 0 ? rest.slice(0, slashIdx) : rest;
  const tail = slashIdx >= 0 ? rest.slice(slashIdx + 1) : "";
  const qIdx = tail.indexOf("?");
  const database = qIdx >= 0 ? tail.slice(0, qIdx) : tail;
  const query = qIdx >= 0 ? tail.slice(qIdx + 1) : "";

  const portIdx = hostport.lastIndexOf(":");
  const host = portIdx >= 0 ? hostport.slice(0, portIdx) : hostport;
  const port =
    portIdx >= 0 ? Number(hostport.slice(portIdx + 1)) || 3306 : 3306;

  const config: ConnectionOptions = {
    host,
    port,
    user: safeDecode(user),
    password: safeDecode(password),
    database: safeDecode(database),
  };

  const sslRaw = new URLSearchParams(query).get("ssl");
  if (sslRaw) {
    try {
      config.ssl = JSON.parse(sslRaw);
    } catch {
      config.ssl = sslRaw;
    }
  }
  return config;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
