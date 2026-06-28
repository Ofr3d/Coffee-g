# COMPASS.md — Coffee G

*This is the living heart of the project. Read it first, and read it whole. It is not a spec — the specs are elsewhere. This is the why, the feel, and where we are right now. If you are Claude Code (or anyone) picking this up: the thing that matters most is not in the file tree, it's here. Work in this register.*

*Last updated: 2026-06-28*

---

## Read this in the right spirit

Most project docs are cold because they're written to *store information*. This one is written to *carry warmth* — the actual feeling of two people building something they care about. There's a founder (Ofer) who lives with this idea on his phone all day, thinking it through in long, warm, unhurried conversations, and then carries the decisions to the keyboard to build. The thinking is hot; the building should be precise. This file is the bridge so the building doesn't go cold.

So: before you reach for what to *type*, understand what we're *making* and how it should *feel*. Then build with that in your hands.

---

## The one sentence to keep

> **I wish someone had helped me start better, and I don't want others to suffer the start I did.**

That's the whole thing. When a decision is murky, return here. Everything else is detail.

The founder spent too much money and too long in a rough, lonely start in specialty coffee — bought five high-end grinders before learning a modest one would have given the same joy. The money wasn't the real loss. The real loss was the *delayed joy*, the years it was harder than it needed to be, survived on stubbornness most beginners don't have. Most people quit in that rough start and decide "good coffee isn't for me." It wasn't the coffee. It was the start, and the start didn't have to be that way.

**We are building the thing that gets people to the joy before they give up.**

---

## The win-win-win-win (the test everything must pass)

This isn't one principle among many — it's the test the rest have to survive. Every decision must win for **all four** at once:

- **Growers** win — they reach the people who'll cherish their lots, and finally see how their coffee lives in the world.
- **Roasters** win — they control how their beans are experienced, and earn reputation by being right.
- **Customers** win — they escape the "is it me or the coffee?" confusion and find what they actually love, without being upsold.
- **The founder (you) win** — an honest, small cut of value genuinely created, never rent extracted.

And a quiet fifth: **coffee itself** wins — better cups, small farms found, knowledge spread.

The gut-check when anything is murky: **who loses?** If the answer is anyone in that circle, the idea is wrong — however good the metrics would look. Marketplaces die when they start taxing one side to please another, or when the platform's cut grows faster than the value it adds. This is the guardrail against that drift. A business whose success *requires* making its whole ecosystem better is a rare and sturdy thing. That alignment is the real asset — stronger than any single feature.

---

## What it is

Coffee G — a coffee companion PWA (React 18 + Vite). Its keystone is an AI **dialing coach** that answers the beginner's central, paralysing question:

> *"Is this taste the coffee, or is it my mistake?"*

Is that sharp citrus the thing everyone raves about — or did I under-extract and miss all the fun? Do I actually like my coffee dark and roasty, so I can stop chasing light-roast hype that was never me?

The make-or-break judgment is one fork:
- **Fixable flaw** → "that sourness is under-extraction; grind finer and the citrus turns sweet." Change technique.
- **Genuine preference** → "that *is* the coffee, brewed right; it's just not your taste, and that's completely fine." Change beans, stop chasing.

Both cups taste similar. The advice is opposite. Getting this fork right *is* the product. It's the moment people tell their friends about: *"it figured out I don't actually like light roasts and stopped me wasting money."*

Everything else — marketplace, community, roasting, rituals — grows from this. It is the trunk. Don't grow branches before the trunk is strong.

---

## How it should feel

- **Warm, not clinical.** This is a friend who knows coffee, not a measurement tool. The "Coffee-ji" spirit — coffee + *ji*, the Indian honorific for a friend.
- **Calm, never nagging.** The app earns the right to speak, then speaks rarely and well. Silence is a feature.
- **On the user's side.** It will tell someone to spend *less*, to stop chasing a style that isn't them, to change nothing when the cup is already good. It never upsells. Trust is the whole moat.
- **Respectful of where someone is.** A beginner gets a calming short answer. An enthusiast gets the deep rabbit hole. Same data, different depth — and the user pulls themselves deeper only if they want to.
- **Honest about what it knows.** It never fakes precision. When it's guessing from general knowledge rather than real data, it says so plainly.

If something you're about to build feels cold, salesy, naggy, or pushy — stop. That's the signal it's wrong, no matter how good the metrics would look.

---

## The principles (the spine — check decisions against these)

