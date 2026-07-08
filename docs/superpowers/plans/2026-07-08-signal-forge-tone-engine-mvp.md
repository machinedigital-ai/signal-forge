# Signal Forge Tone Engine MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest useful Signal Forge tone engine: better scanner rules, archetype controls including The Anarchist, critic scoring, preference-pair capture, and a tiny Pattern Lab reference store.

**Architecture:** Keep the app static and local. Extract reusable logic from `index.html` into `engine.js` so it can be tested with Node and reused later by CLI/MCP. Keep storage in `localStorage` and export JSON/JSONL files through native browser APIs.

**Tech Stack:** Plain HTML, CSS, browser JavaScript, Node built-in test runner, no new dependencies.

---

## File Structure

- Create `engine.js`: pure functions for scanner rules, archetypes, critic scoring, prompt building, fallback rewriting, pattern records, and preference pairs.
- Create `engine.test.js`: Node tests for hard bans, contrast mold penalties, archetype lookup, critic scoring, and DPO-ready preference pair shape.
- Modify `index.html`: load `engine.js`, replace duplicated inline logic with engine calls, add The Anarchist persona, show critic output, save accept/reject preference pairs, and add a compact Pattern Lab panel.

Skipped for this MVP:

- Scrapers.
- Database.
- Backend.
- MCP server.
- GPU training.
- Auth.
- Embeddings.

Add those only after the local preference loop proves it improves output quality.

## Task 1: Extract The Testable Engine

**Files:**
- Create: `engine.js`
- Create: `engine.test.js`
- Modify: `index.html`

- [ ] **Step 1: Create `engine.js` with pure functions**

Create `/Users/agencymachine/Documents/Yapp/engine.js`:

