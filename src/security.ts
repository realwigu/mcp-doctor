// src/security.ts
import type { McpServer, SecurityIssue } from "./types.js";

const SECRET_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /password/i,
  /credential/i,
  /private[_-]?key/i,
  /auth/i,
];

const HARDCODED_SECRET_PATTERNS = [
  /^sk-[a-zA-Z0-9]{20,}/,       // OpenAI-style keys
  /^ghp_[a-zA-Z0-9]{36}/,       // GitHub PATs
  /^ghu_[a-zA-Z0-9]{36}/,       // GitHub user tokens
  /^xoxb-/,                      // Slack bot tokens
  /^xoxp-/,                      // Slack user tokens
  /^AKIA[0-9A-Z]{16}/,          // AWS access keys
  /^eyJ[a-zA-Z0-9_-]*\./,       // JWTs
];

export function checkSecurity(servers: McpServer[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const server of servers) {
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        const isSensitiveName = SECRET_PATTERNS.some((p) => p.test(key));

        if (isSensitiveName && value && !value.startsWith("${") && !value.startsWith("$")) {
          const isHardcoded = HARDCODED_SECRET_PATTERNS.some((p) => p.test(value));

          if (isHardcoded) {
            issues.push({
              server,
              severity: "high",
              message: `Hardcoded secret in env var "${key}"`,
              detail: `Value matches known API key pattern. Use environment variables or a secrets manager instead of hardcoding in config.`,
            });
          } else if (value.length > 10) {
            issues.push({
              server,
              severity: "medium",
              message: `Possible hardcoded secret in "${key}"`,
              detail: `Env var name suggests a secret and value appears hardcoded. Consider using $ENV_VAR references.`,
            });
          }
        }
      }
    }

    if (server.command) {
      if (server.command.includes("&&") || server.command.includes("|") || server.command.includes(";")) {
        issues.push({
          server,
          severity: "medium",
          message: "Command contains shell operators",
          detail: `Command "${server.command}" uses shell operators which could be a security risk.`,
        });
      }
    }

    if (server.type === "stdio" && server.command && (!server.args || server.args.length === 0)) {
      if (server.command === "npx" || server.command === "node") {
        issues.push({
          server,
          severity: "low",
          message: "Command has no arguments",
          detail: `"${server.command}" is called without arguments — likely misconfigured.`,
        });
      }
    }

    if (server.url && server.url.startsWith("http://")) {
      issues.push({
        server,
        severity: "high",
        message: "SSE server using unencrypted HTTP",
        detail: `URL "${server.url}" uses HTTP instead of HTTPS. Data is transmitted in plaintext.`,
      });
    }
  }

  return issues;
}
