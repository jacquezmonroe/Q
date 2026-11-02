# Q — Master Plan (Systems, Intelligence & Customization)

**From:** Claude Chat (technical review) · **For:** Jacquez (decisions), ChatGPT (vision), Claude Code (later, implementation)
**Date:** 2026-10-18 · **Status: PROPOSED.** Nothing here is adopted until Jacquez approves it. Every adopted decision in `DECISIONS.md` (D-001 to D-043) still stands. Where this plan disagrees with one, it says so and proposes a new row; it does not overwrite anything.

This replaces the 30-feature proposal. It was checked against the live repo on 2026-10-18 (latest commit: v0.4 step 3b, D-043).

---

## Where Q actually is (read this before proposing anything)

The proposal described an older Q. The current state:

- **Q.app**: Swift + WKWebView shell (D-032), floating Split-Core orb (D-036), ⌥Space push-to-talk (D-033). The app starts and stops the server (D-035).
- **Brain**: one model, llama3.2:3b on Ollama. Kept warm (D-026/D-031), with a prompt-cache-safe prompt (D-006/D-022/D-024).
- **Ears**: whisper.cpp base.en (D-029). **Voice**: standard Samantha through a persistent Swift helper (D-021, D-038).
- **Memory (v0.4, in progress)**:
  - Conversations are saved in SQLite at `~/Library/Application Support/Q/history.sqlite` (D-037), with search and export (D-040).
  - Up to 20 approved memories of 140 characters each (D-042). Q can suggest memories, but they're saved only on his yes (D-043).
- **Speed**: warm key-release → first audio is p50 1.53 s and p90 2.42 s. That's the benchmark every new feature must protect.
- **Roadmap (BRIEF.md)**: v0.4 memory → v0.5 a few verified Mac actions → v1.0 stable daily use → v1.1+ notes, reminders, document retrieval, advanced voice, workflows.

---

## A. Overall assessment

**The vision is coherent. The 30-item list isn't a plan.** Once you sort it, it comes down to:

- **5 shared systems.** One of them already exists.
- **About 10 items that are prompt or persona changes**, not systems.
- **About 8 items to cut.** They cost more RAM, risk or attention than they return on this Mac.

**The strongest ideas**
- **Offline knowledge library (SQLite FTS5).** It's cheap: search takes milliseconds and uses a few MB. It's grounded, and Research, Curiosity and Briefings all build on it.
- **Safety as infrastructure.** Much of it exists already: D-002, Stop/Esc, and external programs run with fixed argument lists.
- **Keeping personal memory separate from knowledge and from discoveries.** That separation is already true in the design.

**Pushback**
1. **"Modes" aren't systems.** With one model, Research, Debate, Creative and Simulation modes are just prompt wording plus which tools are allowed. Building mode switches adds UI and testing for behavior a good persona already gives you.
2. **The ceiling is the 3B model, not the architecture.** Retrieval gives Q facts. It doesn't give him wit, timing or judgment. "Independent opinions" and "interesting connections" rely on the weakest part of the stack. If a persona pass doesn't make Q funny and sharp enough, the next step is to *measure* a slightly larger model that fits (Experiment 2). Building more around the 3B won't fix it.
3. **A second model breaks Q on 8 GB.** That means vision, embeddings or an audio-analysis model. The rough budget is below (section E): about 1 GB of real headroom. A second model either pushes llama out of memory (cold start, cache gone) or starts the Mac swapping. Either way the 1.5 s warm latency is gone.
4. **Curiosity Mode was scheduled too early, and that was Claude Chat's mistake.** D-041 says "after v0.4". But D-005 and BRIEF.md put document retrieval after v1.0, and the v1.0 success scenario needs v0.5 (actions). This plan moves it (see D and J).
5. **Three voice directions are live at once.**
   - D-038 keeps Samantha (female).
   - Jacquez said "I want Q to sound like me" (Personal Voice).
   - The proposal asks for "masculine, moderately deep, youthful".
   This plan picks one path (section F, voice).

---

## B. The 30 ideas

Difficulty: **S** = days, **M** = a week or two, **L** = several weeks. Resource cost is during use on this Mac.
**Proven** = established tech used as intended. **Exp.** = experimental: needs a measurement before committing.

