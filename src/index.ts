#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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
  printDoctorSummary,
} from "./ui.js";
import type { ScanResult, SecurityIssue } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
  .name("mcp-doctor")
  .description("Diagnose, secure, and benchmark your MCP servers")
  .version(pkg.version);

program
  .command("scan")
  .description("Scan and test all MCP server connections")
  .option("--json", "Output results as JSON")
  .action(async (opts) => {
    const servers = await discoverServers(opts.json);
    if (servers.length === 0) return;

    const results = await testAllServers(servers, opts.json, "Testing connections...", "Connection tests complete");

    if (opts.json) {
      console.log(JSON.stringify(results.map(formatScanResult), null, 2));
    } else {
      printScanResults(results);
    }
  });

program
  .command("security")
  .description("Check MCP configs for security issues")
  .option("--json", "Output results as JSON")
  .action(async (opts) => {
    const servers = await discoverServers(opts.json);
    if (servers.length === 0) return;

    if (!opts.json) {
      const secSpinner = ora("Running security checks...").start();
      var issues = checkSecurity(servers);
      secSpinner.succeed("Security scan complete");
      console.log();
      printSecurityIssues(issues);
    } else {
      const issues = checkSecurity(servers);
      console.log(JSON.stringify(issues.map(formatSecurityIssue), null, 2));
    }
  });

program
  .command("bench")
  .description("Benchmark MCP server response times")
  .option("--json", "Output results as JSON")
  .action(async (opts) => {
    const servers = await discoverServers(opts.json);
    if (servers.length === 0) return;

    const results = await testAllServers(servers, opts.json, "Benchmarking servers...", "Benchmark complete");

    if (opts.json) {
      const sorted = results
        .filter((r) => r.status === "ok" && r.latencyMs !== undefined)
        .sort((a, b) => (a.latencyMs ?? 0) - (b.latencyMs ?? 0));
      console.log(JSON.stringify(sorted.map(formatScanResult), null, 2));
    } else {
      printBenchResults(results);
    }
  });

program
  .command("doctor")
  .description("Run all checks: scan + security + bench")
  .option("--json", "Output results as JSON")
  .action(async (opts) => {
    const servers = await discoverServers(opts.json);
    if (servers.length === 0) return;

    // Run scan
    const results = await testAllServers(servers, opts.json, "Testing connections...", "Connection tests complete");

    // Run security
    let issues: SecurityIssue[];
    if (!opts.json) {
      const secSpinner = ora("Running security checks...").start();
      issues = checkSecurity(servers);
      secSpinner.succeed("Security scan complete");
      console.log();
    } else {
      issues = checkSecurity(servers);
    }

    if (opts.json) {
      console.log(JSON.stringify({
        scan: results.map(formatScanResult),
        security: issues.map(formatSecurityIssue),
        bench: results
          .filter((r) => r.status === "ok" && r.latencyMs !== undefined)
          .sort((a, b) => (a.latencyMs ?? 0) - (b.latencyMs ?? 0))
          .map(formatScanResult),
        summary: {
          servers: servers.length,
          healthy: results.filter((r) => r.status === "ok").length,
          securityIssues: issues.length,
          avgLatencyMs: Math.round(
            results.filter((r) => r.latencyMs).reduce((sum, r) => sum + (r.latencyMs ?? 0), 0) /
            (results.filter((r) => r.latencyMs).length || 1)
          ),
        },
      }, null, 2));
    } else {
      printScanResults(results);
      printSecurityIssues(issues);
      printBenchResults(results);
      printDoctorSummary(results, issues);
    }
  });

program
  .command("serve")
  .description("Run as an MCP server (stdio transport)")
  .action(async () => {
    await import("./server.js");
  });

// --- helpers ---

async function discoverServers(json: boolean) {
  if (!json) printHeader(pkg.version);

  const spinner = json ? null : ora("Discovering MCP servers...").start();
  const servers = await scanConfigs();
  if (spinner) {
    spinner.succeed(`Found ${servers.length} server(s)`);
    console.log();
  }

  if (servers.length === 0) {
    if (json) {
      console.log(JSON.stringify([]));
    } else {
      printServerList(servers);
    }
    return [];
  }

  if (!json) printServerList(servers);
  return servers;
}

async function testAllServers(
  servers: ReturnType<typeof scanConfigs> extends Promise<infer T> ? T : never,
  json: boolean,
  startMsg: string,
  doneMsg: string
): Promise<ScanResult[]> {
  const spinner = json ? null : ora(startMsg).start();
  const results: ScanResult[] = [];
  for (const server of servers) {
    if (spinner) spinner.text = `Testing ${server.name}...`;
    results.push(await testServer(server));
  }
  if (spinner) {
    spinner.succeed(doneMsg);
    console.log();
  }
  return results;
}

function formatScanResult(r: ScanResult) {
  return {
    name: r.server.name,
    source: r.server.source,
    status: r.status,
    latencyMs: r.latencyMs ?? null,
    tools: r.tools ?? null,
    error: r.error ?? null,
  };
}

function formatSecurityIssue(i: SecurityIssue) {
  return {
    server: i.server.name,
    source: i.server.source,
    severity: i.severity,
    message: i.message,
    detail: i.detail,
  };
}

// Auto-detect: if no args and stdin is piped, run as MCP server
if (process.argv.length <= 2 && !process.stdin.isTTY) {
  import("./server.js");
} else {
  program.parse();
}
