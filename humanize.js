#!/usr/bin/env node
const fs = require("node:fs");
const engine = require("./engine.js");

function parseArgs(argv) {
  const args = { persona: "My Voice", model: "", input: "", voice: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--persona") {
      args.persona = argv[++i] || args.persona;
    } else if (value === "--model") {
      args.model = argv[++i] || "";
    } else if (value === "--voice") {
      args.voice = argv[++i] || "";
    } else if (!args.input) {
      args.input = value;
    }
  }
  return args;
}

function findPersona(name) {
  return engine.archetypes.find((persona) => persona.name.toLowerCase() === name.toLowerCase()) || engine.archetypes[0];
}

async function ollamaRewrite(text, persona, model, flags) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: engine.buildPrompt(text, persona, flags), stream: false })
  });
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  const data = await response.json();
  return data.response || "";
}

async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.input) {
    throw new Error("Usage: node humanize.js <file> [--persona \"The Anarchist\"] [--model ministral-3:8b]");
  }

  const text = fs.readFileSync(args.input, "utf8");
  const persona = args.voice
    ? engine.personaFromVoicePack(JSON.parse(fs.readFileSync(args.voice, "utf8")))
    : findPersona(args.persona);
  const flags = engine.scanText(text);
  let rewrite = "";

  if (args.model) {
    try {
      rewrite = await ollamaRewrite(text, persona, args.model, flags);
    } catch {
      rewrite = engine.fallbackRewrite(text, persona);
    }
  } else {
    rewrite = engine.fallbackRewrite(text, persona);
  }

  return engine.sanitizeOutput(rewrite);
}

if (require.main === module) {
  run()
    .then((output) => process.stdout.write(`${output}\n`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { findPersona, parseArgs, run };
