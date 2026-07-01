# UX Spec — Brew Flow, Gear & Bean Libraries, Setups & the Impression Layer

*A decided design brief, captured from a hot-room session so it hands off to the build precisely. Read `COMPASS.md` first for the spirit; this is one branch of it, specced. Status: **decided enough to build**, except the few open items flagged at the end.*

> **Build status (2026-07-01):** the foundations are now shipped — the **gear library** (Profile is the single source of hardware; Brew draws from it), the **bean bank** (with roast level), **favorites/setups** (named gear+bean+params combos, referenced by id, recency-ordered), a **blank-by-default** dialer (no phantom data), **phased pour-over** (Bloom/1st pour/End), and the **impression layer** (enjoyment verdict + optional good/bad + our own descriptor word bank). Still on the roadmap below: the full cup-first "what cup?" catalog-as-data, the auto success prompts, milk-drink params, the consent layer, and server-side impression mining.

*Written: 2026-06-28*

---

## The governing constraint: two flicks to recall

A returning user pulls his proven setup in **two flicks of a finger**. Everything below bends to that. The principle underneath it: **pay the cost once, slowly, ambiently — so the cost paid every brew drops to near zero.** Building the gear library and saving a setup is the rare, unhurried cost. Recall is the sacred, frictionless one.

---

## Two libraries live in Profile

The user builds these **at his own pace** — never a setup wall, never a blocker to brewing. A beginner brews with one grinder and one dripper; the libraries fill in over months. This is *pull, not push*, applied to setup itself.

### 1. Gear library
Everything he brews with: grinders, brewers, kettles, scales, milk gear. Each item is a stored object with a **stable id**, a **category**, and a **status** (`active` / `retired`).

- **Only brewers carry a cup-type compatibility tag.** Grinders, kettles, scales are universal — they work for anything, so they're never filtered, just picked.
- **Retire, don't delete.** "Stopped using it" → shelve it (`status: retired`). The active list stays tidy; nothing is lost.
  - Presets reference gear **by id**, never by typed name — so a setup that used a shelved item doesn't break, it goes **dormant**: greyed, *"uses shelved gear: Comandante — bring it back?"* One tap un-shelves and the setup is whole again.
  - A true permanent delete may exist but is **rare and hidden**, and must warn *"this drops N saved setups."*
  - **Make shelving effortless and its payoff (a clean menu) visible — but never nag him to tidy.** Nagging breaks *speak rarely and well*. The encouragement is the easy gesture, not a prompt.

### 2. Bean library
Beans are reused across the ~20 brews from one bag, so they're stored objects too: **origin · name · process · roast level**.

- Re-choose a stored bean in **one tap**; or add a new one with those four fields.
- Pays off three ways: no retyping a bag mid-way; the coach gets **structured** bean facts (roast level + process are exactly what the flaw-vs-preference fork reasons about); and the beans a user logs and loves are the **seed of the marketplace** later. Same action, three faces.

---

## The Brew flow (cup-first)

Tapping **Brew** for a *new* brew runs this sequence. Each step narrows the next.

```
1. WHAT CUP?     espresso · latte · americano · pour-over · …
                 the DRINK, in human language ("I want a latte"),
                 NOT barista jargon. This choice drives everything below.

2. EQUIPMENT     only gear that fits this cup appears — pick from HIS gear.
                 (latte also surfaces milk/steam gear a pour-over never would.)

3. BEANS         one tap from his stored beans, OR add new
                 (origin · name · process · roast level).

4. PARAMETERS    the rest — dose, ratio, temp, grind, time… method-aware,
                 sensible defaults per cup type.

5. IMPRESSIONS   how the cup FELT. This is what the coach reads, and the
                 fuel for the community data layer (see below).
```

**Cup type drives equipment AND parameters**, not just which brewer shows. Espresso and americano share gear (machine + grinder; americano adds hot water); a **latte** adds milk gear and a milk-texture/temp parameter.

### Cup types are DATA, not code
The cup-type list is an **extensible catalog the app reads**, not a list baked into the code. Each entry declares: its relevant **gear categories**, its **parameters**, and its **impression vocabulary**. Consequences:
- A new drink trend slots in as a config entry — no flow rebuild, no engine change.
- Later, cup types can be **pushed from the server**, so the app rides trends without an app-store release per fad.
- This is a **root, not a leaf** — get the catalog shape right now; retrofitting is painful.

### The user curates his cup-type menu
In Settings/Profile he **checkboxes the cup types he actually makes**, and **sets their order**. The Brew cup-type picker shows only those, in his order. Per cup type he can **add or hide** fields/gear — but this is an **advanced, optional** layer over good defaults. Beginner touches nothing and gets a sensible form; enthusiast tunes bloom-to-the-second. *Same data, pulled to the depth that serves you.*

---

## Setups (saved presets) — the two-flick door

Brew has **two doors into the same dialer**:

```
BREW opens →

  ┌─ MY SETUPS (the two-flick door, for returners) ───────────┐
  │  [Kalita · Ethiopian Yrg bliss]  [Dark espresso]   …        │
  │   tap → cup type, gear, beans, params ALL load →            │
  │   a PRE-FILLED, glanceable dialer (he eyeballs, then brews) │
  └────────────────────────────────────────────────────────────┘

  ┌─ NEW BREW (the create door) ──────────────────────────────┐
  │  the cup-first flow above. How setups are BORN.            │
  └────────────────────────────────────────────────────────────┘
```

