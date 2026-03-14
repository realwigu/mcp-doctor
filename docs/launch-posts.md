# Launch Posts for mcp-doctor

---

## X (Twitter)

### Option A — Short & punchy

```
I built mcp-doctor — a CLI that finds every MCP server across your dev tools (Claude Code, Cursor, VS Code, Windsurf), tests connections, flags security issues, and benchmarks latency.

One command: npx mcp-doctor scan

Open source, zero config.

github.com/realwigu/mcp-doctor
```

### Option B — Problem-first

```
MCP servers are everywhere now but there's no easy way to:

→ See which ones you have across all your tools
→ Check if they're actually responding
→ Find hardcoded API keys in configs
→ Compare latency

So I built mcp-doctor.

npx mcp-doctor scan

github.com/realwigu/mcp-doctor
```

### Option C — Spicy take

```
You probably have MCP servers you forgot about, leaking API keys you didn't know were hardcoded.

mcp-doctor finds them all:

npx mcp-doctor scan      — test connections
npx mcp-doctor security  — find leaked secrets
npx mcp-doctor bench     — benchmark latency

github.com/realwigu/mcp-doctor
```

**Tips for X:**
- Post with the terminal screenshot (assets/screenshot-scan.svg or take a real screenshot)
- Best posting times: Tue-Thu 8-10am PST (US dev audience) or 9-11am CET (EU)
- Reply to your own tweet with the security scan screenshot
- Use hashtags sparingly: #MCP #OpenSource (skip #AI, too noisy)

---

## Reddit

### r/programming or r/webdev or r/node

**Title:** `mcp-doctor — CLI to diagnose, secure, and benchmark your MCP servers across Claude Code, Cursor, VS Code, and Windsurf`

**Body:**

```
Hey everyone,

I've been running a bunch of MCP servers across different tools and got tired of not knowing which ones were actually working, whether my configs had security issues, or why some felt slow.

So I built **mcp-doctor** — a zero-config CLI that:

- **Scans** all your MCP configs (Claude Code, Cursor, VS Code, Windsurf, Claude Desktop)
- **Tests** connections via the JSON-RPC initialize handshake
- **Flags** security issues (hardcoded API keys, exposed tokens, insecure HTTP)
- **Benchmarks** response latency per server

### Quick start

    npx mcp-doctor scan

No config needed — it auto-discovers servers from all known config file locations.

### What it catches

- Hardcoded secrets (OpenAI keys, GitHub PATs, AWS keys, JWTs, Slack tokens)
- Shell injection patterns in commands
- Unencrypted HTTP transports
- Misconfigured server entries

Repo: github.com/realwigu/mcp-doctor

MIT licensed, TypeScript, works on macOS/Linux/Windows. Feedback welcome!
```

**Tips for Reddit:**
- Don't lead with "I built" in the title — lead with the tool name and what it does
- Post on r/node, r/webdev, r/programming (pick 2, don't spam all 3 same day)
- Respond to every comment in the first 2 hours
- Post on a weekday morning (US time)

---

## Hacker News

**Title:** `Show HN: mcp-doctor – Diagnose, secure, and benchmark your MCP servers`

**Body:**

```
MCP (Model Context Protocol) servers are becoming standard across AI coding tools, but there's no unified way to manage or monitor them. I found myself with servers scattered across Claude Code, Cursor, VS Code, and Claude Desktop configs — some broken, some with hardcoded secrets.

mcp-doctor is a zero-config CLI that scans all your MCP configurations, tests server connections via the JSON-RPC handshake, flags security issues (hardcoded API keys, shell injection risks, unencrypted transports), and benchmarks latency.

Usage:

    npx mcp-doctor scan       # discover and test all servers
    npx mcp-doctor security   # audit for security issues
    npx mcp-doctor bench      # benchmark response times

It auto-discovers configs from Claude Code, Cursor, VS Code, Windsurf, and Claude Desktop. TypeScript, MIT licensed.

Repo: github.com/realwigu/mcp-doctor
```

**Tips for HN:**
- "Show HN:" prefix is required for project launches
- Keep the description factual and technical — HN hates marketing speak
- Best time: Weekday 8-9am EST
- Don't ask for upvotes, don't self-promote in comments
- Be ready to answer deep technical questions about the JSON-RPC implementation
- If it gets traction, people will ask about SSE support — acknowledge it's on the roadmap

---

## LinkedIn (bonus)

```
I shipped a new open-source tool this week: mcp-doctor

If you're using AI coding tools like Claude Code, Cursor, or VS Code with MCP servers, you might have:

• Servers that stopped responding and you didn't notice
• API keys hardcoded in config files
• No visibility into which servers are fast vs slow

mcp-doctor fixes this with three commands:

npx mcp-doctor scan      → test all connections
npx mcp-doctor security  → find security issues
npx mcp-doctor bench     → benchmark latency

Zero config. Works across all major AI dev tools.

Check it out: github.com/realwigu/mcp-doctor

#OpenSource #DeveloperTools
```

---

## Posting Strategy

1. **Day 1 (Tuesday or Wednesday):** Post on X + Hacker News in the morning (8-9am EST)
2. **Day 1 afternoon:** Post on Reddit r/node or r/webdev
3. **Day 2:** Post on LinkedIn
4. **Day 2:** Cross-post to Reddit (the other subreddit you didn't use on Day 1)

**Key:** Attach the terminal screenshot to every post. The visual of the colored table output is the hook.
