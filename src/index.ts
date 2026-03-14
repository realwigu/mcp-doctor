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