```js
(function (global) {
  const cliches = [
    ["in today's", 75], ["fast-paced", 90], ["digital landscape", 85], ["leverage", 70],
    ["stay ahead", 88], ["unlock", 78], ["game-changer", 95], ["cutting-edge", 86],
    ["transforming", 72], ["revolutionize", 84], ["seamless", 82], ["robust", 65],
    ["delve", 76], ["harnessing the power", 96], ["at the end of the day", 70],
    ["it's not about", 62], ["but here's the truth", 74], ["consider what happens", 66],
    ["the real danger", 58], ["optional luxuries", 52], ["with consequences", 50],
    ["fall behind", 55], ["shipping faster and cheaper", 58], ["wait for permission", 50],
    ["the world doesn't reward", 60], ["requires more than", 55], ["demands curiosity", 48],
    ["what's already here", 45], ["manual labor", 42], ["margin for error", 45],
    ["workflow", 48], ["automation", 44], ["optimize", 46], ["evolve", 43]
  ];

  const structuralRules = [
    {
      id: "em_dash",
      label: "Em dash",
      weight: 100,
      hard: true,
      regex: /[—]/g,
      note: "Hard ban. Replace with a period, comma, colon, or shorter sentence."
    },
    {
      id: "not_x_but_y",
      label: "Not X, but Y mold",
      weight: 45,
      hard: false,
      regex: /\b(?:not|isn't|is not|wasn't|was not)\b[^.!?\n]{1,100}\b(?:but|it's|it is)\b/gi,
      note: "Useful once when clear. Penalize repetition or generic nouns."
    },
    {
      id: "not_about_about",
      label: "It's not about X, it's about Y",
      weight: 55,
      hard: false,
      regex: /\bit'?s not about\b[^.!?\n]{1,120}\bit'?s about\b/gi,
      note: "Classic AI contrast mold. Keep only if it is the clearest sentence."
    },
    {
      id: "doesnt_just",
      label: "Doesn't just X, it Y",
      weight: 42,
      hard: false,
      regex: /\b(?:doesn't|does not|won't|will not|can't|cannot)\s+just\b[^.!?\n]{1,120}\b(?:it|they|we|you)\b/gi,
      note: "Often fake escalation."
    }
  ];

  const archetypes = [
    {
      name: "Blunt Operator",
      description: "Direct, clipped, pragmatic. Sounds like a person who has shipped under pressure and hates soft corporate language.",
      banned: "leverage\nunlock\nseamless\ncutting-edge\nin today's",
      controls: { edge: 4, warmth: 2, proof: 5, clarity: 5 }
    },
    {
      name: "Literary Provocateur",
      description: "Sharp, image-rich, opinionated. Uses fresh metaphors, controlled rhythm, and a little danger without sounding theatrical.",
      banned: "game-changer\nrevolutionize\ndelve\nstay ahead",
      controls: { edge: 5, warmth: 2, proof: 3, clarity: 4 }
    },
    {
      name: "Founder Memo",
      description: "Bold internal memo voice. Specific, urgent, unsentimental, and aimed at leaders who need to act this quarter.",
      banned: "digital landscape\nrobust\nharnessing the power\nat the end of the day",
      controls: { edge: 3, warmth: 3, proof: 5, clarity: 5 }
    },
    {
      name: "The Anarchist",
      description: "Disruptive, bold, unapologetic, and surgically petty. Protects traditional craft while wanting dead gatekeeping systems burned down.",
      banned: "burn it all down\nrebel mindset\ndisruptive innovation\nleverage\nunlock\nseamless\nem dash",
      controls: { edge: 5, warmth: 2, proof: 4, clarity: 5, pettiness: 5, craft: 5 }
    }
  ];

  function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function scanText(text) {
    const lower = text.toLowerCase();
    const phraseFlags = cliches
      .filter(([phrase]) => lower.includes(phrase))
      .map(([phrase, weight]) => ({ type: "phrase", phrase, label: phrase, weight, hard: false }));

    const structuralFlags = structuralRules.flatMap((rule) => {
      const matches = [...text.matchAll(rule.regex)];
      return matches.map((match) => ({
        type: "structure",
        ruleId: rule.id,
        phrase: match[0],
        label: rule.label,
        weight: rule.weight,
        hard: rule.hard,
        note: rule.note
      }));
    });

    return [...phraseFlags, ...structuralFlags].sort((a, b) => b.weight - a.weight);
  }

  function scoreFlags(flags) {
    const total = flags.reduce((sum, flag) => sum + flag.weight, 0);
    return Math.min(100, Math.round(total / 6));
  }

  function analyzeTone(text, flags) {
    const sentences = text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean);
    const words = text.match(/\b[\w']+\b/g) || [];
    const hardBans = flags.filter((flag) => flag.hard).length;
    const proofSignals = (text.match(/\b\d+%|\$\d+|\b\d+x\b|\b\d+\s+(?:days|weeks|months|years|hours)\b/gi) || []).length;
    const firstPerson = (text.match(/\b(I|we|my|our|us)\b/g) || []).length;
    const avgSentenceWords = sentences.length ? Math.round(words.length / sentences.length) : 0;

    return {
      hardBans,
      proofSignals,
      firstPerson,
      avgSentenceWords,
      sentenceCount: sentences.length,
      wordCount: words.length
    };
  }

  function judgeRewrite(original, rewrite, flags) {
    const tone = analyzeTone(rewrite, flags);
    const clarity = tone.avgSentenceWords <= 24 ? 5 : tone.avgSentenceWords <= 32 ? 4 : 3;
    const antiCliche = Math.max(1, 5 - Math.ceil(scoreFlags(flags) / 25));
    const proof = Math.min(5, 2 + tone.proofSignals);
    const emotionalFit = tone.firstPerson > 0 || /danger|threat|waste|dead|craft|work|cost/i.test(rewrite) ? 4 : 3;
    const preservation = original.trim() && rewrite.trim() ? 4 : 1;

    return {
      clarity,
      antiCliche,
      proof,
      emotionalFit,
      preservation,
      hardBans: tone.hardBans,
      notes: [
        tone.hardBans ? "Remove hard-banned punctuation or structures." : "No hard bans found.",
        proof < 3 ? "Add a concrete proof signal if the claim needs support." : "Proof signals present.",
        clarity < 4 ? "Shorten or split long sentences." : "Sentence length is readable."
      ]
    };
  }

  function fallbackRewrite(text, persona) {
    const banned = new Set((persona.banned || "").toLowerCase().split("\n").map((x) => x.trim()).filter(Boolean));
    let revised = text
      .replace(/[—]/g, ". ")
      .replace(/The real danger of shunning AI isn't the technology itself-it's the complacency it exposes\./i, "The robot is not the threat. The threat is believing your work is too special to be automated.")
      .replace(/The real danger of shunning AI isn’t the technology itself—it’s the complacency it exposes\./i, "The robot is not the threat. The threat is believing your work is too special to be automated.")
      .replace(/For too long, we've treated tools like AI as optional luxuries for the overworked or the desperate\./i, "We keep pretending AI is a rescue device for teams that are already drowning.")
      .replace(/But here's the truth:/gi, "The harder truth:")
      .replace(/It's not about whether you can use AI-it's about whether you can afford not to\./gi, "The question is not whether you like it. The question is how much waste you are willing to defend.")
      .replace(/The danger isn't the robot\./gi, "The robot is not the threat.")
      .replace(/It's the delusion that you're special enough to stay untouched by automation\./gi, "The threat is believing your work is too special to be automated.");

    if (persona.name === "The Anarchist") {
      revised = revised.replace(/Markets do not give medals for doing slow work manually\./gi, "Nobody gets a medal for protecting slow work with fancy stationery.");
    }

    banned.forEach((phrase) => {
      revised = revised.replace(new RegExp(escapeRegex(phrase), "gi"), "");
    });
    return revised.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  function buildPrompt(text, persona, flags) {
    const flagged = flags.map((flag) => flag.label || flag.phrase).join(", ") || "none";
    return `Rewrite the text below so it sounds human, distinct, bold, and clear.

