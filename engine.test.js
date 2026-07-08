const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("./engine.js");

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

test("The Anarchist archetype exists", () => {
  const anarchist = engine.archetypes.find((persona) => persona.name === "The Anarchist");
  assert.ok(anarchist);
  assert.equal(anarchist.controls.pettiness, 5);
  assert.match(anarchist.description, /craft/);
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
  assert.equal(pair.persona, "Blunt Operator");
});