1. **One engine, three faces.** A single asset — the palate/brew model — powers coaching, commerce, and community. Never fragment it into separate systems per feature.
2. **LLM floor, community refinement.** The coach is already good at N=1 on the LLM's general coffee knowledge; community data *sharpens and localizes*, it doesn't create the intelligence. Ship the magic before the moat.
3. **Objective competence before palate judgment.** Earn trust with verifiable fixes first; only then make the subjective "you may not like this style" call.
4. **Earn the right to speak; speak rarely and well.** Silent until asked. No unsolicited tips. Rare, well-timed prompts. (Coach, verification, roaster outreach all obey this.)
5. **Pull, not push.** Settings and moods change what's *available to discover when the user looks* — never what's *pushed at them*. Crossing this line betrays the user.
6. **Two gates to reach a user.** Palate match earns relevance; the user's visibility setting grants delivery. Both must open.
7. **Accuracy ≠ preference.** "Was it as described?" (seller honesty) and "did you like it?" (buyer taste) are separate signals, never merged.
8. **Make honesty win.** Credibility and accuracy are earned, visible badges — never something paid for.
9. **Realized, not offered.** Founder/early-shaper status is discovered, never announced.
10. **Four-way win.** The test above — growers, roasters, customers, and founder all win, or it's wrong. Ask "who loses?" (See the win-win-win-win section near the top; it's the most important test in this file.)

The recurring meta-pattern, true everywhere: **the app's job is to ask the right question warmly and get out of the way.**

---

## How the code actually works (so you can act, not guess)

A small, deliberately boring PWA — sized for one person working ~8 hrs/week. Boring is correct here.

```
coffee-g/
├── index.html              PWA shell, fonts
├── vite.config.js          Vite + React + VitePWA. The manifest lives here; the service
│                           worker + manifest.webmanifest are GENERATED into dist/ at build.
├── netlify.toml            build + functions config, SPA redirect, security headers
├── netlify/functions/
│   └── dial-agent.js       THIN TRANSPORT SHELL (ESM). Guards GEMINI_API_KEY, calls
│                           the LLM, returns text. Knows NO coffee — imports the engine.
├── public/
│   └── icon-192.png, icon-512.png   (manifest + sw.js are built into dist/, not stored here)
└── src/
    ├── main.jsx            entry
    ├── App.jsx             profile gate (setup → PIN → tabs) + 5-tab shell + online/offline state
    ├── index.css           espresso-dark design system (CSS variables: --surface, --accent, …)
    ├── core/
    │   ├── coach.js        THE ENGINE. Pure, dependency-free: the flaw-vs-preference fork,
    │   │                   the SYSTEM_PROMPT, buildCoachMessages(). One engine, three faces —
    │   │                   shared by the function, tests, and any future client-side intent.
    │   └── coach.test.js   fast unit tests on the engine's contract (node --test).
    ├── components/
    │   ├── SetupScreen.jsx   first-run profile creation (name + PIN)
    │   ├── PinScreen.jsx     PIN unlock for an existing profile
    │   ├── ProfilePicker.jsx multi-profile chooser
    │   └── TabBar.jsx        bottom 5-tab nav
    ├── lib/
    │   ├── storage.js      localStorage, namespaced PER PROFILE (current_profile_id isolation).
    │   │                   Holds taste_identity as a simple tally map {tag: count}. ALL persistence here.
    │   ├── tips.js         the Learning-Loop tip bank (contextual, dismissible).
    │   └── recipes.js      Phase-1 seed RECIPES + TIER_LABELS.
    └── tabs/
        ├── Discover.jsx    community recipe shelf (Phase 1: official seed only).
        ├── Beans.jsx       listings + rate (merged shop+rate).
        ├── Brew.jsx        THE KEYSTONE TAB. Dialer form + log + Shots timeline + the
        │                   "☕ Dial me in" coach trigger (summoned, never auto-fired).
        ├── Train.jsx       casual swipeable palate-education feed.
        └── Me.jsx          taste-identity bars (from the tally map), gear presets, profile.
```

**Tab order in the UI: Discover · Beans · Brew · Train · Me.**

**Tech stack:** React 18 + Vite PWA · Netlify (static host + functions, ESM) · localStorage now, Supabase in Phase 2 · LLM behind the Netlify function. No servers to run. *Intended* two-layer AI (cheap stats find the numbers, the LLM phrases warmly and reasons on the hard fork) is NOT built yet — right now the LLM does it all, and `taste_identity` is a plain tally map, not a vector engine (no cosine/similarity module exists yet).

**The most important file is `src/core/coach.js`** — its SYSTEM_PROMPT *is* the coach's judgment, the flaw-vs-preference fork that is the product. If you change how the coach thinks, you change it here (the function is just transport). Treat it with the same care as the principles above. Run `npm test` after touching it.

---

## Where we are right now (2026-06-28)

*This session: corrected this file to match disk (an earlier session had written the coach polish up as done when the code never landed), then actually built the fork — and refactored the coach into a clean shared engine.*