Persona: ${persona.name}
Persona instructions: ${persona.description}
Controls: ${JSON.stringify(persona.controls || {})}

Hard rules:
- Never use em dashes.
- Clarity beats novelty.
- Do not invent proof, metrics, or lived experience.
- Keep a clear contrast structure if it is genuinely the clearest sentence, but do not repeat it.

Avoid these phrases and habits: ${persona.banned || "AI cliches, generic transitions, symmetrical paragraph rhythm, corporate softness"}
Flagged issues: ${flagged}

Return only the revised piece.

Text:
${text}`;
  }

  function createPreferencePair({ original, chosen, rejected, persona, reason }) {
    return {
      prompt: `Rewrite this in ${persona.name}: ${original}`,
      chosen,
      rejected,
      reason,
      persona: persona.name,
      createdAt: new Date().toISOString()
    };
  }

  function createPatternRecord(input) {
    return {
      sourceUrl: input.sourceUrl.trim(),
      platform: input.platform.trim(),
      title: input.title.trim(),
      whyItWorks: input.whyItWorks.trim(),
      labels: input.labels.split(",").map((label) => label.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    };
  }

  const api = {
    archetypes,
    cliches,
    structuralRules,
    analyzeTone,
    buildPrompt,
    createPatternRecord,
    createPreferencePair,
    fallbackRewrite,
    judgeRewrite,
    scanText,
    scoreFlags
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SignalForgeEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
```

- [ ] **Step 2: Create `engine.test.js`**

Create `/Users/agencymachine/Documents/Yapp/engine.test.js`:

```js
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
  const flags = engine.scanText("It is not about tools, it is about taste.");
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
```

- [ ] **Step 3: Run the tests and verify they pass**

Run:

```bash
node --test engine.test.js
```

Expected:

```text
# pass 5
# fail 0
```

- [ ] **Step 4: Load `engine.js` in `index.html`**

In `/Users/agencymachine/Documents/Yapp/index.html`, add this line before the inline `<script>`:

```html
  <script src="engine.js"></script>
```

Then replace the existing inline `cliches`, `basePersonas`, `scanText`, `fallbackRewrite`, and `buildPrompt` definitions with references to `SignalForgeEngine`:

```js
    const {
      archetypes: basePersonas,
      buildPrompt,
      fallbackRewrite,
      judgeRewrite,
      scanText,
      scoreFlags
    } = SignalForgeEngine;
```

- [ ] **Step 5: Update `renderScan` to use `scoreFlags`**

Replace:

```js
      const total = flags.reduce((sum, flag) => sum + flag.weight, 0);
      const score = Math.min(100, Math.round(total / 6));
```

With:

```js
      const score = scoreFlags(flags);
```

- [ ] **Step 6: Run browser and Node checks**

Run:

```bash
node --test engine.test.js
node -e 'const fs=require("fs"), vm=require("vm"); const html=fs.readFileSync("index.html","utf8"); const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]); scripts.forEach((s,i)=>new vm.Script(s,{filename:`script-${i}.js`})); console.log(`checked ${scripts.length} inline script block(s)`);'
python3 -m http.server 4173
```

Expected:

```text
# pass 5
# fail 0
checked 1 inline script block(s)
Serving HTTP on :: port 4173
```

- [ ] **Step 7: Commit**

```bash
git add engine.js engine.test.js index.html
git commit -m "Extract Signal Forge tone engine"
```

