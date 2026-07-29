# VPS Ollama Runbook

## Goal

Run a small text model on a persistent VPS so the Vercel-hosted Studio and remote MCP clients can request rewrites without requiring a local Ollama install.

## Recommended Starting Profile

The Hostinger KVM 4 tier is generally suitable for a small CPU-only model service. Start with one model:

- `llama3.2:3b` for better instruction following and rewriting quality.
- `qwen2.5:1.5b` only when lower memory use and latency matter more than writing quality.

Run one inference at a time initially. CPU inference is useful for interactive revisions, but it is not a substitute for the remote 4090 for high-volume or high-quality work.

## Security Model

1. Ollama listens only on `127.0.0.1:11434`.
2. A small proxy service is exposed over HTTPS on a dedicated subdomain.
3. The proxy validates a server-to-server secret from the Vercel API route.
4. The proxy accepts a narrow rewrite payload and forwards it to local Ollama.
5. Rate limits and request-size limits protect the VPS.

Never expose Ollama's port `11434` publicly.

## Operational Checklist

- Install Ollama as a system service.
- Pull the chosen model and verify a local generation works.
- Configure a firewall that permits only HTTPS and SSH.
- Put Caddy or Nginx in front of the proxy for TLS.
- Store the VPS endpoint and shared secret only as Vercel environment variables.
- Set a request timeout that accommodates CPU inference.
- Add health and model-status endpoints that reveal no secrets.
- Monitor CPU, RAM, disk, request latency, and errors before increasing concurrency.

## Future Implementation Scope

The next implementation should add:

- `api/rewrite.js` in the Vercel project.
- A small VPS proxy process with bearer-token validation.
- A Studio model-provider selector: Local Ollama, Signal Forge VPS, or local fallback.
- A checked-in `.env.example`, never a real secret file.

## Recovery

If VPS Ollama is unavailable, Studio and the CLI should show the error plainly and use the existing deterministic fallback only when the user has allowed fallback behavior.
