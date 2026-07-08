# Signal Forge Tone Engine Design

Date: 2026-07-08
Status: Draft approved for implementation planning after user review

## Goal

Signal Forge turns generic AI writing into thought leadership that sounds human, distinct, emotionally alive, and clear. It should especially serve founder, AI, business, technology, and category-point-of-view writing.

The product is not an "AI detector." It is a taste engine. It scans for weak writing patterns, rewrites through a user's learned voice and selected archetype, then critiques the result before showing it.

## Core Product Shape

Signal Forge has two voice layers:

- My Voice: the user's learned baseline, built from their own examples, edits, ratings, and preferred outputs.
- Archetype Library: selectable stance overlays such as The Operator, The Heretic, Field Reporter, Bruised Optimist, Builder-Philosopher, Provocateur With Receipts, Mentor In The Arena, Cultural Diagnostician, and The Anarchist.

The rewrite flow is:

1. Input draft.
2. Scanner flags AI/cliche language, weak argument structures, missing proof, bad hooks, fake emotion, and overused cadence.
3. My Voice supplies baseline taste.
4. Archetype overlay supplies stance, emotional charge, and rhetorical moves.
5. Rewriter creates a revised draft.
6. Critic agent judges the draft.
7. Final polish applies the critique.
8. User accepts, edits, or rejects. That feedback becomes future preference data.

## The Anarchist Archetype

The Anarchist is disruptive, bold, unapologetic, and petty with precision. It is never cruel and never punches down.

Beliefs:

- Traditional art and craft matter.
- The old gatekeeping system is dead.
- Many institutions used "taste" as a waiting room.
- Dead systems deserve to be burned down, but craft deserves protection.
- Politeness often protects lazy institutions.

Controls:

- Edge: very high.
- Warmth: low to medium, but never dehumanizing.
- Pettiness: high, but specific and funny.
- Craft loyalty: high.
- Institutional contempt: high.
- Clarity: mandatory.

Avoid:

- Generic rebel branding.
- Empty "burn it all down" slogans.
- Cruelty.
- Nihilism.
- Cheap profanity as personality.
- Mean comments toward powerless people.

## Pattern Lab Strategy

Signal Forge should aggressively study public thought leadership, viral essays, founder posts, AI commentary, business writing, and social content for patterns. The point is to observe why work spreads, why it feels human, and why some posts sound dead.

This is like studying 1,000 strong photos to understand lighting, composition, subject distance, and contrast. We are not trying to copy the photos. We are trying to extract craft.

The Pattern Lab should support:

- Viral threshold research, such as posts or essays with 50,000+ views, strong engagement, high saves, major reposts, or visible influence.
- Platform-specific pattern notes for LinkedIn, X, Reddit, Medium, Substack, independent blogs, founder letters, company essays, and public reports.
- PLR, public-domain, Creative Commons, government, SEC, and permissioned corpora for deeper local storage and training.
- Manual and automated annotation of hooks, thesis shapes, proof moves, emotional stance, cadence, structure, and failure modes.
- Comparison between viral-but-bad, viral-and-good, expert-but-boring, and genuinely excellent writing.

The Pattern Lab stores observations first, not bulk copied full text by default.

## Corpus Tiers

Tier 1: Pattern References

Use for public writing where we need craft analysis.

Store:

- Source URL.
- Platform.
- Author or publication.
- Date.
- Topic.
- Public metrics when available.
- Short excerpt where useful.
- Hook type.
- Thesis shape.
- Emotional stance.
- Proof move.
- Cadence.
- Why it worked.
- Why it failed.
- Pattern labels.

Tier 2: Licensed and Open Corpus

Use for deeper analysis and training where rights are clearer.

Sources:

- PLR articles.
- Public domain essays.
- Creative Commons works compatible with the intended use.
- Government and SEC filings.
- Company materials with permission.
- User-owned exports.
- Opt-in creator datasets.

Store full text only when the license or permission supports that use.

Tier 3: Signal Forge Training Data

Use for SFT, DPO, reward modeling, and local adapters.

Sources:

- User edits.
- Accepted rewrites.
- Rejected rewrites.
- Chosen/rejected pairs.
- Synthetic bad drafts paired with curated strong rewrites.
- User-owned voice samples.
- Permissioned examples.

This is the highest-value dataset.

## Tone and Writing Taxonomy

The scanner and judge should label these patterns:

- Hook types: contrarian reframe, specific outcome, pain name, field note, myth bust, prediction, mistake confession, operator observation.
- Thesis shapes: reframe, tradeoff, causal, timing, anti-pattern, principle, prediction, earned belief.
- Emotional stance: calm operator, earned urgency, generous teacher, sharp contrarian, reflective founder, builder optimist, skeptical pragmatist, anarchist contempt.
- Proof moves: metric, customer scene, mechanism, counterexample, comparison, authority reference, operational detail, social proof, analogy, personal anecdote.
- Cadence: short punch, mini memo, story lesson, list with argument, provocation then nuance, build in public, market read.
- AI failure modes: generic grandiosity, focal AI words, fake symmetry, fake specificity, unearned certainty, LinkedIn bro cadence, empty frameworks, synthetic empathy, over-hedging, insight without cost, orphaned hook.

## Hard and Soft Style Rules

Hard rules:

- Never use em dashes in generated output.
- Preserve clarity over cleverness.
- Do not invent lived experience, metrics, or proof.
- Do not weaken a clear sentence just to avoid a common structure.

Soft rules:

- Penalize repeated "not X, but Y" shapes.
- Penalize "it's not about X, it's about Y" when used as a default mold.
- Penalize symmetrical AI paragraph rhythm.
- Penalize lists that do not ladder to one argument.
- Penalize emotional language that is not supported by stakes.

Important correction:

