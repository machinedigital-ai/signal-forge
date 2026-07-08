const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("./engine.js");
const cli = require("./humanize.js");

test("em dash is a hard ban", () => {
  const flags = engine.scanText("This sounds human — until the dash shows up.");
  const dash = flags.find((flag) => flag.ruleId === "em_dash");
  assert.equal(dash.hard, true);
  assert.equal(dash.weight, 100);
});

test("contrast mold is penalized but not hard banned", () => {
  const flags = engine.scanText("It's not about tools, it's about taste.");
  const contrast = flags.find((flag) => flag.ruleId === "not_about_about");
  assert.equal(contrast.hard, false);
  assert.equal(contrast.weight, 55);
});

test("full thought leadership archetype library exists", () => {
  assert.equal(engine.archetypes.length >= 10, true);
  assert.ok(engine.archetypes.find((persona) => persona.name === "My Voice"));
  assert.ok(engine.archetypes.find((persona) => persona.name === "The Operator"));
  const anarchist = engine.archetypes.find((persona) => persona.name === "The Anarchist");
  assert.ok(anarchist);
  assert.equal(anarchist.controls.pettiness, 5);
  assert.match(anarchist.description, /craft/);
});

test("sanitizeOutput removes model em dashes", () => {
  const clean = engine.sanitizeOutput("This is clear — but the dash is not allowed.");
  assert.equal(clean.includes("—"), false);
  assert.match(clean, /This is clear\. But/);
});

test("fallback rewrite removes em dashes", () => {
  const persona = engine.archetypes[0];
  const rewrite = engine.fallbackRewrite("AI is useful — but lazy writing is still lazy.", persona);
  assert.equal(rewrite.includes("—"), false);
});

test("preference pair is DPO-ready", () => {
  const persona = engine.archetypes[0];
  const pair = engine.createPreferencePair({
    original: "Draft",
    chosen: "Better draft",
    rejected: "Worse draft",
    persona,
    reason: "Clearer"
  });
  assert.equal(pair.prompt.includes("Draft"), true);
  assert.equal(pair.chosen, "Better draft");
  assert.equal(pair.rejected, "Worse draft");
  assert.equal(pair.persona, "My Voice");
});

test("pattern record stores observations", () => {
  const record = engine.createPatternRecord({
    sourceUrl: "https://example.com/post",
    platform: "blog",
    title: "A useful essay",
    hookType: "contrarian_reframe",
    thesisShape: "tradeoff_thesis",
    emotionalStance: "sharp_contrarian",
    proofMove: "mechanism",
    cadence: "mini_memo",
    labels: "hook, thesis",
    whyItWorks: "The hook creates tension and the proof arrives fast."
  });
  assert.equal(record.sourceUrl, "https://example.com/post");
  assert.equal(record.hookType, "contrarian_reframe");
  assert.equal(record.proofMove, "mechanism");
  assert.deepEqual(record.labels, ["hook", "thesis"]);
  assert.match(record.whyItWorks, /proof/);
});

test("toJsonl exports one JSON record per line", () => {
  const jsonl = engine.toJsonl([{ a: 1 }, { b: 2 }]);
  assert.equal(jsonl.split("\n").length, 2);
  assert.deepEqual(JSON.parse(jsonl.split("\n")[1]), { b: 2 });
});

test("voice packs normalize into personas", () => {
  const persona = engine.personaFromVoicePack({
    name: "Test Voice",
    positioning: "Clear pressure.",
    controls: { clarity: 5 },
    banned_phrases: ["leverage", "unlock"]
  });
  assert.equal(persona.name, "Test Voice");
  assert.equal(persona.description, "Clear pressure.");
  assert.equal(persona.banned, "leverage\nunlock");
  assert.equal(persona.controls.clarity, 5);
});

test("personas export as voice packs", () => {
  const pack = engine.exportPersonaPack({
    name: "Test Voice",
    description: "Specific and sharp.",
    banned: "leverage\nunlock",
    controls: { edge: 4 }
  });
  assert.deepEqual(pack.banned_phrases, ["leverage", "unlock"]);
  assert.equal(pack.hard_rules.includes("Never use em dashes."), true);
});

test("CLI args choose input persona model and voice path", () => {
  const args = cli.parseArgs(["draft.md", "--persona", "The Anarchist", "--model", "ministral-3:8b", "--voice", "voice.json"]);
  assert.deepEqual(args, {
    input: "draft.md",
    persona: "The Anarchist",
    model: "ministral-3:8b",
    voice: "voice.json"
  });
});

test("CLI finds personas case-insensitively", () => {
  assert.equal(cli.findPersona("the anarchist").name, "The Anarchist");
  assert.equal(cli.findPersona("missing").name, "My Voice");
});
