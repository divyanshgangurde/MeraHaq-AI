import { describe, expect, it } from "vitest";
import { parseDbUrl } from "./dbUrl";

describe("parseDbUrl", () => {
  it("parses a plain local URL", () => {
    const cfg = parseDbUrl("mysql://merahaq:merahaq-local@127.0.0.1:3306/merahaq");
    expect(cfg.host).toBe("127.0.0.1");
    expect(cfg.port).toBe(3306);
    expect(cfg.user).toBe("merahaq");
    expect(cfg.password).toBe("merahaq-local");
    expect(cfg.database).toBe("merahaq");
    expect(cfg.ssl).toBeUndefined();
  });

  it("parses a TiDB URL with a JSON ssl query", () => {
    const cfg = parseDbUrl(
      'mysql://u.root:pw@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/merahaq?ssl={"minVersion":"TLSv1.2","rejectUnauthorized":true}'
    );
    expect(cfg.host).toBe("gateway01.ap-southeast-1.prod.aws.tidbcloud.com");
    expect(cfg.port).toBe(4000);
    expect(cfg.database).toBe("merahaq");
    expect(cfg.ssl).toEqual({ minVersion: "TLSv1.2", rejectUnauthorized: true });
  });

  it("survives URL-special characters in the password", () => {
    const cfg = parseDbUrl("mysql://root:p@ss#word/with?chars@db.internal:3307/app");
    expect(cfg.user).toBe("root");
    expect(cfg.password).toBe("p@ss#word/with?chars");
    expect(cfg.host).toBe("db.internal");
    expect(cfg.port).toBe(3307);
    expect(cfg.database).toBe("app");
  });

  it("strips surrounding quotes copied from a .env file", () => {
    const cfg = parseDbUrl("'mysql://root:pw@db.internal:4000/app'");
    expect(cfg.host).toBe("db.internal");
    expect(cfg.port).toBe(4000);
    expect(cfg.database).toBe("app");
  });

  it("defaults the port to 3306", () => {
    const cfg = parseDbUrl("mysql://root:pw@localhost/app");
    expect(cfg.port).toBe(3306);
  });
});
