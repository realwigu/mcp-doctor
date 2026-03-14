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

export function printHeader(version?: string): void {
  const ver = version ?? "0.0.0";
  const title = `mcp-doctor v${ver}`;
  const subtitle = "MCP Server Diagnostics";
  const width = Math.max(title.length, subtitle.length) + 6;
  const pad = (s: string) => {
    const left = Math.floor((width - s.length) / 2);
    const right = width - s.length - left;
    return " ".repeat(left) + s + " ".repeat(right);
  };
  const border = "─".repeat(width);

  console.log();
  console.log(chalk.bold.cyan(`  ┌${border}┐`));
  console.log(chalk.bold.cyan(`  │${pad(title)}│`));
  console.log(chalk.bold.cyan(`  │${pad(subtitle)}│`));
  console.log(chalk.bold.cyan(`  └${border}┘`));
  console.log();
}