## Task 2: Add Critic Report And Preference Capture

**Files:**
- Modify: `index.html`
- Test: `engine.test.js`

- [ ] **Step 1: Add critic report markup**

In `/Users/agencymachine/Documents/Yapp/index.html`, after `<p class="status" id="rewriteStatus">Ready.</p>`, add:

```html
      <div class="flag-list" id="criticReport"></div>
      <div class="row" style="margin-top:12px">
        <button class="ghost" id="acceptRewrite">Accept</button>
        <button class="ghost" id="rejectRewrite">Reject</button>
      </div>
```

- [ ] **Step 2: Add preference state helpers to the inline script**

Near the existing `let compare = false;`, add:

```js
    let lastRewriteText = localStorage.getItem("signalForgeRewrite") || "";
    const preferencePairs = JSON.parse(localStorage.getItem("signalForgePreferencePairs") || "[]");
```

- [ ] **Step 3: Update `renderRewrite` to show critic scores**

At the top of `renderRewrite(text)`, add:

```js
      lastRewriteText = text;
      const rewriteFlags = scanText(text);
      const report = judgeRewrite($("sourceText").value, text, rewriteFlags);
      $("criticReport").innerHTML = `
        <div class="flag"><span class="dot ${report.hardBans ? "" : "green"}"></span><span>Hard bans</span><strong>${report.hardBans}</strong></div>
        <div class="flag"><span class="dot green"></span><span>Clarity</span><strong>${report.clarity}/5</strong></div>
        <div class="flag"><span class="dot green"></span><span>Anti-cliche</span><strong>${report.antiCliche}/5</strong></div>
        <div class="flag"><span class="dot amber"></span><span>Proof</span><strong>${report.proof}/5</strong></div>
        <div class="flag"><span class="dot amber"></span><span>${escapeHtml(report.notes.join(" "))}</span><strong>note</strong></div>
      `;
```

- [ ] **Step 4: Add accept/reject handlers**

Add these listeners near the other event listeners:

```js
    $("acceptRewrite").addEventListener("click", () => {
      const pair = SignalForgeEngine.createPreferencePair({
        original: $("sourceText").value,
        chosen: lastRewriteText,
        rejected: $("sourceText").value,
        persona: currentPersona(),
        reason: "User accepted rewrite"
      });
      preferencePairs.push(pair);
      localStorage.setItem("signalForgePreferencePairs", JSON.stringify(preferencePairs));
      $("rewriteStatus").textContent = `Accepted. Preference pairs saved: ${preferencePairs.length}.`;
    });

    $("rejectRewrite").addEventListener("click", () => {
      const pair = SignalForgeEngine.createPreferencePair({
        original: $("sourceText").value,
        chosen: $("sourceText").value,
        rejected: lastRewriteText,
        persona: currentPersona(),
        reason: "User rejected rewrite"
      });
      preferencePairs.push(pair);
      localStorage.setItem("signalForgePreferencePairs", JSON.stringify(preferencePairs));
      $("rewriteStatus").textContent = `Rejected. Preference pairs saved: ${preferencePairs.length}.`;
    });
```

- [ ] **Step 5: Add export preference pairs button**

In the topbar, after `<button class="ghost" id="copyRewrite">Copy rewrite</button>`, add:

```html
      <button class="ghost" id="exportPairs">Export pairs</button>
```

Add this listener:

```js
    $("exportPairs").addEventListener("click", () => {
      const jsonl = preferencePairs.map((pair) => JSON.stringify(pair)).join("\n");
      const url = URL.createObjectURL(new Blob([jsonl], { type: "application/jsonl" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "signal-forge-preference-pairs.jsonl";
      link.click();
      URL.revokeObjectURL(url);
    });
```

- [ ] **Step 6: Run checks**

Run:

```bash
node --test engine.test.js
```

Expected:

```text
# pass 5
# fail 0
```

- [ ] **Step 7: Commit**

```bash
git add index.html engine.test.js
git commit -m "Add critic report and preference capture"
```

## Task 3: Add Tiny Pattern Lab

**Files:**
- Modify: `index.html`
- Test: `engine.test.js`

- [ ] **Step 1: Add Pattern Lab UI**

In the Persona column, after the banned phrases field, add:

