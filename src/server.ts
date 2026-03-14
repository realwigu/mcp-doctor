// src/server.ts — MCP Server mode for mcp-doctor
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { scanConfigs } from "./scanner.js";
import { testServer } from "./tester.js";
import { checkSecurity } from "./security.js";
import type { McpServer as McpServerConfig, ScanResult, SecurityIssue } from "./types.js";

const server = new McpServer({
  name: "mcp-doctor",
  version: "0.3.0",
});

server.tool(
  "scan",
  "Discover all MCP server configs and test their connections via JSON-RPC handshake",
  {},
  async () => {
    const servers = await scanConfigs();
    if (servers.length === 0) {
      return {
        content: [{ type: "text", text: "No MCP servers found in any configuration." }],
      };
    }

    const results: ScanResult[] = [];
    for (const s of servers) {
      results.push(await testServer(s));
    }

    const lines = results.map((r) => {
      const status = r.status === "ok" ? "OK" : r.status === "timeout" ? "TIMEOUT" : "ERROR";
      const latency = r.latencyMs ? `${r.latencyMs}ms` : "—";
      const tools = r.tools !== undefined ? `${r.tools} tools` : "—";
      const detail = r.error ?? "";
      return `${r.server.name} (${r.server.source}) — ${status} | ${latency} | ${tools} ${detail}`.trim();
    });

    const ok = results.filter((r) => r.status === "ok").length;
    const summary = `\n${ok}/${results.length} servers responding`;

    return {
      content: [{ type: "text", text: lines.join("\n") + summary }],
    };
  }
);

server.tool(
  "security",
  "Audit all MCP server configs for security issues like hardcoded secrets, tokens in args, and shell injection patterns",
  {},
  async () => {
    const servers = await scanConfigs();
    if (servers.length === 0) {
      return {
        content: [{ type: "text", text: "No MCP servers found in any configuration." }],
      };
    }

    const issues = checkSecurity(servers);
    if (issues.length === 0) {
      return {
        content: [{ type: "text", text: `Scanned ${servers.length} server(s). No security issues found.` }],
      };
    }

    const lines = issues.map((i) => {
      return `[${i.severity.toUpperCase()}] ${i.server.name}: ${i.message} — ${i.detail}`;
    });

    return {
      content: [{ type: "text", text: `Found ${issues.length} issue(s):\n\n${lines.join("\n")}` }],
    };
  }
);

server.tool(
  "bench",
  "Benchmark response latency for all configured MCP servers",
  {},
  async () => {
    const servers = await scanConfigs();
    if (servers.length === 0) {
      return {
        content: [{ type: "text", text: "No MCP servers found in any configuration." }],
      };
    }

    const results: ScanResult[] = [];
    for (const s of servers) {
      results.push(await testServer(s));
    }

    const responding = results
      .filter((r) => r.status === "ok" && r.latencyMs !== undefined)
      .sort((a, b) => (a.latencyMs ?? 0) - (b.latencyMs ?? 0));

    if (responding.length === 0) {
      return {
        content: [{ type: "text", text: "No servers responded for benchmarking." }],
      };
    }

    const lines = responding.map((r, i) => {
      const ms = r.latencyMs!;
      const rating = ms < 500 ? "Fast" : ms < 2000 ? "OK" : "Slow";
      return `${i + 1}. ${r.server.name} — ${ms}ms (${rating})`;
    });

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
);

server.tool(
  "doctor",
  "Run all checks at once: scan connections, audit security, and benchmark latency for all configured MCP servers",
  {},
  async () => {
    const servers = await scanConfigs();
    if (servers.length === 0) {
      return {
        content: [{ type: "text", text: "No MCP servers found in any configuration." }],
      };
    }

    const results: ScanResult[] = [];
    for (const s of servers) {
      results.push(await testServer(s));
    }

    const issues = checkSecurity(servers);

    const ok = results.filter((r) => r.status === "ok").length;
    const responding = results.filter((r) => r.latencyMs !== undefined);
    const avgLatency = responding.length
      ? Math.round(responding.reduce((sum, r) => sum + (r.latencyMs ?? 0), 0) / responding.length)
      : 0;

    const scanLines = results.map((r) => {
      const status = r.status === "ok" ? "OK" : r.status === "timeout" ? "TIMEOUT" : "ERROR";
      const latency = r.latencyMs ? `${r.latencyMs}ms` : "—";
      const tools = r.tools !== undefined ? `${r.tools} tools` : "—";
      return `${r.server.name} (${r.server.source}) — ${status} | ${latency} | ${tools}`;
    });

    const secLines = issues.length === 0
      ? ["No security issues found."]
      : issues.map((i) => `[${i.severity.toUpperCase()}] ${i.server.name}: ${i.message}`);

    const benchLines = responding.length === 0
      ? ["No servers responded for benchmarking."]
      : responding
          .sort((a, b) => (a.latencyMs ?? 0) - (b.latencyMs ?? 0))
          .map((r, i) => {
            const ms = r.latencyMs!;
            const rating = ms < 500 ? "Fast" : ms < 2000 ? "OK" : "Slow";
            return `${i + 1}. ${r.server.name} — ${ms}ms (${rating})`;
          });

    const summary = [
      `\n--- Summary ---`,
      `Servers: ${results.length} found, ${ok} healthy`,
      `Security: ${issues.length} issue(s)`,
      responding.length > 0 ? `Avg latency: ${avgLatency}ms` : null,
      ok === results.length && issues.length === 0
        ? "All clear — your MCP setup looks healthy."
        : `Needs attention: ${[ok < results.length ? `${results.length - ok} server(s) down` : null, issues.length > 0 ? `${issues.length} security issue(s)` : null].filter(Boolean).join(", ")}`,
    ].filter(Boolean);

    const output = [
      "=== Scan ===",
      ...scanLines,
      "",
      "=== Security ===",
      ...secLines,
      "",
      "=== Benchmark ===",
      ...benchLines,
      ...summary,
    ].join("\n");

    return {
      content: [{ type: "text", text: output }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("mcp-doctor server error:", err);
  process.exit(1);
});