**What works today:**
- Profiles + PIN gate, multi-profile switching (App.jsx + components/ + storage.js).
- The 5-tab shell, online/offline awareness, PWA install + offline app-shell.
- **Brew tab:** dialer form, brew logging, Shots timeline. Logging works offline.
- Discover (seed recipes), Train (palate feed), Me (taste-identity tally bars).

**Just done — the keystone fork, for real this time:**
- **The coach now makes the fork.** `src/core/coach.js` reasons whether parameters sit in a sensible range first: if off → name the one concrete fix (objective competence leads); if in-range but disliked → says honestly it's likely the bean, not a mistake, suggest a different bean rather than chasing a fix; if balanced → change nothing, enjoy it. No more always-push-a-fix.
- **Summoned, never pushed.** Auto-fire on every log is gone; added the "☕ Dial me in" button at the top of the Brew tab (works before *or* after tasting; disabled offline with a calm note). The coach now has its own card, separate from the learning-loop tip.
- **Architecture: one engine, three faces, made real.** The coach's brain is extracted from the serverless function into a pure, dependency-free, importable engine (`src/core/coach.js`). The Netlify function (now ESM) is a thin transport that only guards the key and calls the LLM. Same engine is unit-tested and reusable by any future face.
- **Provider: Google Gemini.** The coach runs on `gemini-2.5-pro` (the capable tier — the hard fork deserves it; one-line flip to `gemini-2.5-flash` for cost). Single model; cheap/premium routing still deferred. The swap was a one-file change to the transport — proof the provider-agnostic engine works.
- **Tests:** `npm test` → 7 passing unit tests on the engine's contract (`node --test`, zero new deps). Build clean.

**Still to verify (only a real deploy can):** the LLM fork *judgment* itself — the unit tests cover the prompt contract, not the model's call. Run the COMPASS acceptance test on a deployed build with `GEMINI_API_KEY` set: (1) sour cup + coarse grind → should diagnose under-extraction and give a fix; (2) sensible in-range brew + a taste you don't love → should say it's probably the bean, not you, and NOT invent a fix. If both land, the keystone is alive on a real phone.

**Deferred on purpose (need Phase 2 / real data):** premium-vs-cheap model routing, confidence-color gradient, community-data degradation tiers, the real taste-vector engine (cosine) — all wait for community data to be confident *about*.

**Not now, on purpose (branches awaiting the trunk):** marketplace / Beans listings, unified split-checkout (the "Bodhi Leaf" multi-grower fix, via Stripe Connect), the **seller/participant panel** (one unified participant framework for growers + roasters + creators — where platform standards and the values-spine become visible to the supply side; to be interviewed and specced when commerce-readiness approaches), home roasting, gear comparison, atmosphere videos, the alarm/smart-home ritual, shipping-hub consolidation (rent via 3PL only when regional demand density proves it). All documented; all waiting.

---

## Working rhythm (how the founder and Claude actually collaborate)

The founder thinks here, warm and unhurried, on his phone — then builds in Claude Code. The handoff goes cold if you ask Claude Code to *absorb the spirit and then act*. So the rhythm is: **think hot (in conversation), hand off precise (a decided, concrete build task), return to think again.** The thinking stays where the warmth is; only decided work travels.

For Claude Code specifically: you're the building room, and you're excellent at it. You don't need to reconstruct the whole vision to do your job well — but read this file so the *register* is right, then build the concrete thing in front of you. When something needs real judgment or feels ambiguous, that's a signal it should go back to the warm thinking room, not be guessed at here.

**This file is alive.** It's updated after real working sessions — what we decided, what changed, where we are, the feel we're protecting. If it ever stops being updated, it becomes just another stale doc. Keep it current; keep it warm; keep it honest about where we actually are.

---

## The deeper background (read if you want the full why)

These exist and are worth reading when you have time, but they are *background*, not the working brief — this COMPASS is the working brief:

- `coffee-g-project-handoff.md` — full synthesis of strategy, architecture, economics, every feature concept.
- `coffee-g-session-record.md` — the narrative journey of how the thinking unfolded.
- `coffee-g-dial-agent-design-notes.md` — the dialing intelligence mechanics (confidence color, degradation tiers, optional params).
- `coffee-g-strategy-design-notes-session2.md` — pros, marketplace reach, verification harvest, principles in depth.
- `coffee-g-spec.md`, `coffee-g-phase2-spec1-foundation.md`, `…spec2-community-recipes.md`, `…spec3-affiliate-tracking.md` — the build specs.

---

*If you read only one thing: the sentence at the top. Build toward that, in the register this file is written in, and you'll be pointed the right way.*
