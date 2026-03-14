export interface McpServer {
  name: string;
  source: string;       // e.g. "Claude Code (~/.claude.json)"
  configPath: string;   // full path to the config file
  type: "stdio" | "sse" | "unknown";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface ScanResult {
  server: McpServer;
  status: "ok" | "error" | "timeout";
  latencyMs?: number;
  tools?: number;
  error?: string;
}

export interface SecurityIssue {
  server: McpServer;
  severity: "high" | "medium" | "low";
  message: string;
  detail: string;
}