```html
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
      <div class="section-title">
        <span>Pattern Lab</span>
        <button class="ghost" id="savePattern">Save</button>
      </div>
      <div class="field">
        <label for="patternUrl">Source URL</label>
        <input id="patternUrl" placeholder="https://...">
      </div>
      <div class="field">
        <label for="patternPlatform">Platform</label>
        <input id="patternPlatform" placeholder="Substack, LinkedIn, blog">
      </div>
      <div class="field">
        <label for="patternTitle">Title</label>
        <input id="patternTitle" placeholder="What overperformed?">
      </div>
      <div class="field">
        <label for="patternLabels">Labels</label>
        <input id="patternLabels" placeholder="hook, thesis, proof">
      </div>
      <div class="field">
        <label for="patternWhy">Why it works</label>
        <textarea id="patternWhy" placeholder="Observed pattern, not copied content."></textarea>
      </div>
      <button class="ghost" id="exportPatterns" style="width:100%">Export Pattern Lab</button>
      <p class="status" id="patternStatus">No pattern records saved yet.</p>
```

- [ ] **Step 2: Add Pattern Lab state**

Near the preference state, add:

```js
    const patternRecords = JSON.parse(localStorage.getItem("signalForgePatternRecords") || "[]");
```

- [ ] **Step 3: Add Pattern Lab event handlers**

Add these listeners:

```js
    $("savePattern").addEventListener("click", () => {
      if (!$("patternUrl").value.trim() || !$("patternWhy").value.trim()) return;
      const record = SignalForgeEngine.createPatternRecord({
        sourceUrl: $("patternUrl").value,
        platform: $("patternPlatform").value,
        title: $("patternTitle").value,
        labels: $("patternLabels").value,
        whyItWorks: $("patternWhy").value
      });
      patternRecords.push(record);
      localStorage.setItem("signalForgePatternRecords", JSON.stringify(patternRecords));
      $("patternStatus").textContent = `Pattern records saved: ${patternRecords.length}.`;
      ["patternUrl", "patternPlatform", "patternTitle", "patternLabels", "patternWhy"].forEach((id) => ($(id).value = ""));
    });

    $("exportPatterns").addEventListener("click", () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(patternRecords, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "signal-forge-pattern-lab.json";
      link.click();
      URL.revokeObjectURL(url);
    });
```

- [ ] **Step 4: Add Pattern Lab test**

Append this test to `/Users/agencymachine/Documents/Yapp/engine.test.js`:

```js
test("pattern record stores observations", () => {
  const record = engine.createPatternRecord({
    sourceUrl: "https://example.com/post",
    platform: "blog",
    title: "A useful essay",
    labels: "hook, thesis",
    whyItWorks: "The hook creates tension and the proof arrives fast."
  });
  assert.equal(record.sourceUrl, "https://example.com/post");
  assert.deepEqual(record.labels, ["hook", "thesis"]);
  assert.match(record.whyItWorks, /proof/);
});
```

- [ ] **Step 5: Run checks**

Run:

```bash
node --test engine.test.js
```

Expected:

```text
# pass 6
# fail 0
```

- [ ] **Step 6: Commit**

```bash
git add index.html engine.test.js
git commit -m "Add Pattern Lab reference capture"
```

## Final Verification

- [ ] Run Node tests:

```bash
node --test engine.test.js
```

Expected:

```text
# fail 0
```

- [ ] Run static syntax check:

```bash
node -e 'const fs=require("fs"), vm=require("vm"); const html=fs.readFileSync("index.html","utf8"); const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]); scripts.forEach((s,i)=>new vm.Script(s,{filename:`script-${i}.js`})); console.log(`checked ${scripts.length} inline script block(s)`);'
```

Expected:

```text
checked 1 inline script block(s)
```

- [ ] Run browser smoke test using local server and Chrome/Playwright if available:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`, then verify:

- The Anarchist appears in persona selector.
- A sample with an em dash gets a hard-ban flag.
- Rewrite output contains no em dash.
- Critic report appears.
- Accept and Reject update preference pair count.
- Pattern Lab can save and export a record.

## Self-Review Notes

Spec coverage:

- My Voice baseline remains local persona storage in this MVP.
- Archetype Library is implemented by `engine.js`, including The Anarchist.
- Scanner and judge rules cover em dashes, contrast molds, cliches, clarity, proof, and preservation.
- Pattern Lab starts as manual reference capture, not scraping.
- Training is intentionally not implemented yet.
- CLI/MCP is intentionally not implemented yet.

No placeholders remain. The plan uses exact files, exact commands, and runnable checks.

