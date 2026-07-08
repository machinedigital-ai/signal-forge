# Signal Forge

Signal Forge rewrites generic AI copy into clearer, more human thought leadership. It scans for AI tells, applies a voice archetype, critiques the rewrite, and saves preference pairs for later training.

## Run The App

```bash
npm start
```

Open `http://localhost:4173`.

## Run Tests

```bash
npm test
```

## CLI

```bash
node humanize.js draft.txt
node humanize.js draft.txt --persona "The Anarchist"
```

Use Ollama explicitly:

```bash
node humanize.js draft.txt --persona "The Anarchist" --model ministral-3:8b
```

The output is always sanitized to remove em dashes.

## MCP Server

Run the stdio MCP server:

```bash
npm run mcp
```

Tools:

- `scan_text`: returns Signal Forge score and flags.
- `humanize_text`: rewrites text through a persona and removes em dashes.

## What Exists

- `index.html`: local web app.
- `engine.js`: scanner, archetypes, critic, fallback rewrite, dataset helpers.
- `humanize.js`: local CLI wrapper.
- `mcp-server.js`: dependency-free stdio MCP server.
- `engine.test.js`: Node tests.
- `voices/archetypes/the-anarchist/`: first full voice pack with `soul.md`, `voice.json`, examples, and judge notes.

Default voice:

- `My Voice`: owner baseline for accepted/rejected rewrite learning.

## What Is Intentionally Not Built Yet

- Scrapers.
- Account system.
- Backend database.
- GPU training.

Those come after the Pattern Lab and preference-pair loop prove the writing quality improves.
