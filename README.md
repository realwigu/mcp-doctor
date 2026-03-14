[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node >= 18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/@wigu/mcp-doctor.svg)](https://www.npmjs.com/package/@wigu/mcp-doctor)

# mcp-doctor

**Diagnose, secure, and benchmark your MCP servers.**

A fast CLI that finds every MCP server configured across your dev tools, tests connections, flags security issues, and benchmarks latency — in seconds.



<p align="center">
  <img src="assets/screenshot-scan.svg" alt="mcp-doctor scan" width="820">
</p>

[![mcp-doctor MCP server](https://glama.ai/mcp/servers/realwigu/mcp-doctor/badges/card.svg)](https://glama.ai/mcp/servers/realwigu/mcp-doctor)

## Quick Start

```bash
npx @wigu/mcp-doctor scan
```

## Commands

### `scan` — Test all MCP server connections

Discovers configs and verifies each server responds to a JSON-RPC handshake.

```
$ mcp-doctor scan

  ┌─────────────────────────────────────────┐
  │           mcp-doctor v0.1.0             │
  │   Diagnose · Secure · Benchmark         │
  └─────────────────────────────────────────┘

  ✔ Found 3 server(s)

  ┌──────────────┬────────────┬─────────┐
  │ Server       │ Source     │ Status  │
  ├──────────────┼────────────┼─────────┤
  │ filesystem   │ Claude     │ ✔ OK    │
  │ postgres     │ Cursor     │ ✔ OK    │
  │ slack        │ VS Code    │ ✘ FAIL  │
  └──────────────┴────────────┴─────────┘
```

### `security` — Audit configs for security issues

Checks for leaked secrets, overly broad permissions, and risky command patterns.

```
$ mcp-doctor security

  ⚠  2 issues found

  ┌──────────┬──────────┬───────────────────────────────┐
  │ Severity │ Server   │ Issue                         │
  ├──────────┼──────────┼───────────────────────────────┤
  │ HIGH     │ postgres │ Plaintext password in config  │
  │ MEDIUM   │ slack    │ Token visible in args         │
  └──────────┴──────────┴───────────────────────────────┘
```

### `bench` — Benchmark server response times

Measures JSON-RPC round-trip latency for every configured server.

```
$ mcp-doctor bench

  ┌──────────────┬──────────┬────────┐
  │ Server       │ Latency  │ Rating │
  ├──────────────┼──────────┼────────┤
  │ filesystem   │ 12ms     │ fast   │
  │ postgres     │ 87ms     │ ok     │
  │ slack        │ timeout  │ —      │
  └──────────────┴──────────┴────────┘
```

## Supported Tools

| Tool            | Config Auto-Detected |
| --------------- | -------------------- |
| Claude Code     | Yes                  |
| Claude Desktop  | Yes                  |
| Cursor          | Yes                  |
| VS Code         | Yes                  |
| Windsurf        | Yes                  |

mcp-doctor reads each tool's config file from its standard location and merges all discovered servers into a single view.

## What It Checks

- **Connection health** — JSON-RPC `initialize` handshake against every server
- **Security issues** — plaintext secrets, tokens in args, dangerous commands
- **Latency benchmarks** — round-trip timing with fast / ok / slow ratings

## Install

```bash
# Run directly
npx @wigu/mcp-doctor scan

# Or install globally
npm install -g @wigu/mcp-doctor
mcp-doctor scan
```

Requires **Node.js 18+**.

## Contributing

Contributions are welcome! Open an issue or submit a pull request.

1. Fork the repo
2. Create a feature branch (`git checkout -b my-feature`)
3. Commit your changes
4. Open a PR

## License

[MIT](LICENSE)