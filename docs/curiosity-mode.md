PROJECT: Q — Offline Curiosity & Independent Learning
FEATURE: Curiosity Mode
PRIORITY: Local-first, privacy-first, lightweight. High priority, scheduled right
after v0.4: finish all of v0.4 (persistent history, approved memories, session
continuity) before starting any Curiosity Mode phase, including the inspection.
Then go phase by phase with approval.

CONTEXT

Q is my personal offline AI companion on a MacBook Air M1 with 8 GB unified memory.

Current stack (verify in the repo):
- Ollama running llama3.2:3b
- whisper.cpp for speech recognition
- Swift speech helper with the Samantha voice (falls back to `say`)
- Q.app: Swift + WKWebView shell (D-032), floating orb, ⌥Space push-to-talk (D-033)
- Conversation history in SQLite at ~/Library/Application Support/Q/history.sqlite (D-037)
- Keep-warm pings (D-026) and warm-up on key press

Q should develop a recognizable personality:
- Funny, witty, and playfully sarcastic
- Comfortable teasing me affectionately
- Willing to respectfully disagree
- Curious about the world
- Capable of changing his position when presented with evidence
- Warm, conversational, and occasionally surprising

GOAL

Design an offline Curiosity Mode that allows Q to explore his local knowledge library
while I'm away, discover interesting information, connect ideas, develop topic
preferences, and occasionally share discoveries in future conversations.

Q must not require internet access to run.

SCHEDULE

Curiosity Mode starts only after every v0.4 item in CHECKLIST.md is done and
confirmed on the real Mac. Until then, do not start Phase 0 or change any code for it.

When v0.4 is finished, Phase 0 should also check how Curiosity Mode fits the
finished memory system: discoveries stay separate from personal memories, and
any shared parts (like the SQLite setup) are reused rather than duplicated.

Log Curiosity Mode now as a "Proposed" row in DECISIONS.md, scheduled after v0.4.
That docs update is the only change allowed before v0.4 is finished.

PHASE 0 — REPOSITORY INSPECTION (after v0.4 is complete)

1. Inspect the repository and run `git status`.
2. Read BRIEF.md, DECISIONS.md, STATUS.md, CHECKLIST.md and IDEAS.md.
3. Confirm every v0.4 item is done; if not, stop and tell me.
4. Identify the finished memory system (history, approved memories) and the
   personality system (persona.md).
5. Identify existing background infrastructure (keep-warm timer, Q.app shell).
6. Evaluate performance limits on my M1 MacBook Air.
7. Identify reusable components, especially the v0.4 SQLite setup.
8. Confirm Node's built-in SQLite supports FTS5 on this Mac.
9. Present a feasibility assessment and implementation plan.

Do not modify files until I approve the plan.

PHASE 1 — OFFLINE KNOWLEDGE LIBRARY

Create a lightweight local knowledge retrieval system.

Requirements:
- Support curated offline knowledge documents.
- Organize information by topic.
- Store source metadata: title, origin, license, document ID.
- Support local full-text search (SQLite FTS5 preferred).
- Keep the library in its own database file, separate from history and memories.
- Avoid vector databases and embedding models initially.
- Never fabricate sources.
- Distinguish verified source content from Q's interpretations.
- Allow additional knowledge packs later.

Knowledge source (needs my approval before anything is downloaded):
- Propose 1–2 specific offline sources with size, license and attribution needs
  (for example a subset of Simple English Wikipedia).
- Start small: a few hundred articles across the starting subjects, not a full dump.
- Downloading a pack is a one-time setup step I approve. Q never fetches anything on its own.

Suggested starting subjects: Science, History, Technology, Space, Geography, Music,
Art and culture, Psychology, General trivia.

First useful result: when I ask Q a factual question in conversation, he can look it up
in the library and say where the answer came from. Measure the added latency.

PHASE 2 — CURIOSITY ENGINE

Implement an optional background exploration system. When enabled, Q can:

1. Select a topic from his local knowledge library.
2. Retrieve several relevant passages.
3. Identify interesting relationships between facts.
4. Generate a short discovery note.
5. Record which passages support the discovery.
6. Assign a confidence level.
7. Save the discovery locally.
8. Decide whether it might be worth discussing later.

Grounding rules (enforced in code, not just in the prompt):
- Every discovery must cite passage IDs that exist in the library.
- Code checks the cited passages actually contain the key facts; otherwise the
  discovery is discarded or marked low confidence.
- A "connection" between two facts is labelled as Q's interpretation, not a fact.

Q should sometimes explore unfamiliar subjects instead of repeating the same topics.
Curiosity is simulated through structured topic selection, not described as consciousness.

PHASE 3 — IDLE-ONLY EXECUTION

