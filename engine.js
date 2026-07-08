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
      name: "The Operator",
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
      name: "The Heretic",
      description: "Attacks accepted industry wisdom without losing the plot. Clean enemies, sharp claims, no cheap outrage.",
      banned: "best practices\nindustry standard\nthought leader\nparadigm shift",
      controls: { edge: 5, warmth: 2, proof: 4, clarity: 5, defiance: 5 }
    },
    {
      name: "Field Reporter",
      description: "Grounded in what happened this week. Specific scenes, stripped names, clear lessons, no fake memoir fog.",
      banned: "journey\nvaluable lesson\nincredible experience\nhumbled",
      controls: { edge: 3, warmth: 4, proof: 5, clarity: 5, scene: 5 }
    },
    {
      name: "Bruised Optimist",
      description: "Hopeful after admitting what hurt. Honest about cost, allergic to sunny slogans.",
      banned: "everything happens for a reason\nsilver lining\nkeep pushing\npositive vibes",
      controls: { edge: 3, warmth: 5, proof: 3, clarity: 5, hope: 5 }
    },
    {
      name: "Builder-Philosopher",
      description: "Turns technical and operational observations into larger human truths without getting mystical.",
      banned: "humanity\nreimagine\nunlock potential\ntapestry",
      controls: { edge: 3, warmth: 3, proof: 4, clarity: 4, reflection: 5 }
    },
    {
      name: "Provocateur With Receipts",
      description: "Makes the bold claim, then pays for it with proof. Controlled aggression, no empty hot takes.",
      banned: "hot take\nunpopular opinion\nlet that sink in\nwake up",
      controls: { edge: 5, warmth: 2, proof: 5, clarity: 5, receipts: 5 }
    },
    {
      name: "Mentor In The Arena",
      description: "Teaches from scars, not a pedestal. Protective, direct, and useful to people actually building.",
      banned: "here's everything you need\nultimate guide\ncrushing it\nboss",
      controls: { edge: 3, warmth: 5, proof: 4, clarity: 5, mentorship: 5 }
    },
    {
      name: "Cultural Diagnostician",
      description: "Names the industry pattern everyone feels but cannot quite say. Sharp disappointment, clean diagnosis.",
      banned: "culture shift\nzeitgeist\nnew era\nchanging landscape",
      controls: { edge: 4, warmth: 2, proof: 4, clarity: 5, diagnosis: 5 }
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

  function sanitizeOutput(text) {
    return text
      .replace(/[—]/g, ". ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/ \./g, ".")
      .replace(/(^|[.!?]\s+)([a-z])/g, (_match, prefix, char) => `${prefix}${char.toUpperCase()}`)
      .replace(/\n{3,}/g, "\n\n")
      .trim();
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
      .replace(/The teams that ignore it won't just fall behind; they'll start losing fights before they even notice\./gi, "Teams that ignore it do not lose in one dramatic collapse. They lose in quiet increments: slower drafts, slower analysis, slower decisions.")
      .replace(/Consider what happens when you refuse to integrate AI into your workflow:/gi, "Refuse it long enough and the bill gets plain:")
      .replace(/You outsource more hours to manual labor\./gi, "More hours disappear into manual work.")
      .replace(/Your margin for error grows with every human step in a process\./gi, "Every extra handoff gives error another place to hide.")
      .replace(/Someone else, somewhere, is already shipping faster and cheaper because they didn't wait for permission to optimize\./gi, "A competitor is already using the same week to make more attempts than you.")
      .replace(/The danger isn't the robot\./gi, "The robot is not the threat.")
      .replace(/It's the delusion that you're special enough to stay untouched by automation\./gi, "The threat is believing your work is too special to be automated.")
      .replace(/The world doesn't reward mediocre systems built by hand\./gi, "Markets do not give medals for doing slow work manually.")
      .replace(/It rewards the ones that evolve\./gi, "They reward systems that learn.")
      .replace(/And evolution requires more than stubbornness-it demands curiosity about how to leverage what's already here\./gi, "That takes more than stubbornness. It takes enough curiosity to use the tools already on the table.");

    if (persona.name === "The Anarchist") {
      revised = revised.replace(/Markets do not give medals for doing slow work manually\./gi, "Nobody gets a medal for protecting slow work with fancy stationery.");
    }

    banned.forEach((phrase) => {
      revised = revised.replace(new RegExp(escapeRegex(phrase), "gi"), "");
    });
    return sanitizeOutput(revised);
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

  function toJsonl(records) {
    return records.map((record) => JSON.stringify(record)).join("\n");
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
    sanitizeOutput,
    scanText,
    scoreFlags,
    toJsonl
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.SignalForgeEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
