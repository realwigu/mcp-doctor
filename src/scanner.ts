import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import type { McpServer } from "./types.js";

interface ConfigSource {
  name: string;
  path: string;
  key: string; // JSON key that holds server map
}

function getConfigSources(): ConfigSource[] {
  const home = homedir();
  return [
    { name: "Claude Code (project)", path: resolve(".mcp.json"), key: "mcpServers" },
    { name: "Claude Code (user)", path: join(home, ".claude.json"), key: "mcpServers" },
    { name: "Cursor (user)", path: join(home, ".cursor", "mcp.json"), key: "mcpServers" },
    { name: "Cursor (project)", path: resolve(".cursor", "mcp.json"), key: "mcpServers" },
    { name: "VS Code (user)", path: join(home, ".vscode", "mcp.json"), key: "servers" },
    { name: "Windsurf", path: join(home, ".codeium", "windsurf", "mcp_config.json"), key: "mcpServers" },
    { name: "Claude Desktop", path: join(home, "AppData", "Roaming", "Claude", "claude_desktop_config.json"), key: "mcpServers" },
  ];
}

export async function scanConfigs(): Promise<McpServer[]> {
  const sources = getConfigSources();
  const servers: McpServer[] = [];

  for (const source of sources) {
    if (!existsSync(source.path)) continue;

    try {
      const raw = await readFile(source.path, "utf-8");
      const json = JSON.parse(raw);
      const serverMap = json[source.key];

      if (!serverMap || typeof serverMap !== "object") continue;

      for (const [name, config] of Object.entries(serverMap)) {
        const cfg = config as Record<string, unknown>;
        const server: McpServer = {
          name,
          source: source.name,
          configPath: source.path,
          type: cfg.command ? "stdio" : cfg.url ? "sse" : "unknown",
          command: cfg.command as string | undefined,
          args: cfg.args as string[] | undefined,
          url: cfg.url as string | undefined,
          env: cfg.env as Record<string, string> | undefined,
        };
        servers.push(server);
      }
    } catch {
      // Skip unparseable configs
    }
  }

  return servers;
}
