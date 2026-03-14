# mcp-doctor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a CLI tool (`npx mcp-doctor`) that scans, diagnoses, and benchmarks MCP server configurations across Claude Code, Cursor, Windsurf, and VS Code.

**Architecture:** Single TypeScript package with commander.js CLI, three core modules (scanner, security, bench), and a terminal UI layer using chalk + cli-table3. Stdio-based MCP servers are tested by spawning the process and performing the JSON-RPC initialize handshake.

**Tech Stack:** TypeScript, commander.js, chalk, cli-table3, ora (spinner), node:child_process

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`

**Step 1: Initialize package.json**

```json
{
  "name": "mcp-doctor",
  "version": "0.1.0",
  "description": "Diagnose, secure, and benchmark your MCP servers",
  "type": "module",
  "bin": {
    "mcp-doctor": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "keywords": ["mcp", "model-context-protocol", "cli", "diagnostics", "claude", "cursor"],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 3: Install dependencies**

Run: `npm install commander chalk cli-table3 ora`
Run: `npm install -D typescript @types/node`

**Step 4: Create minimal CLI entry point**

```typescript
// src/index.ts
#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

program
  .name("mcp-doctor")
  .description("Diagnose, secure, and benchmark your MCP servers")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan and test all MCP server connections")
  .action(async () => {
    console.log(chalk.cyan("🔍 Scanning MCP servers...\n"));
  });

program
  .command("security")
  .description("Check MCP configs for security issues")
  .action(async () => {
    console.log(chalk.cyan("🔒 Running security scan...\n"));
  });

program
  .command("bench")
  .description("Benchmark MCP server response times")
  .action(async () => {
    console.log(chalk.cyan("⚡ Benchmarking MCP servers...\n"));
  });

program.parse();
```

**Step 5: Build and test**

Run: `npm run build && node dist/index.js --help`
Expected: Help output with scan, security, bench commands listed.

**Step 6: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold mcp-doctor CLI with commander"
```

---

### Task 2: MCP Config Scanner

**Files:**
- Create: `src/scanner.ts`
- Create: `src/types.ts`

**Step 1: Define types**

```typescript
// src/types.ts
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
```

**Step 2: Build scanner module**

```typescript
// src/scanner.ts
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
    // Claude Code — project-local
    { name: "Claude Code (project)", path: resolve(".mcp.json"), key: "mcpServers" },
    // Claude Code — user-level
    { name: "Claude Code (user)", path: join(home, ".claude.json"), key: "mcpServers" },
    // Cursor
    { name: "Cursor (user)", path: join(home, ".cursor", "mcp.json"), key: "mcpServers" },
    // Cursor project-local
    { name: "Cursor (project)", path: resolve(".cursor", "mcp.json"), key: "mcpServers" },
    // VS Code
    { name: "VS Code (user)", path: join(home, ".vscode", "mcp.json"), key: "servers" },
    // Windsurf
    { name: "Windsurf", path: join(home, ".codeium", "windsurf", "mcp_config.json"), key: "mcpServers" },
    // Claude Desktop
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
```

**Step 3: Build and verify**

Run: `npm run build`
Expected: Compiles without errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add MCP config scanner with multi-tool support"
```

---

### Task 3: Connection Tester

**Files:**
- Create: `src/tester.ts`

**Step 1: Build connection tester**

```typescript
// src/tester.ts
import { spawn } from "node:child_process";
import type { McpServer, ScanResult } from "./types.js";

const TIMEOUT_MS = 10_000;

function createJsonRpcRequest(method: string, id: number, params?: Record<string, unknown>): string {
  const msg = JSON.stringify({
    jsonrpc: "2.0",
    id,
    method,
    params: params ?? {},
  });
  return `Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`;
}

function parseJsonRpcResponse(data: string): unknown | null {
  // Try to find JSON in the data (skip Content-Length header if present)
  const jsonMatch = data.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export async function testServer(server: McpServer): Promise<ScanResult> {
  if (server.type === "sse" || server.type === "unknown") {
    return { server, status: "error", error: `Unsupported transport: ${server.type}` };
  }

  if (!server.command) {
    return { server, status: "error", error: "No command specified" };
  }

  return new Promise((resolve) => {
    const start = performance.now();
    let settled = false;
    let stdout = "";

    const env = { ...process.env, ...server.env };
    const child = spawn(server.command!, server.args ?? [], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        resolve({ server, status: "timeout", error: `No response within ${TIMEOUT_MS}ms` });
      }
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      const response = parseJsonRpcResponse(stdout) as Record<string, unknown> | null;
      if (response && response.result) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          const latencyMs = Math.round(performance.now() - start);

          // Send initialized notification then tools/list
          child.stdin.write(
            createJsonRpcRequest("notifications/initialized", 0)
          );
          child.stdin.write(
            createJsonRpcRequest("tools/list", 2)
          );

          // Give it a moment to respond with tools
          let toolsData = "";
          const toolsTimer = setTimeout(() => {
            child.kill();
            resolve({ server, status: "ok", latencyMs, tools: undefined });
          }, 3000);

          child.stdout.on("data", (toolChunk: Buffer) => {
            toolsData += toolChunk.toString();
            const toolsResponse = parseJsonRpcResponse(toolsData) as Record<string, unknown> | null;
            if (toolsResponse && toolsResponse.result) {
              clearTimeout(toolsTimer);
              child.kill();
              const result = toolsResponse.result as { tools?: unknown[] };
              resolve({
                server,
                status: "ok",
                latencyMs,
                tools: result.tools?.length,
              });
            }
          });
        }
      }
    });

    child.on("error", (err: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ server, status: "error", error: err.message });
      }
    });

    child.on("exit", (code: number | null) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ server, status: "error", error: `Process exited with code ${code}` });
      }
    });

    // Send initialize request
    const initRequest = createJsonRpcRequest("initialize", 1, {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "mcp-doctor", version: "0.1.0" },
    });
    child.stdin.write(initRequest);
  });
}
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add MCP server connection tester via JSON-RPC handshake"
```

---

### Task 4: Security Scanner

**Files:**
- Create: `src/security.ts`

**Step 1: Build security scanner**

```typescript
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
    // Check for secrets in env vars
    if (server.env) {
      for (const [key, value] of Object.entries(server.env)) {
        // Check if env var name suggests it's a secret
        const isSensitiveName = SECRET_PATTERNS.some((p) => p.test(key));

        if (isSensitiveName && value && !value.startsWith("${") && !value.startsWith("$")) {
          // Check if the value looks hardcoded (not a reference)
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

    // Check for command injection risks
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

    // Check for servers running with no args (could be misconfigured)
    if (server.type === "stdio" && server.command && (!server.args || server.args.length === 0)) {
      // Only flag for npx/node commands where args are expected
      if (server.command === "npx" || server.command === "node") {
        issues.push({
          server,
          severity: "low",
          message: "Command has no arguments",
          detail: `"${server.command}" is called without arguments — likely misconfigured.`,
        });
      }
    }

    // Check for HTTP (non-HTTPS) SSE servers
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
```

**Step 2: Build and verify**

Run: `npm run build`
Expected: Compiles without errors.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add security scanner for MCP configs"
```

---

### Task 5: Terminal UI & Wire Up Commands

**Files:**
- Create: `src/ui.ts`
- Modify: `src/index.ts`

**Step 1: Build UI module**

```typescript
// src/ui.ts
import chalk from "chalk";
import Table from "cli-table3";
import type { McpServer, ScanResult, SecurityIssue } from "./types.js";

export function printServerList(servers: McpServer[]): void {
  if (servers.length === 0) {
    console.log(chalk.yellow("  No MCP servers found in any configuration.\n"));
    console.log(chalk.dim("  Checked: ~/.claude.json, .mcp.json, ~/.cursor/mcp.json,"));
    console.log(chalk.dim("           VS Code, Windsurf, Claude Desktop\n"));
    return;
  }

  const table = new Table({
    head: [
      chalk.white("Server"),
      chalk.white("Source"),
      chalk.white("Type"),
      chalk.white("Command / URL"),
    ],
    style: { head: [], border: ["dim"] },
  });

  for (const s of servers) {
    table.push([
      chalk.cyan(s.name),
      chalk.dim(s.source),
      s.type,
      chalk.dim(s.command ? `${s.command} ${(s.args ?? []).join(" ")}` : s.url ?? "—"),
    ]);
  }

  console.log(table.toString());
  console.log();
}

export function printScanResults(results: ScanResult[]): void {
  const table = new Table({
    head: [
      chalk.white("Server"),
      chalk.white("Status"),
      chalk.white("Latency"),
      chalk.white("Tools"),
      chalk.white("Details"),
    ],
    style: { head: [], border: ["dim"] },
  });

  for (const r of results) {
    const status =
      r.status === "ok"
        ? chalk.green("✓ OK")
        : r.status === "timeout"
          ? chalk.yellow("⏱ Timeout")
          : chalk.red("✗ Error");

    const latency = r.latencyMs ? `${r.latencyMs}ms` : "—";
    const tools = r.tools !== undefined ? String(r.tools) : "—";
    const detail = r.error ? chalk.dim(r.error.slice(0, 50)) : "";

    table.push([chalk.cyan(r.server.name), status, latency, tools, detail]);
  }

  console.log(table.toString());

  const ok = results.filter((r) => r.status === "ok").length;
  const total = results.length;
  console.log(
    `\n  ${chalk.green(`${ok}/${total}`)} servers responding\n`
  );
}

export function printSecurityIssues(issues: SecurityIssue[]): void {
  if (issues.length === 0) {
    console.log(chalk.green("  ✓ No security issues found.\n"));
    return;
  }

  const table = new Table({
    head: [
      chalk.white("Severity"),
      chalk.white("Server"),
      chalk.white("Issue"),
    ],
    style: { head: [], border: ["dim"] },
    colWidths: [12, 20, 60],
    wordWrap: true,
  });

  for (const issue of issues) {
    const sev =
      issue.severity === "high"
        ? chalk.red("HIGH")
        : issue.severity === "medium"
          ? chalk.yellow("MEDIUM")
          : chalk.dim("LOW");

    table.push([sev, chalk.cyan(issue.server.name), `${issue.message}\n${chalk.dim(issue.detail)}`]);
  }

  console.log(table.toString());
  console.log(
    `\n  Found ${chalk.yellow(String(issues.length))} issue(s)\n`
  );
}

export function printBenchResults(results: ScanResult[]): void {
  const sorted = results
    .filter((r) => r.status === "ok" && r.latencyMs !== undefined)
    .sort((a, b) => (a.latencyMs ?? 0) - (b.latencyMs ?? 0));

  if (sorted.length === 0) {
    console.log(chalk.yellow("  No servers responded for benchmarking.\n"));
    return;
  }

  const table = new Table({
    head: [
      chalk.white("#"),
      chalk.white("Server"),
      chalk.white("Latency"),
      chalk.white("Rating"),
    ],
    style: { head: [], border: ["dim"] },
  });

  sorted.forEach((r, i) => {
    const ms = r.latencyMs!;
    const rating =
      ms < 500
        ? chalk.green("⚡ Fast")
        : ms < 2000
          ? chalk.yellow("⏳ OK")
          : chalk.red("🐌 Slow");

    table.push([String(i + 1), chalk.cyan(r.server.name), `${ms}ms`, rating]);
  });

  console.log(table.toString());
  console.log();
}

export function printHeader(): void {
  console.log();
  console.log(chalk.bold.cyan("  ┌─────────────────────────┐"));
  console.log(chalk.bold.cyan("  │     mcp-doctor v0.1     │"));
  console.log(chalk.bold.cyan("  │  MCP Server Diagnostics  │"));
  console.log(chalk.bold.cyan("  └─────────────────────────┘"));
  console.log();
}
```

**Step 2: Wire up index.ts with all modules**

Replace `src/index.ts` entirely:

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import { scanConfigs } from "./scanner.js";
import { testServer } from "./tester.js";
import { checkSecurity } from "./security.js";
import {
  printHeader,
  printServerList,
  printScanResults,
  printSecurityIssues,
  printBenchResults,
} from "./ui.js";

const program = new Command();

program
  .name("mcp-doctor")
  .description("Diagnose, secure, and benchmark your MCP servers")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan and test all MCP server connections")
  .action(async () => {
    printHeader();

    const spinner = ora("Discovering MCP servers...").start();
    const servers = await scanConfigs();
    spinner.succeed(`Found ${servers.length} server(s)`);
    console.log();

    printServerList(servers);

    if (servers.length === 0) return;

    const testSpinner = ora("Testing connections...").start();
    const results = [];
    for (const server of servers) {
      testSpinner.text = `Testing ${server.name}...`;
      results.push(await testServer(server));
    }
    testSpinner.succeed("Connection tests complete");
    console.log();

    printScanResults(results);
  });

program
  .command("security")
  .description("Check MCP configs for security issues")
  .action(async () => {
    printHeader();

    const spinner = ora("Discovering MCP servers...").start();
    const servers = await scanConfigs();
    spinner.succeed(`Found ${servers.length} server(s)`);
    console.log();

    if (servers.length === 0) {
      printServerList(servers);
      return;
    }

    const secSpinner = ora("Running security checks...").start();
    const issues = checkSecurity(servers);
    secSpinner.succeed("Security scan complete");
    console.log();

    printSecurityIssues(issues);
  });

program
  .command("bench")
  .description("Benchmark MCP server response times")
  .action(async () => {
    printHeader();

    const spinner = ora("Discovering MCP servers...").start();
    const servers = await scanConfigs();
    spinner.succeed(`Found ${servers.length} server(s)`);
    console.log();

    if (servers.length === 0) {
      printServerList(servers);
      return;
    }

    const benchSpinner = ora("Benchmarking servers...").start();
    const results = [];
    for (const server of servers) {
      benchSpinner.text = `Benchmarking ${server.name}...`;
      results.push(await testServer(server));
    }
    benchSpinner.succeed("Benchmark complete");
    console.log();

    printBenchResults(results);
  });

program.parse();
```

**Step 3: Build and test**

Run: `npm run build && node dist/index.js scan`
Expected: Header displays, scans for servers, shows results table.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire up terminal UI and all CLI commands"
```

---

### Task 6: README & Polish

**Files:**
- Create: `README.md`
- Create: `.gitignore`

**Step 1: Create .gitignore**

```
node_modules/
dist/
*.tgz
```

**Step 2: Create README.md**

Write a punchy README with:
- One-liner description
- GIF/screenshot placeholder
- Quick start: `npx mcp-doctor scan`
- Three commands explained with example output
- Supported tools table (Claude Code, Cursor, VS Code, Windsurf, Claude Desktop)
- Contributing section
- MIT license badge

The README should be concise, scannable, and have a professional open-source feel. Include emoji sparingly for visual structure.

**Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README and .gitignore"
```

---

### Task 7: Test End-to-End & Publish Prep

**Step 1: Run full scan**

Run: `npm run build && node dist/index.js scan`
Run: `node dist/index.js security`
Run: `node dist/index.js bench`

Verify all three commands work and produce clean output.

**Step 2: Test npx compatibility**

Run: `npm pack` to create tarball, then `npx ./mcp-doctor-0.1.0.tgz scan`

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: prepare v0.1.0 for publish"
```
