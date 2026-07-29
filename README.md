# Signal Forge

Signal Forge is a writing-constitution layer for AI-assisted work. It catches generic AI patterns, applies a deliberate voice, and gives a human or an agent a clear revision path before publishing.

It is not an AI-detector bypass product. The job is stronger writing: clear claims, real stakes, distinct taste, and language that sounds like someone who means it.

## Product Shape

Signal Forge has two surfaces built on one engine:

- **Studio**: the browser workspace for drafting, scanning, revising, creating personas, and saving writing-pattern observations.
- **Runtime**: the CLI and MCP server an agent can call before it sends a post, comment, email, memo, or landing-page draft into the world.

Each voice is a writing constitution. It defines beliefs, emotional range, rhetorical habits, banned language, and a judge rubric, not merely an adjective like "bold" or "friendly."

## What Works Today

- Deterministic scan for cliches, overused structures, and hard style bans.
- Hard ban on em dashes in generated output.
- Built-in thought-leadership archetypes, including **The Anarchist**.
- A persistent `My Voice` baseline and saved accept/reject preference pairs.
- Persona import and export as JSON voice packs.
- Pattern Lab for recording why public writing worked, without storing copied work by default.
- Browser fallback rewrite when Ollama is unavailable.
- Local Ollama integration in Studio, plus a dependency-free CLI and stdio MCP server.

## Quick Start

Requirements: Node.js 18+ and Python 3. Ollama is optional because the app has a local fallback.

```bash
npm start
```

Open `http://127.0.0.1:4173`. Do not open `index.html` directly with `file://`, because browsers block local Ollama calls from file pages.

Run tests:

```bash
npm test
```

## Ollama

Start Ollama locally, pull a model, then launch the app. Studio discovers models from `http://127.0.0.1:11434` and `http://localhost:11434`.

```bash
ollama pull llama3.2:3b
ollama serve
```

`llama3.2:3b` is a good small starting point for rewriting. The active model is selected in the Studio header.

## CLI

```bash
node humanize.js draft.txt
node humanize.js draft.txt --persona "The Anarchist"
node humanize.js draft.txt --persona "The Anarchist" --model llama3.2:3b
```

CLI output is sanitized to remove em dashes.

## MCP Runtime

Start the stdio MCP server:

```bash
npm run mcp
```

Available tools:

- `scan_text`: returns a Signal Forge score and flagged patterns.
- `humanize_text`: rewrites text through a persona and removes hard-banned punctuation.

## Voice Packs

The first complete pack is at [`voices/archetypes/the-anarchist/`](voices/archetypes/the-anarchist/):

- `soul.md`: worldview, taste, and emotional rules.
- `voice.json`: executable prompt controls and bans.
- `examples.md`: before-and-after examples.
- `judge.md`: criteria for good and bad output.

`My Voice` uses the same conceptual model, but develops from a user's saved examples and preference pairs.

## Deployment

The current public Studio deployment is [signal-forge-kohl.vercel.app](https://signal-forge-kohl.vercel.app).

Vercel serves the static Studio. It does not run Ollama. The intended public runtime is documented in [the VPS Ollama guide](docs/operations/vps-ollama.md): Vercel Studio calls an authenticated VPS proxy, which calls Ollama on the VPS over localhost.

## Project Map

| Path | Purpose |
| --- | --- |
| `index.html` | Dependency-free browser Studio. |
| `engine.js` | Scanner, voice archetypes, prompt builder, critic, and data helpers. |
| `engine.test.js` | Node test suite for the engine and interfaces. |
| `humanize.js` | CLI wrapper. |
| `mcp-server.js` | Dependency-free stdio MCP runtime. |
| `voices/` | Human-readable and executable voice packs. |
| `docs/architecture/` | Product and runtime architecture decisions. |
| `docs/operations/` | Deployment and operational runbooks. |
| `docs/superpowers/` | Original product spec and MVP implementation plan. |

## Next Iteration

1. Add a secure Vercel-to-VPS rewrite proxy for CPU Ollama.
2. Add versioned `My Voice` packs and richer user-owned source examples.
3. Add an MCP configuration guide and a promptable agent policy format.
4. Build an evaluation set that measures clarity, specificity, voice fit, and preservation of meaning.

## Safety and Product Boundaries

Signal Forge should help a person or agent communicate with greater clarity and authorship. It should not promise to evade AI detection systems, fabricate evidence, or imitate a living person's voice without permission.

## License

License selection is intentionally deferred until the distribution model is decided.
