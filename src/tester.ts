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