- **A setup = a named { cup type + gear combo + dialed params + the bean/bean-style it was for }.** Named freely, in his words ("Kalita · Ethiopian Yrg bliss"). It's not "which two devices" — it's *the whole starting point that finally worked for this kind of coffee.*
- **Born from a nailed cup.** After a good result: *"Nice — save this as a setup?"* → he names it → permanent two-flick recall, forever. The moment of success mints the shortcut. (A manual "save this setup" is also always available; never forced, never naggy.)
- **Living, not frozen.** Beans age, taste sharpens. After a better cup on the same setup: *"Update Kalita · Ethiopian Yrg bliss?"* — so the shortcut stays true instead of slowly lying.
- **Ordered by recency/use, not creation.** The moment he has 6 setups, two-flick dies if he has to hunt. This morning's setup floats to the front. (Later the coach can surface "for this bean, your X setup" — recency gets us 90% there now.)
- **Tapping a setup lands on a pre-filled, glanceable dialer**, not straight into "brewing now." Still two flicks; respects that a real setup deserves a one-second human look before the water hits.

---

## The impression layer (the engine's fuel)

Asking *how the cup felt* and relating it to the bean — mined server-side — **is** principle #2, *LLM floor, community refinement.* It's how the coach graduates from *"naturals can taste like this in general"* to *"most people taste THIS bean as wine-and-blueberry when it's brewed in range"* — and the coach must **say which one it's leaning on** (honest about certainty / provenance).

### The sharp rule: an impression alone is noise
"This tasted sour" means nothing until you know **was it brewed in the good zone?** Every impression must travel with its **brew context** (cup type, gear, params, was-it-in-range). The same flaw-vs-preference fork rides at population scale:
- A pile of **in-range** brews all reading "winey/bright" → the **bean's character.** Gold.
- A pile of **out-of-range** brews reading "sour" → **user error** — must NOT slander a good light roast.

So the miner **weights by brew quality**, and keeps *"was it as described"* separate from *"did you like it"* (principle #7). Naive averaging would quietly betray the careful roasters we're trying to win.

### The impression ask obeys speak-rarely
It's a **natural step in the brew flow**, not a survey barrage. **One-tap minimum** (a feel), with **optional depth** for the enthusiast who wants to write a paragraph. Beginner gives a tap; enthusiast pours out vocabulary.

---

## Consent — declared, not stolen

The data is **given knowingly, because the user gets something back** — the community's wisdom on his beans (the four-way win, in miniature). **Default-on, declared up front.** The mechanism, decided:

1. **Introduction (onboarding)** — the warm first impression. Does double duty: what the app is *for* (the spirit, the coach) **and** one **unmissable, plain-language line**: *"Your impressions, pooled and anonymous, teach Coffee G what beans taste like for everyone."* Not buried in a skippable slide; not a wall of legal text.
2. **Disclaimer in the menu** — the persistent, returnable full statement, always one tap away.
3. **A real one-tap opt-out sitting right next to the menu disclaimer.** *Inform AND let him leave* — that's what makes it a deal, not a notice. A disclaimer with no off-switch drifts back toward "technically told you, practically took it."

Honest, reversible, anonymous, declared. On-spine (#8 make honesty win).

---

## How this maps to the current code (so the build extends, not rebuilds)

- **`profile.gear_presets` already exists** — named presets `{ name, method, vessel, grind_device, temp }`, a chip quick-switch row in `Brew.jsx`, apply-on-tap. → **Evolve** into the richer setup (cup type + gear *ids* + params + bean) and the two-door Brew front.
- **`Brew.jsx` today**: Bean (free text) → Method → Grinder (free text) → method-aware Parameters → Notes → Outcome chips → Log. → **Re-order to cup-first**; replace free-text gear/bean with **library pickers** (with inline "add" escape hatches).
- **`storage.js` today** holds `taste_identity` (tally) and `gear_presets`. → **Add**: gear library (with `status`), bean library, curated/ordered cup-type prefs, consent flag, richer setups. Impressions today = `session.outcome` + `notes`; → must start **carrying brew-context** in the saved shape now (even before the server exists) so we don't retrofit.
- **`METHODS` catalogue** in `Brew.jsx` (id + type) is the seed of the **cup-types-as-data** catalog — lift it out of the component into a data file (later, server-pushable), enriched with gear categories, params, and impression vocabulary per cup.
- The coach engine (`src/core/coach.js`) **already takes structured session + tasteIdentity + recentSessions** — richer, structured gear/bean/impression data flows straight into it with no engine change. This whole spec *strengthens the trunk's input*; it isn't a pure branch.

---

## Sequencing & deferred

- **Trunk first.** The coach's two-cup acceptance test (deployed, Gemini) is still the immediate gate. This spec is the next major build *after* the coach is verified — but note much of it (structured gear/beans/impressions) directly feeds the coach, so it's trunk-adjacent, not a distant branch.
- **Phase 2 (needs Supabase):** the server-side impression mining, community bean profiles, the coach reading community data, cup types pushed from the server. **Design the data SHAPE now** (impression + brew-context) so the local app already records the right thing; turn on the server later.

## Open items (decide before building those parts)
- **Milk-drink params** — the exact texture/temp fields a latte surfaces (detail later).
- **Cup-type catalog home now** — local JSON in-repo to start, server-pushed in Phase 2? (lean: local now, server later — same shape.)
- **Permanent-delete** — confirm it even exists, or is "retire" the only real op (lean: retire-only; permanent delete hidden + warned).