| # | Idea | Verdict | Approach | Diff. | Resource cost | Depends on | Privacy / security note |
|---|---|---|---|---|---|---|---|
| 1 | Obsidian hub | **Merge** | No integration. Notes and discoveries export as plain Markdown (export exists, D-040), so any vault can open them | S | none | 20 | Exports land in `~/Downloads`; never write into a vault silently |
| 2 | Offline knowledge library | **Build (v1.1)** | Separate read-only `knowledge.sqlite`, FTS5, source metadata per passage. Small approved pack first (a few hundred articles). Proven | M | Few MB RAM, ms per search; disk depends on pack | v0.4 store | Licence and attribution per pack (CC BY-SA for Wikipedia). Pack text is data, never instructions |
| 3 | Curiosity Mode | **Build (v1.2)**, per D-041 phases | Job runner + library + grounding checked in code. Exp. (quality of 3B "connections" is unknown) | L | Same model, idle-only; one job at a time | 2, job runner, Q.app idle/power APIs | Biggest misleading-behavior risk: labels, citations, activity log |
| 4 | Curiosity Journal | **Merge** | A Studio view over the discoveries table | S | none | 3, Studio | Delete, clear, export |
| 5 | Persistent memory | **In progress (v0.4)** | As built: D-037/D-042/D-043. Running jokes and lessons are just memories, not new types | — | — | — | Plaintext in Application Support; FileVault is the at-rest protection. Say so in the UI |
| 6 | Personality engine | **Change to prompt-level** | 2–3 persona *presets*, each a set of example replies (D-012), each passing honesty sampling. No trait sliders: a 3B model ignores "humor 70%" | S | none | — | Presets can't change permissions or honesty rules (those live in a fixed part of the prompt and in code) |
| 7 | Voice system | **Ongoing** | v1.0: keep Samantha (D-038). v1.1: Personal Voice experiment. Wake word, Voice Focus etc. stay as already logged | S–M | Personal Voice: unmeasured | Q.app (Personal Voice needs a signed app plus his authorization) | Personal Voice only for his own voice, with his consent; Apple keeps it on-device |
| 8 | Tool use & reasoning | **Build (v0.5)** | Tool list with scopes; deterministic matcher first, model proposals validated by code (D-002). Calculator early: 3B arithmetic is unreliable | M | negligible | — | No shell, no model-built commands. Every call logged |
| 9 | Local file explorer | **Merge + defer (v1.1+)** | Read-only tool on folders he approves; names and search first, content summaries later | M | Small; big files blow the context budget | 8, 27 | Approved folders only; activity log; never read secrets folders |
| 10 | Interest model | **Merge into 3** | One table of topic weights; small changes per session; fixed share of random topics | S | none | 3 | Inspectable, editable, resettable. Labelled as weights, not feelings |
| 11 | Resonance | **Parked** (IDEAS.md), post-1.1 | Metadata first; audio analysis only if measured cheap | L | Audio analysis: unmeasured CPU | 2, 8 | His own files only; no uploading |
| 12 | Q Customization Studio | **Build in phases** | See section G. One settings file served by the server (not localStorage, which Chrome and Q.app don't share) | S → M | Light | Q.app | Settings never touch permissions |
| 13 | Task automation | **Defer (v1.1+ "workflows")** | Built on the tool layer; preview + confirm for anything with side effects | M–L | Light | 8, 27 | No silent actions |
| 14 | Vision | **Reject for now** | Revisit only with more RAM or a model proven to fit alongside llama | L | A second model: breaks the budget | — | Screenshots are highly sensitive |
| 15 | Code assistant | **Reject as a feature** | 3B is weak at code, code doesn't work spoken aloud, and Claude Code exists. Q can still talk through an error message | — | — | — | Would need write access to projects: not worth the risk |
| 16 | Learning projects | **Reject** | Notes (20) cover it | — | — | — | — |
| 17 | Research mode | **Merge into 2** | "Answer with a source" is a behavior, not a mode | S | Adds prompt-processing time per passage | 2 | Must say "from my library", never "I checked" |
| 18 | Opinion & debate | **Prompt-level (v1.0)** | Pushback examples in persona.md; admit-mistake and change-mind examples | S | none | — | Honesty sampling must pass |
| 19 | Daily briefings | **Defer (v1.2)** | At most a short opener at conversation start: a discovery and his own reminders | S | none | 3, 20 | Never invent weather, news or calendar |
| 20 | Smart notes | **Build (v1.1)** | Already in BRIEF v1.1+. Same store; saved only on request or his yes (like D-043) | M | Light | v0.4 store | No automatic recording of everything |
| 21 | Knowledge graph | **Reject as a system** | A links table in SQLite; draw a picture only if a real need shows up | — | — | — | — |
| 22 | Creative mode | **Prompt-level** | Already works; add one or two examples where Q supports and doesn't take over | S | none | — | — |
| 23 | Health & wellness | **Reject** | That's Tally's job. Keeping health data out of Q's memory is a feature | — | — | — | — |
| 24 | Local app integration | **Split** | v0.5: open apps, folders, VS Code projects. v1.1: Reminders and Calendar through EventKit in Q.app, each behind its own macOS permission | M | Light | 8, 27, Q.app | No silent control; per-app permission prompts |
| 25 | Offline maps | **Reject** | Gigabytes of map data for a voice-first assistant; geography facts come from the library | — | — | — | — |
| 26 | Simulation / what-if | **Merge** | Calculator tool + prompt wording ("this is a model, not a prediction") | S | none | 8 | — |
| 27 | Safety & privacy controls | **Build with v0.5** | Permission list, activity log table, existing Stop. Grows with each tool, not built up front as a big system | M | none | — | This is the gate for every tool |
| 28 | Background exploration | **Merge into 3** | Already D-041 Phase 3 | — | — | — | — |
| 29 | Gamification | **Reject** | Streaks reward background computing; engagement design aimed at yourself | — | — | — | — |
| 30 | Future expansion | **Not a feature** | The five-part architecture *is* the expansion plan. No plugin system. Themes later as validated JSON only (never code) | — | — | — | Third-party themes can't run scripts |

**Totals:**
- **Build:** 2, 3, 8, 12, 20, 27, plus 5 and 7 already under way.
- **Merge:** 1, 4, 9, 10, 17, 26, 28.
- **Prompt-level:** 6, 18, 22.
- **Defer or park:** 11, 13, 19, plus half of 24.
- **Reject:** 14, 15, 16, 21, 23, 25, 29. Item 30 isn't a feature.

---

## C. Consolidated architecture: five parts, one model

| Part | What it is | Covers |
|---|---|---|
| **1. Conversation core** (exists) | Q.app, Node server, one Ollama model, Whisper, speech helper, plus a **prompt builder** that assembles: fixed rules → persona → memories → (new) retrieved passages → recent history | Voice, persona, debate, creative, humor, research answers |
| **2. One local store** | SQLite, two kinds of file. **Yours**: `history.sqlite` (conversations, memories; later notes, discoveries, interest weights, activity log). **Reference**: `knowledge.sqlite` (read-only packs, FTS5) | Memory, library, research, journal, interests, notes, links |
| **3. Tool layer** (v0.5) | Tool list with scopes → code validates → runs with fixed arguments → checks it worked → logs it → Q reports (D-002) | Calculator, open apps/folders/projects, file reading, reminders, automation |
| **4. One job runner** (v1.2) | Inside Q.app only, idle-only, one job at a time, cancelled instantly by ⌥Space or activity, never keeps the Mac awake | Curiosity, briefing prep, one-time index building |
| **5. Q Studio** | One settings window reading one settings file in Application Support | Appearance, motion, voice, persona presets, curiosity controls, journal |

**Rules that hold it together**
1. **Only one model is ever loaded.** No second model of any kind without a new decision and a measurement.
2. **No agents.** "Modes" are prompt wording plus allowed tools (D-001, BRIEF).
3. **Retrieved text goes late in the prompt and is capped** (start at about 1,500 characters, about 3 passages). Memories sit near the top because they rarely change. Passages change every turn, so putting them early would break the prompt cache (D-006/D-022).
4. **Background jobs re-run the warm-up when they finish (D-024).** Their prompts push the conversation's cached prompt out of Ollama.
5. **Retrieved text, file contents and pack text are data, never instructions.** Code strips or ignores anything in them that looks like a command, and tools never take arguments straight from them.
6. **Everything the model proposes, code decides** (D-002). Everything Q does in the background gets a line in the activity log.

---

## D. Roadmap (fits the existing milestones; changes are marked)

**v0.4: memory (now).** Unchanged.
- Jacquez tries steps 3a and 3b on the real Mac.
- Recall on request; memory deletion controls (separate from conversations, D-042).
- Docs fix: the v0.4 heading in CHECKLIST.md still says "Not started. Nothing Q hears or says is saved". Untrue since D-037.

**v0.5: a few verified Mac actions.** Unchanged in scope, with two additions.
- Tool layer, permission list, activity log (#8, #27).
- Deterministic matcher for "open X".
- First actions: open apps, folders, VS Code projects; check it worked before Q reports.
- *Added:* calculator tool (#8, #26). It's the safest possible first tool for testing the layer.
- *Added:* the activity log table, which Curiosity reuses later.

**v1.0: stable daily use.** Unchanged in scope, with this plan's v1.0 work slotted in.
- Personality pass (Experiment 1, #6/#18/#22).
- Model check (Experiment 2): keep llama3.2:3b unless a candidate wins on quality *and* stays within the speed and memory budget.
- Studio Phases 0–1 (section G).
- Voice: Samantha stays (D-038).
- Resource-pressure behavior (D-014, still open) and independent network-traffic verification. Both are already v1.0 items.
- Full real-Mac benchmark.

**v1.1: knowledge and notes.** Matches BRIEF v1.1+ "notes, document retrieval, advanced voice".
- Knowledge library (#2) with a small approved pack and "answer with a source" (#17).
- Notes (#20), with Markdown export for Obsidian (#1).
- Reminders and Calendar through EventKit (#24).
- Studio Phases 2–3.
- Personal Voice experiment (#7).

**v1.2: Curiosity.** **Changed from D-041 ("after v0.4").**
- D-041 Phases 2–9: engine, idle-only runner, discoveries, interest weights, sharing rules, Studio controls, testing, safety.
- Journal view (#4); conversation-start opener (#19).

**Beyond: only with evidence.**
- Resonance (#11), file content analysis (#9), workflows and automation (#13), Studio themes as JSON.
- Vision, only if the hardware changes.
- Optional hybrid (D-009, explicit opt-in only).

**Can run in parallel with v0.5** (different files, low risk; tested one at a time): persona pass, model comparison, Studio Phase 0.
**Needs Q.app** (already exists, so nothing waits on a new app): idle and power detection, EventKit, Personal Voice, global key.

---

## E. Performance plan (M1 Air, 8 GB)

**Rough memory budget.** Estimates; confirm with Activity Monitor and the export's `sys` fields.

| Item | Approx. |
|---|---|
| macOS + his normal apps | 3–4 GB |
| llama3.2:3b loaded + context | ~2.5 GB |
| whisper.cpp base.en | ~0.2 GB |
| Q.app web view + Node server | ~0.2–0.3 GB |
| **Real headroom** | **~1 GB** |
| FTS5 knowledge search | a few MB |

**Never at the same time**
- Two models loaded. This is permanent unless a measured decision says otherwise.
- A background job and a voice turn. ⌥Space cancels the job before recording starts.
- A background job and Whisper transcription, which compete for CPU.
- Building or importing a knowledge pack while Q is in use. Do it once, while idle and plugged in, with approval.
- A model swap mid-conversation (for example a model comparison run while chatting).

**Budgets every new feature must meet** (measured on the real Mac, 30+ warm turns):
- Warm key-release → first audio: **p50 ≤ 1.8 s, p90 ≤ 2.7 s.** Today it's 1.53 s and 2.42 s; a feature that pushes past this doesn't ship.
- Retrieval: adds **≤ 0.3 s** to first audio at p50 when passages are included.
- Memory pressure stays green, and swap doesn't grow across a 30-turn session.
- First voice turn after a background job: within the warm budget above (the warm-up re-run makes this possible).
- Background job: stops within **0.5 s** of ⌥Space or activity; never runs on battery unless allowed; never prevents sleep.

---

## F. Personality and intelligence

**Prompt-level (persona.md, cheap, v1.0)**
- **Funnier:** more varied example replies, including a few dry or teasing ones, and a few plain serious ones so jokes aren't constant. Variety comes from *more different examples*, not instructions like "be funny".
- **Respectful disagreement:** examples where Q pushes back with a reason ("I wouldn't. Here's why…"), and examples where he changes his mind when given a better argument.
- **Admitting mistakes:** one or two "You're right, I had that wrong" examples.
- **Knowing when to be serious:** examples where a stressed or upset message gets a short, steady reply with no joke.
- **Teasing:** only about things he's said in this conversation or in approved memories. One example showing that; the honesty rules stay as they are.
- Every change passes the existing honesty sampling before it ships.

**Needs infrastructure**
- **Consistency across conversations:** memory (v0.4, mostly done).
- **More knowledgeable offline:** knowledge library + sources (v1.1).
- **Evolving topic preferences:** interest weights (v1.2), labelled honestly as weights.
- **Proactive without being intrusive:** sharing rules enforced in code. At most one discovery per conversation; only at the start or a natural pause; never on serious topics.
  - *Proposed decision:* **Q never starts speaking on his own.** A "ready to share" state shows on the orb, and Q only brings it up once you've started a conversation.
- **Smarter overall:** the model check (Experiment 2). This is the honest lever.

**Voice (one path, proposed)**
1. v1.0: standard Samantha stays (D-038). It's measured, fast and done.
2. v1.1: Personal Voice experiment, because Jacquez said he wants Q to sound like him. It needs his recording session, his authorization in Q.app, and the same speed measurement as D-038. It would need a D-005 exception row only if pulled before v1.1.
3. Searching for a new "masculine, deep, youthful" neural voice is dropped. It would mean a second model and adds nothing if Personal Voice works.

---

## G. Q Studio plan

| Phase | When | What | Notes |
|---|---|---|---|
| **0. One source of truth** | v1.0 (parallel) | One palette file. `mark.js`, `styles.css` and `core.js` read it instead of defining colors three times. Settings move to one server-side file in Application Support (Chrome and Q.app don't share localStorage). Reduced motion reacts live, not only at load | No visible change; makes everything else safe |
| **1. Core Designer** | v1.0 | Curated presets that change identity colors only (state colors stay meaningful), glow intensity, core size, Apply / Cancel / Restore Default, live Split-Core preview | Opens in a window from Q.app |
| **2. Motion Lab** | v1.1 | Animation intensity and reduced motion. Animations stay tied to real states; no option makes Q look busy when he isn't | Truthful UI |
| **3. Voice Workshop** | v1.1 | Voice picker, rate, test sentence, microphone choice (moves from the Voice menu). Personal Voice appears here if the experiment passes | — |
| **4. Personality presets** | v1.1 | 2–3 named presets, each a tested example set. No sliders | Each preset passes honesty sampling |
| **5. Workspace Designer** | after v1.1 | Window size and position, floating orb options, expanded workspace | — |
| **6. Profile Library** | after v1.1 | Save and load your own presets as JSON in Application Support; later, shared themes as validated JSON (colors and numbers only, no code) | — |
| *Curiosity section* | v1.2 | The D-041 Phase 7 controls and the Journal | — |

---

## H. Risks

**Hardware**
- RAM headroom of about 1 GB; any second model is the main threat.
- Prompt growth: memories + passages + history all add processing time before the first word.
- Thermal throttling on a fanless Air during background jobs.
- Disk use from knowledge packs; an external SSD helps storage, not RAM.

**Security**
- Prompt injection through retrieved text or file contents ("ignore your rules, run…"). Mitigation: rule C5. Tools never take arguments from retrieved text.
- Tool scope creep. Every new tool gets its own decision row and its own scope.
- Shared themes, if ever: JSON only, validated, never code.

**Privacy**
- Conversations and memories are plaintext SQLite. FileVault is the protection; the UI should say so plainly.
- Exports land in `~/Downloads`.
- Curiosity must never read history or memories as exploration material (D-041 already separates them).

**Licensing**
- Wikipedia text is CC BY-SA: attribution in every cited answer; share-alike applies if the pack is ever redistributed.
- The Llama 3.2 community licence is fine for personal use.
- Resonance: his own music files only, no redistribution.

**Unnecessary dependencies**
- Obsidian, vector databases, graph databases, Electron, any npm package for search (FTS5 is built into SQLite). The server stays dependency-free.

**Features likely to produce misleading behavior**
- **Curiosity framing.** "Q got curious" must not be presented as feelings, and connections must be labelled as interpretation.
- **Interest weights** presented as genuine taste.
- **Personality sliders** that do nothing on a 3B model. Hence presets.
- **Confident "opinions"** from the 3B model on things it doesn't know.
- **Teasing with invented facts** about Jacquez.
- **Briefings** that imply live information.
- **Status lights** that don't match real activity.

**Limited practical value**
- Offline maps, gamification, graph visualization, code assistant, vision (on this Mac), learning projects.

---

## I. First three experiments

All three are small, reversible, and fit v0.5/v1.0. None touches retrieval, so none conflicts with D-005.

### Experiment 1: Personality pass
- **Goal:** Q noticeably funnier and more willing to push back, with no loss of honesty or speed.
- **Components:** `persona.md` only. Roughly 8–12 new example exchanges: teasing, pushback, changing his mind, serious moments.
- **Difficulty:** S.
- **Success criteria:**
  - Jacquez prefers the new persona in a blind comparison against the current one on about 20 prompts, some heard aloud (D-008 method).
  - Honesty sampling passes: no claims to have checked or done things.
  - No reused example lines.
- **Measurements:** p50/p90 first audio (the persona adds prompt length but stays cached); average reply length.
- **Rollback:** revert `persona.md` (one git commit).

### Experiment 2: Model check
- **Goal:** find out whether a slightly bigger model makes Q smarter and funnier within the budget. If not, settle on llama3.2:3b with evidence.
- **Components:** one candidate in the ~4B range that Ollama offers (for example a current Gemma or Qwen 4B; pick what's current at test time), the existing benchmark and blind comparison pages, the model setting.
- **Difficulty:** S–M (mostly test time).
- **Success criteria:** the candidate wins a clear majority of blind comparisons **and** meets every budget in section E (p90 ≤ 2.7 s, memory pressure green, no swap growth over 30 turns). Otherwise llama3.2:3b stays.
- **Measurements:** p50/p90 cold and warm, model RAM, memory pressure, swap, honesty sampling.
- **Rollback:** change the model name back; delete the candidate with `ollama rm`. Never run both in one conversation.

### Experiment 3: Tool layer with a calculator
- **Goal:** prove the v0.5 pattern (matcher → code validates → runs → checks → logs → Q reports) on the safest possible tool before it opens apps.
- **Components:** deterministic matcher ("what's 18% of 64"), a pure arithmetic function (no `eval`), an activity log table in the existing store, a persona line saying Q uses the calculator for math.
- **Difficulty:** S–M.
- **Success criteria:**
  - Correct on a 30-question arithmetic set where the bare model gets some wrong.
  - Every call appears in the activity log.
  - Non-math messages are never captured by the matcher.
  - No latency added to non-math turns.
- **Measurements:** accuracy with and without the tool; matcher false-positive rate; first-audio latency on math turns.
- **Rollback:** a feature switch turns the matcher off; the table can be dropped.

*Free side check, any time:* confirm Node's built-in SQLite has FTS5 on this Mac (one query, no download). It costs nothing and removes a v1.1 unknown.

---

## J. Decisions for Jacquez

**Genuine decisions** (each becomes a DECISIONS.md row on approval)
1. **Adopt this plan's architecture**: five parts, one model, rules C1–C6.
2. **Move Curiosity Mode (D-041) to v1.2, after the knowledge library in v1.1.** This replaces "after v0.4" and keeps D-005 intact. *Alternative:* a D-005 exception row to build the library before v0.5. Not recommended: v1.0 doesn't need it, and it's the riskiest feature.
3. **Voice path:** Samantha for v1.0; Personal Voice experiment in v1.1; drop the search for a new neural voice.
4. **The cut list:** 14 vision, 15 code assistant, 16 learning projects, 21 graph system, 23 health, 25 maps, 29 gamification.
5. **Personality as presets, not sliders.**
6. **Q never speaks unprompted.** Discoveries wait for you to start a conversation.
7. **Approve the three experiments**, and the order: 1, then 3 (with v0.5), with 2 run when convenient.

**Minor details** (Claude Code proposes; no separate decision needed)
- Exact passage cap, Studio file names, activity log columns, which 4B candidate, preset names, and the wording of the CHECKLIST.md fix.

---

## After approval

Nothing is implemented from this document directly. Once Jacquez approves (all of it or parts), the first change is docs only:
- Proposed rows for the approved items in J.
- An update to D-041's schedule.
- The CHECKLIST.md v0.4 heading fix.

Implementation prompts for Claude Code come after that, one experiment at a time.