Some common structures are clear and useful. The system should not ban them blindly. It should detect overuse, generic nouns, and fake profundity. One strong "The danger is not X. The danger is Y." line can stay if it is the clearest version.

## Voice File Model

Each voice has human-readable files and executable controls:

- soul.md: beliefs, emotional range, taste, dislikes, worldview, tensions, examples.
- voice.json: structured controls for prompts, scanner weights, banned phrases, archetype sliders, and judge rubric.
- examples.md: before/after examples.
- judge.md: what good and bad look like for that voice.

My Voice uses the same structure as archetypes, but it grows from user feedback.

## Agent Pipeline

The first implementation should not require an agent framework. Use explicit calls.

Scanner:

- Deterministic local rules for phrases, punctuation, cadence, and structural patterns.
- Optional LLM analysis for hook, thesis, proof, and emotional stance.

Rewriter:

- Uses My Voice, archetype controls, scanner report, and input draft.
- Produces a clear rewrite, not an ornate rewrite.

Critic:

- Scores the rewrite for human specificity, voice fit, stance, clarity, proof, cliche removal, emotional truth, and content preservation.
- Names concrete weaknesses.

Polisher:

- Applies the critic's useful notes.
- Removes em dashes and banned structures.
- Keeps meaning intact.

## Training Strategy

Do not train first. Build the no-training baseline and Pattern Lab first.

Phase 1: Prompt and Pattern Engine

- Use scanner, archetype controls, My Voice, examples, and critic prompts.
- Build a fixed eval set of 50 to 100 inputs.
- Measure human feel, clarity, voice fit, cliche removal, and meaning preservation.

Phase 2: Local QLoRA SFT on the Remote 4090

- Use the remote RTX 4090 for local adapter experiments.
- Start with Qwen3 8B Instruct or another 7B to 9B model.
- Train on 200 to 1,000 excellent rewrite examples.
- Keep max sequence length modest first, roughly 2K to 4K tokens.
- Compare against the no-training baseline before keeping the adapter.

Phase 3: DPO Taste Alignment

- Use 500 to 2,000 chosen/rejected pairs.
- Teach the model that "clear and alive" beats "clever but vague."
- Use DPO after SFT if SFT learns behavior but not taste.

Phase 4: Reward Model, Only If Needed

- Train a scorer only if Signal Forge needs to generate several candidates and rank them automatically.

Training math:

- A 4090 has 24GB VRAM.
- QLoRA raw weight storage is roughly parameters times 0.5 bytes, before adapters, optimizer state, activations, context, and framework overhead.
- 7B to 9B QLoRA is realistic.
- 12B to 14B QLoRA is possible but more sensitive to context and batch size.
- Full fine-tuning is not the right first move.

## Data Flow

Input draft becomes:

- scan_report
- voice_context
- archetype_context
- rewrite_result
- critic_report
- final_rewrite
- user_feedback
- optional_preference_pair

Pattern Lab record becomes:

- reference metadata
- metrics
- annotations
- pattern labels
- usefulness score
- optional short excerpt

Accepted/rejected rewrite feedback becomes:

- prompt
- chosen
- rejected
- reason
- voice
- archetype
- scanner flags

## UI Scope

The current single-page app can stay as the prototype shell. The next useful UI additions are:

- Pattern Lab import/review table.
- Voice Library panel.
- Archetype detail view.
- Critic report beside the rewrite.
- Accept/reject buttons that save preference pairs.
- A "why this works" explanation for great examples.

Do not add accounts, billing, cloud sync, or platform automation yet.

## CLI and MCP Future

The engine should be separable from the UI so it can later power:

- CLI: humanize a file with a chosen voice and archetype.
- MCP server: route generated writing through Signal Forge before posting or returning it.
- Local Ollama workflow: use current local models first, then optional trained adapters.

Example future command:

humanize draft.md voice my-voice archetype anarchist strict

## Testing and Evaluation

Minimum checks:

- Scanner test: em dashes are always flagged.
- Scanner test: repeated contrast molds are penalized, not blindly banned.
- Rewrite test: output preserves meaning.
- Rewrite test: output contains no em dashes.
- Judge test: clear direct writing can beat stylized writing.
- Preference test: accepted/rejected pairs are saved in valid DPO-ready shape.

Evaluation dimensions:

- Hook integrity.
- Thesis strength.
- Proof quality.
- Argument coherence.
- Emotional fit.
- Originality.
- Anti-cliche score.
- Actionability.
- Meaning preservation.
- Voice fit.

Algorithmic feasibility:

- Phrase scan is O(n * p), where n is text length and p is pattern count.
- Regex structural scan is O(n * r), where r is regex count.
- Corpus filtering is O(m), where m is number of records.
- These are feasible for local editor and corpus-review use. If the corpus grows large, use SQLite FTS or embeddings for retrieval.

## Sources Used

- TRL SFT Trainer documentation.
- TRL DPO Trainer documentation.
- TRL dataset format documentation.
- PEFT LoRA and quantization documentation.
- Ollama import and Modelfile documentation.
- LinkedIn thought leadership guidance.
- Edelman and LinkedIn 2024 B2B Thought Leadership Report.
- Purdue OWL Toulmin argument guide.
- GMU rhetoric guide.
- Minto Pyramid summary.
- AIDA and PAS copywriting frameworks.
- Platform documentation and terms for Substack, Medium, Reddit, X, LinkedIn, WordPress, Ghost, and SEC EDGAR.

## Scope Cuts

Skipped for the first implementation:

- Bulk scraping engine.
- Social posting automation.
- Account system.
- Cloud training jobs.
- Reward model.
- Full-text warehouse for third-party platform content.
- Agent framework.

Add those only when the Pattern Lab and preference loop prove the writing quality improves measurably.

