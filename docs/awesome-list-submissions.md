# Awesome List Submissions for mcp-doctor

---

## 1. punkpeye/awesome-mcp-servers (82k stars)

**How:** Fork → Edit README.md → PR
**Section:** `### Security` (alphabetical order — "r" for realwigu)
**PR Title:** `Add mcp-doctor — MCP config scanner and security auditor`

**Entry to add (insert alphabetically under Security):**

```markdown
- [realwigu/mcp-doctor](https://github.com/realwigu/mcp-doctor) 📇 🏠 🍎 🪟 🐧 - CLI that auto-discovers MCP server configs across Claude Code, Cursor, VS Code, and Windsurf, tests connections via JSON-RPC handshake, flags hardcoded secrets and security issues, and benchmarks latency.
```

**PR description:**

```
## What does this add?

[mcp-doctor](https://github.com/realwigu/mcp-doctor) — a zero-config CLI for diagnosing MCP server configurations.

### What it does

- **Scans** all MCP configs across Claude Code, Cursor, VS Code, Windsurf, and Claude Desktop
- **Tests** server connections via JSON-RPC `initialize` handshake
- **Flags** security issues: hardcoded API keys, tokens in args, shell injection patterns, unencrypted HTTP
- **Benchmarks** response latency per server

### Quick start

```bash
npx @wigu/mcp-doctor scan
```

TypeScript, MIT licensed, works on macOS/Linux/Windows.

### Checklist

- [x] Entry placed alphabetically in the Security section
- [x] Follows existing format with correct icons
- [x] Links verified
- [x] Description is concise
```

---

## 2. appcypher/awesome-mcp-servers (5.2k stars)

**How:** Fork → Edit README.md → PR
**Section:** Security (add to bottom of section)
**PR Title:** `Add mcp-doctor to Security section`

**Entry to add (append to bottom of Security section):**

```markdown
- <img src="https://github.com/realwigu.png" height="14"/> [mcp-doctor](https://github.com/realwigu/mcp-doctor) - A CLI tool that auto-discovers MCP server configs across Claude Code, Cursor, VS Code, and Windsurf, tests connections, flags hardcoded secrets, and benchmarks latency.
```

**PR description:**

```
Adds [mcp-doctor](https://github.com/realwigu/mcp-doctor) to the Security section.

It's a zero-config CLI that scans MCP configurations across multiple dev tools, tests server health via JSON-RPC handshake, detects hardcoded API keys and security issues, and measures response times.

- TypeScript, MIT licensed
- Works on macOS, Linux, Windows
- `npx @wigu/mcp-doctor scan` to try it
```

---

## 3. jqueryscript/awesome-claude-code

**How:** Fork → Edit README.md → PR
**Section:** Tools & Utilities
**PR Title:** `Add mcp-doctor to Tools & Utilities`

**Entry to add:**

```markdown
- [**mcp-doctor**](https://github.com/realwigu/mcp-doctor) - Zero-config CLI that scans MCP server configs across Claude Code, Cursor, VS Code, and Windsurf. Tests connections, flags hardcoded secrets, and benchmarks latency.
```

**PR description:**

```
Adds mcp-doctor to Tools & Utilities.

It auto-discovers MCP server configurations across multiple dev tools and runs diagnostics:
- Connection testing via JSON-RPC handshake
- Security audit for hardcoded API keys, tokens, shell injection patterns
- Latency benchmarking

Useful for anyone running multiple MCP servers across Claude Code and other tools.

`npx @wigu/mcp-doctor scan`
```

---

## 4. mcpservers.org/submit (wong2, 3.6k stars)

**How:** Fill out web form at https://mcpservers.org/submit
**Fields:**

- **Server Name:** mcp-doctor
- **Short Description:** Zero-config CLI that auto-discovers MCP server configs across Claude Code, Cursor, VS Code, and Windsurf. Tests connections via JSON-RPC, flags hardcoded secrets and security issues, and benchmarks latency.
- **Link:** https://github.com/realwigu/mcp-doctor
- **Category:** Development
- **Contact Email:** (your email)

---

## 5. MCP Server Registry (modelcontextprotocol, 80k stars)

**How:** Publish to https://registry.modelcontextprotocol.io
**Docs:** Check their quickstart for submission process — likely involves adding metadata to package.json or a registry config file.

---

## Submission Order

1. **punkpeye/awesome-mcp-servers** — biggest audience, do first
2. **appcypher/awesome-mcp-servers** — easy win, do same day
3. **jqueryscript/awesome-claude-code** — Claude-specific audience
4. **mcpservers.org/submit** — fill out form, takes 2 minutes
5. **MCP Server Registry** — check submission process
