# Signal Forge Runtime Architecture

## Purpose

Signal Forge sits between raw agent output and a public audience. It provides a repeatable writing constitution, then returns a rewrite and an explanation of what changed.

## Current Local Flow

```text
Studio, CLI, or MCP client
        |
        v
engine.js
  scanner + persona + judge
        |
        +--> local fallback rewrite
        |
        +--> local Ollama at 127.0.0.1:11434
```

The browser app can discover a local Ollama service only when served from HTTP. `file://` pages cannot call the local service reliably.

## Target Public Flow

```text
Vercel Studio or remote agent
        |
        v
Vercel API route
  validates request and rate limits
        |
        v
Authenticated HTTPS proxy on VPS
        |
        v
Ollama at 127.0.0.1:11434 on the VPS
```

Ollama remains private to the VPS. The browser must never receive VPS credentials or call port `11434` directly.

## Voice Resolution

1. Resolve `My Voice` baseline rules.
2. Resolve an optional archetype overlay.
3. Scan the draft for cliches, structures, and hard bans.
4. Build a rewrite instruction from the voice and scan report.
5. Generate through the configured model or local fallback.
6. Sanitize output and judge the rewrite.
7. Record user acceptance or rejection as a preference pair.

The engine is intentionally deterministic where possible. Its scanner runs in linear time relative to input length for the fixed rule set, `O(n)`.

## Boundaries

- No detector-evasion claims.
- No invented facts, metrics, or experience.
- No public raw Ollama endpoint.
- No unauthorised imitation of living writers.
- No training on public text by default. Pattern Lab stores observations first.
