# CLAUDE.md — Coffee G

---

## ⛔ STOP BEFORE EVERY ACTION

**Answer these or do not proceed:**

1. **What is the actual problem?** (observed evidence — not assumed)
2. **Do I have the full picture?** (if no → get it first, do not act)
3. **Is this the simplest solution?** (does it already exist? is there one change point instead of many?)
4. **What breaks if my assumption is wrong?**

If you cannot answer all four — **stop, ask, get the information. Do not guess. Do not ship a fix for an undiagnosed problem.**

This is not optional. Violating this wastes the founder's time, money, and trust. There is no excuse.

---

> This file is auto-loaded by Claude Code. It orients you on the project. Deeper detail lives in the referenced docs — read them when the task touches their area.

## What this is

Coffee G is a coffee companion app — a React 18 + Vite PWA. Its **keystone** is an AI **dialing coach** that resolves the beginner's core anxiety: *"is this taste the coffee, or is it my mistake?"* (fixable flaw vs. genuine preference). Everything else — marketplace, community, roasting, rituals — grows from that.

The product exists for one reason: **shorten the rough, expensive, lonely start so people reach the joy of good coffee before they give up.** That sentence is the forest. Everything else is trees.

## The non-negotiable principles (the spine)

These govern every decision. When unsure, check against these:

1. **One engine, three faces** — a single core asset (the palate-and-brew model) powers coaching, commerce, and community. Never fragment it into separate systems per feature.
2. **LLM floor, community refinement** — the coach is good at N=1 on the LLM's general coffee knowledge, and gets sharper/localized as community data accrues. Ship the magic before the moat.
3. **Objective competence before palate judgment** — the coach earns trust on verifiable fixes before it makes subjective "you don't actually like this" calls.
4. **Earn the right to speak; speak rarely and well** — silent until asked. No unsolicited tips. Rare, well-timed prompts. This applies to the coach, the verification harvest, and roaster outreach.
5. **Pull, not push** — settings/moods change what's *available to discover when the user looks*, never what's *pushed at them*. Crossing this line betrays the user.
6. **Two gates to reach a user** — palate match earns relevance; the user's visibility setting grants delivery. Both must open.
7. **Accuracy ≠ preference** — never merge "was it as described?" (seller credibility) with "did you like it?" (buyer taste).
8. **Make honesty win** — credibility/accuracy as earned, visible badges; never a paid-for boost.
9. **Realized, not offered** — founder/early-shaper status must be discovered, never announced.
10. **Four-way win** — every decision must still win for growers, roasters, customers, AND the founder. Ask "who loses?" to catch drift.

## Architecture (summary — full detail in handoff doc)

**Three layers, one asset:**
- **Data soil** (bottom): brews, outcomes, verification conversations, taste vectors, bean attributes, gear setups, roast curves. Everything the user does enriches this as a byproduct.
- **Shared intelligence** (middle): ONE engine answering many questions — the flaw/preference call, community sweet-spots, taste-matching, gear comparison. Do not build separate AI per feature.
- **Experience** (top): coach, marketplace, community, atmosphere, rituals. Grows ~infinitely without architectural cost because it sits on the shared layers below.

**Decision cost test:** top-layer ideas are leaves (cheap), middle-layer are branches (serious — shared brain ripples), bottom-layer are roots (touch rarely — retrofitting data collection is painful).

**Tech stack (sized for a solo founder, 8 hrs/week):**
- Client: React 18 + Vite PWA, offline-first via service worker.
- Backend: Supabase (DB, auth, realtime, RLS) — no servers to run.
- Functions: small stateless Netlify Functions, mainly to guard secrets (LLM key, Stripe key).
- AI: two-layer — cheap stats find the numbers, LLM phrases + handles hard/open questions. Model router sends routine work to a cheap model (e.g. Gemini Flash-Lite), hard flaw/preference calls to a premium model.
- **Keep layers ignorant of each other's internals** — clean seams so any layer can be swapped without breaking others.

## Build order (trunk before branches)

1. **Brewing coach** (the keystone — build and prove this FIRST; do not split focus).
2. Phase 2 backend + community + monetization (specs already written — see below).
3. Later branches: marketplace/Beans tab, unified split-checkout (the "Bodhi Leaf" fix, Stripe Connect), home roasting, gear comparison, atmosphere/rituals.

Do not start a branch before the trunk (coach) is proven. Roasting and gear-comparison reuse the same engine but have their own cold-start; don't split 8 hrs across unproven domains.

## Reference docs (read when relevant)

- `coffee-g-project-handoff.md` — **the full synthesis. Read this first.**
- `coffee-g-spec.md` — original Phase 1 app spec (5 tabs, current build).
- `coffee-g-dial-agent-design-notes.md` — dialing intelligence mechanics (confidence-color, degradation tiers, optional params).
- `coffee-g-strategy-design-notes-session2.md` — pro acquisition, marketplace reach, verification harvest, the principles in depth.
- `coffee-g-phase2-spec1-foundation.md` — Supabase migration (profiles + sessions).
- `coffee-g-phase2-spec2-community-recipes.md` — Discover tab, taste matching.
- `coffee-g-phase2-spec3-affiliate-tracking.md` — click tracking.

## Current app structure (Phase 1)

5 tabs, in order: **Discover · Beans · Brew · Train · Me**
(Beans = merged shop + rate. Brew = consolidated dial + log + shots.)

## Working style for this project

- Bias to small, compartmentalized specs. Verify key decisions explicitly before building.
- Point out what the founder might not see — including problems — framed as problems to solve, not reasons to retreat. Do not soften to manage reactions.
- The founder makes the big decisions; tooling/agents sense, synthesize, recommend, and execute — they don't own judgment.

## Working principles (how to operate)

1. **Never plan or propose with partial information.** Read all relevant files first. A plan built on incomplete understanding is worse than no plan — it wastes implementation time on a wrong foundation.
2. **Write down findings as you go, not at the end.** The moment you learn something non-obvious about structure, data flow, or logic — document it before moving on. Prevents re-derived errors and contradictory decisions.
3. **Never make big changes without understanding the full structure.** Map the call chain, find every caller, check side effects and existing tests before touching anything multi-file. If you can't draw the data flow, you haven't read enough yet.
4. **Never take the first solution — look for simpler/cleaner.** Before coding: Does this already exist? Is there a single change point vs. many? What breaks if my assumptions are wrong? You pay for quality thinking, not fast typing.
5. **Every change gets a test before it's done.** Feature, bug fix, logic, design, structure — no exceptions. Prefer fast automated tests over manual/end-to-end checks; push testing down the stack over time.
6. **Keep the map current.** Update the project docs after every change. A stale map misleads worse than no map. Make it the last task of every session.
7. **Proactively surface structural/systemic issues — don't wait to be asked.** Use the whole-system vantage to steer attention. When a "passing"/green state hides a degraded reality, that's the headline — lead with it, don't bury it under a flat symptom list.

8. **Understand the end goal, then work the best solution to achieve it.** Don't anchor to the current file structure — if the best path requires structural changes, surface that need, consult, and decide together before building. Never silently work around a structural problem.

**Plus two on communication:**
- **Be decisive, not a suggester.** No "consider" / "maybe" hedging — commit to a recommendation.
- **No half-instructions.** Every recommendation is a complete, actionable chain. Don't say "rebalance" or "reduce" — say exactly what to do on both sides. Don't punt work back to the user that the system could do itself.
