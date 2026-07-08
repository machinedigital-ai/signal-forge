#!/usr/bin/env node
const engine = require("./engine.js");

const tools = [
  {
    name: "scan_text",
    description: "Scan writing for Signal Forge tone, cliche, and structure issues.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" }
      },
      required: ["text"]
    }
  },
  {
    name: "humanize_text",
    description: "Rewrite text through a Signal Forge voice archetype.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        persona: { type: "string" }
      },
      required: ["text"]
    }
  }
];

function findPersona(name = "My Voice") {
  return engine.archetypes.find((persona) => persona.name.toLowerCase() === name.toLowerCase()) || engine.archetypes[0];
}

function textResult(value) {
  return { content: [{ type: "text", text: value }] };
}

async function handleRequest(message) {
  if (message.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "signal-forge", version: "0.1.0" }
      }
    };
  }

  if (message.method === "tools/list") {
    return { jsonrpc: "2.0", id: message.id, result: { tools } };
  }

  if (message.method === "tools/call") {
    const { name, arguments: args = {} } = message.params || {};
    if (name === "scan_text") {
      const flags = engine.scanText(args.text || "");
      return {
        jsonrpc: "2.0",
        id: message.id,
        result: textResult(JSON.stringify({ score: engine.scoreFlags(flags), flags }, null, 2))
      };
    }
    if (name === "humanize_text") {
      const persona = findPersona(args.persona);
      const rewrite = engine.fallbackRewrite(args.text || "", persona);
      return { jsonrpc: "2.0", id: message.id, result: textResult(rewrite) };
    }
  }

  return {
    jsonrpc: "2.0",
    id: message.id,
    error: { code: -32601, message: `Method not found: ${message.method}` }
  };
}

function encodeMessage(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
}

function createFramedParser(onMessage) {
  let buffer = Buffer.alloc(0);
  return (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd < 0) return;
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) throw new Error("Missing Content-Length header");
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      const bodyEnd = bodyStart + length;
      if (buffer.length < bodyEnd) return;
      onMessage(JSON.parse(buffer.slice(bodyStart, bodyEnd).toString("utf8")));
      buffer = buffer.slice(bodyEnd);
    }
  };
}

if (require.main === module) {
  const parse = createFramedParser(async (message) => {
    const response = await handleRequest(message);
    process.stdout.write(encodeMessage(response));
  });
  process.stdin.on("data", parse);
}

module.exports = { createFramedParser, encodeMessage, handleRequest, tools };