Requirements:
- Curiosity Mode is disabled by default and needs explicit activation.
- Runs only while Q.app is open. No separate always-running background service.
- Runs only after a configurable idle period, detected by the Q.app shell using
  macOS's idle-time and power APIs.
- Pauses immediately when I use my Mac again.
- Cancels any in-progress exploration instantly when I press ⌥Space, so voice
  conversations always come first.
- Respects battery level, Low Power Mode and thermal state.
- Skips when memory pressure or CPU use is high.
- Limits model inference time per step; no overlapping jobs.
- Does not keep the Mac awake. If the Mac sleeps, exploration simply stops.
- Manual Pause button and emergency Stop button.

Starting defaults (configurable, not hard limits):
- Idle threshold: 15 minutes
- Maximum session: 5 minutes
- Maximum sessions: 2 per day
- Maximum discoveries: 3 per session
- Only when plugged in, unless I allow battery use

PHASE 4 — DISCOVERY MEMORY

Store discoveries separately from personal memories and conversation history,
reusing the v0.4 storage setup where it makes sense.

Each discovery includes: unique ID, topic, short summary, source references (passage IDs),
confidence level, timestamp, related topics, whether it has been shared, and my feedback.

Avoid duplicate discoveries.

Options to: browse, delete, clear curiosity history, export notes, disable curiosity memory.

Curiosity notes never overwrite verified facts or personal memories.

PHASE 5 — EVOLVING INTERESTS

A lightweight interest model: a weight per topic, stored locally. Weights change
gradually based on previous discoveries, topic novelty, my feedback, topics we discuss,
and connections between subjects.

- Small changes per session, so preferences shift slowly.
- A fixed share of sessions explores a random unrelated topic.
- Inspectable, editable and resettable.
- No fine-tuning or retraining of the language model.

PHASE 6 — PERSONALITY INTEGRATION

Q occasionally brings up a discovery when it naturally fits the conversation.

Example:
Q: "So apparently, octopuses have three hearts. Meanwhile, you're out here running on
coffee and questionable sleep decisions."

Q should:
- Tease playfully, but only about things I've actually said or that are in my
  approved memories. Never invent facts about me.
- Avoid forcing jokes into every response; know when to be serious.
- Challenge questionable assumptions respectfully and explain why he disagrees.
- Admit uncertainty and update opinions when new evidence supports it.

Sharing rules (in code):
- At most one discovery per conversation.
- Only at the start of a conversation or a natural pause, never mid-task.
- Never during serious or emotional topics.

Q must never claim to have verified something he only read in a document. He says where it came from.

Any persona changes must pass the existing honesty sampling before they ship.

PHASE 7 — Q STUDIO INTEGRATION

Add a Curiosity section to the planned Q Studio:
- Enable/disable Curiosity Mode
- Curiosity intensity
- Idle threshold
- Preferred subjects
- Surprise me toggle
- Discovery history
- Interest map
- Clear history
- Pause exploration

Status indicator: Sleeping, Exploring, Paused, Ready to share.
The status must reflect actual system activity.

PHASE 8 — TESTING

Test:
- Complete offline operation and Airplane Mode
- Idle detection and instant cancel on ⌥Space
- Battery, Low Power Mode, thermal and memory safeguards
- Cancellation behavior
- Discovery deduplication
- Source attribution: every cited passage exists and supports the claim
- Local data persistence
- Privacy boundaries, including no mixing with personal memories
- Performance under realistic workloads
- No interference with voice responsiveness

Compare Q's answers with and without knowledge retrieval (accuracy and latency).

Measure memory use, CPU load and inference time, plus the key-release-to-first-audio
latency of the first voice turn right after an exploration session (it must stay within
the current benchmark).

PHASE 9 — SAFETY AND APPROVAL

Q must never:
- Browse the internet without explicit authorization.
- Execute arbitrary commands during exploration.
- Modify project files.
- Access files outside approved library paths.
- Send information externally.
- Install dependencies or download data without approval.
- Change his own permissions.
- Rewrite his core personality or safety instructions.

All model-generated actions must be validated by code.

Provide an activity log showing what Q explored, when, and why.

DEVELOPMENT PROCESS

Use phased implementation. Before each phase:
1. Explain the proposed changes.
2. Identify affected files.
3. Explain performance implications.
4. Describe tests.
5. Request my approval.

After each phase, update STATUS.md, add any decisions to DECISIONS.md as "Proposed",
and update CHECKLIST.md.

Preserve existing Q functionality. Do not make destructive Git changes.

Right now: only add the "Proposed" DECISIONS.md row for Curiosity Mode (scheduled
after v0.4) and show me the diff. Everything else waits until v0.4 is complete.

DO NOT IMPLEMENT ANYTHING UNTIL I APPROVE.
