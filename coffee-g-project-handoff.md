# Coffee G — Project Handoff & Synthesis

> The complete distillation of the strategy/design/architecture sessions. Written so a fresh context (Claude Code, a collaborator, or future-you) can absorb the whole project without rereading transcripts. Companion to the design-notes and spec docs; this is the map, those are the territory.

---

## 1. The forest (why this exists)

The founder went through an expensive, lonely, drawn-out start in specialty coffee — bought five high-end grinders (1Zpresso K-Ultra, 1Zpresso J-Max ESP, Kinu M47 Phoenix pourover + espresso burrs, landed on a Timemore C5 Pro ESP) before knowing what actually suited them. The money was a symptom; the real loss was **delayed joy and a rough start that lasted too long** — survived only on stubbornness most beginners don't have.

**The product's purpose: shorten the rough start so people reach the joy of good coffee before they give up.** Not "save money on gear" — that's a symptom. The enemy is beginner attrition: people who'd have loved coffee but quit because the on-ramp was punishing, expensive, and full of confident voices pointing them wrong.

The founder's own rough start is the **asset** — lived credibility a better-funded competitor can't fake.

---

## 2. The keystone

An AI **dialing coach** that answers the beginner's central question: **"is this taste the coffee, or is it my mistake?"**

The make-or-break judgment is one fork:
- **Fixable flaw** — "that sourness is underextraction; grind finer and the citrus turns sweet." → change technique.
- **Genuine preference** — "that *is* the coffee, fully extracted; it's just not your thing." → change beans (and stop chasing hype that isn't you).

Both produce a similar-tasting cup; opposite advice. Getting this fork right IS the coach's reputation. The delight users tell friends about: *"it figured out I don't actually like light roasts and stopped me wasting money."*

**Why it's first:** it works at N=1 (valuable to one user, day one, no community needed) AND it both deposits the most data and draws the most value — every interaction logs a brew (feeds the asset) and delivers a judgment (uses it). Everything else depends on the palate data the coach builds. Remove it and the arch collapses.

---

## 3. The principles (decision spine)

1. **One engine, three faces** — one core asset (palate-brew model) → coaching, commerce, community. Protect coherence; never fragment.
2. **LLM floor, community refinement** — good at N=1 on general knowledge; exceptional at N=many. Ship magic before moat.
3. **Objective competence before palate judgment** — earn trust on verifiable fixes first.
4. **Earn the right to speak; speak rarely and well** — silent until asked; rare, well-timed prompts.
5. **Pull, not push** — discovery widens when the user looks; nothing widens what's pushed at them.
6. **Two gates to reach a user** — palate match earns relevance; visibility setting grants delivery.
7. **Accuracy ≠ preference** — seller-honesty and buyer-taste are separate signals, never merged.
8. **Make honesty win** — credibility as earned/visible badge, never paid boost.
9. **Realized, not offered** — founder/early-shaper status discovered, never announced.
10. **Four-way win** — wins for growers, roasters, customers, AND founder. "Who loses?" catches drift.

Recurring meta-pattern: **the app's job is to ask the right question warmly and get out of the way.** The coach, the verification harvest, and the gear-wisdom feature all do this.

---

## 4. Architecture

### Product architecture — three layers, one asset
- **Data soil** (bottom, mostly invisible): every user action enriches it as a byproduct. Quality is the whole game.
- **Shared intelligence** (middle): ONE engine, many questions — flaw/preference, community sweet-spot, taste-matching, gear comparison, grower↔buyer matching. Never separate AI per feature.
- **Experience** (top): all the features/"trees." Grows nearly free because it rests on shared layers.

**Cost test for any new idea:** top-layer = leaf (cheap, build anytime); middle-layer = branch (serious, shared brain ripples); bottom-layer = root (rare, retrofitting data collection is painful).

This shape mirrors the four-way-win: one shared well everyone draws from and contributes to is *why* interests align. Good architecture and good values are the same shape.

### Technical architecture (sized for solo, 8 hrs/week — boring on purpose)
- **Client:** React 18 + Vite PWA; offline-first service worker; talks over HTTPS.
- **Backend:** Supabase — DB, auth, realtime sync, row-level security. No servers to run/patch.
- **Functions:** small stateless Netlify Functions; exist mainly to guard secrets (LLM key, Stripe key) and do the few privileged server-side ops.
- **AI layer (the one real design choice):** two layers — cheap **statistics** find the numbers (community sweet-spot via DB queries); **LLM** phrases warmly + handles hard/open-ended reasoning. A **model router** sends routine phrasing to a cheap model and the hard flaw/preference fork to a premium model. Intelligence is a *service the client requests*, never something the client computes (keeps data private + cost controlled).
- **Load-bearing rule:** keep layers ignorant of each other's internals; narrow clean interfaces so any layer (e.g. LLM provider) swaps without touching others.

---

## 5. Economics (the project can't become a money pit)

- **Build cost:** ~zero cash if founder builds with AI assistance (World A). Hiring devs = $60k–150k+ (World B) — avoid unless buying back time on proven traction.
- **Run cost:** Supabase free→$25/mo; LLM single-to-low-double-digit $/mo early; Netlify free. **~$300–700 for all of year one.**
- **LLM is the only real variable cost** — controlled BY the architecture (silent-until-asked + stats-do-math). A naive "LLM every cup" design would multiply it.
- **Model pricing (Jun 2026, per 1M tokens):** Gemini 2.5 Flash-Lite $0.10/$0.40; DeepSeek V3.2 ~$0.14/$0.28; Gemini 2.5 Flash $0.30/$2.50; Claude Sonnet $3/$15. A coaching turn ≈ $0.0004 on Flash-Lite vs ~$0.012 on Sonnet (~30x). Route accordingly: cheap model for phrasing, premium for the hard fork. DeepSeek = price benchmark, but weigh data-governance/access for a global app.
- **Budget:** ~₪20k (~$5,400) year one is *over-funded* for running. Best uses of surplus: (1) design polish for trust/credibility; (2) seed the cold-start — buy beans, log quality data, send bags to early pros; (3) hold reserve as dry powder to buy back time on proven traction. **Do NOT** spend on paid user acquisition year one (bought users churn, pollute early data).
- **Pace:** 8 hrs/week, no rush, Daykan Golan paused. Cash risk is small; the real spend is founder hours. Protect runway and focus, not budget.

---

## 6. Go-to-market: participants, not advertisers

**Reframe:** creators/pros are not ad inventory to rent — they're **participants** (sellers, content, credibility, ground-truth data, all at once) with their own reason to be there.

### Drawing pros without money (the four hooks → one loop)
1. **Merit-measured visibility** — authority made provable to a learning audience.
2. **Control over how their coffee is experienced** — embed their own dialing guidance into their bean. *Strongest hook* — fits pro motivation + coach quality (their recipe = ground truth) + commerce (guidance next to buy link).
3. **Early-shaper/founder identity** — scarce, time-limited, only givable now. **Realized, not offered** — build the conditions, stay quiet, let them notice their fingerprints.
4. **Mirror on their beans in the wild** — how strangers brew their coffee. No roaster has had this.

These form one self-reinforcing loop: embed guidance → bean brews well → visible authority → mirror data → founder identity accrues silently. Low entry cost, high accrued-personal value = easy-in, costly-to-leave. Sustains belief without money.

### Crowd vs. pros do different jobs
- Crowd = reach + volume, but noisy data (beginners mislabel cups).
- Pros = **ground truth** — a few calibrated palates worth more for precision than 10k casual logs.
- **Guru tier is structural, not vanity:** weight trusted expert brew data more heavily in the precision layer.
- Recruit a handful of pros *deliberately and early* as signal anchors — not for numbers.

### Influencer economics (for later amplification, not year one)
- Pricing is on **views, not subscribers**. Coffee/lifestyle ≈ $15–25 CPM; dedicated video 1.5–2x integration.
- Mid creators $500–5k/video. On-target coffee creators (e.g. Lance Hedrick) ~$3k–8k dedicated. A real multi-creator campaign ≈ $15k–40k.
- **James Hoffmann** ≈ mid-five-figures+ and reputationally won't do straight ads — treat as **earned organic validation** (north star), or as a *participant* (roaster/seller/in-app presence), never a sponsorship.
- **Best structure is often revenue-share/affiliate**, not flat fee — aligns incentives, zero upfront.
- Pursue **small/mid creators now as founding participants** (compatible stages, right audiences, ground-truth data). Giants join later as participants once the platform earns it.

### The flywheel
Creators bring audiences → users log brews → coach + community data improve → richer platform attracts next creator. Growth is the participation itself, not a budget. Holds only if participation stays genuinely good for every tier.

---

## 7. Feature concepts (the trees — documented, not yet built)

All sit on the shared engine. Build after the coach is proven.

### Marketplace (platform, NOT logistics operator)
- Revenue: affiliate fees + promotion charges + minimal transaction fee. Sellers self-manage listings/pricing/fulfillment worldwide, with some platform **standards** (min info, declared shipping regions).
- **Payments deferred** — listings + demand signal first, then Stripe.
- **The "Bodhi Leaf" problem** (multi-grower cart couldn't ship): solve with **Option B — unified checkout, split shipment** via Stripe Connect (one cart, one payment, growers ship separately). Founder stays a pure platform. 3PL consolidation only later if demand proves it.
- Tabs: bean listings live in **Beans** (merged with Rate); recipe cards also carry "buy these beans" links (peak-intent surface).

### Roaster outbound — palate-qualified announcements
"We've got something new and we think *you'll* love it" — literally true because surfaced only to palate-matched users. Roaster controls local-first vs. willing-to-ship-enthusiast reach. **Two gates:** palate match + user's visibility setting. Outbound users *welcome* because filtered by taste AND gated by consent.

### User reach controls — two-tier
- **Standing posture** (stable): 5-rung ladder bundling effort-to-obtain + taste-distance — from "nothing, not interested" to "yes!".
- **Axes underneath** (power users): proximity, taste-distance, rarity/occasion, source-type.
- **Mood dial** (momentary, on-screen): "how adventurous today?" — temporarily loosens/firms filters *within the posture's authorized range*. **Pull only** — changes what you discover when you look, never what's pushed.

### Verification harvest — the connective tissue
A warm post-experience conversation that feeds THREE engines at once (user sees one chat; system separates signals): **enjoyment** (palate model) + **accuracy/did-it-match-description** (seller credibility) + **brewing-difficulty** (separates the first two, feeds coach).
- Truth-in-advertising: discourages over-describing. A consistent claim-vs-reality gap = visible accountability. **Accuracy as earned badge, not stick.**
- **Trap:** beginners can't tell wrong-description from bad-brewing → weight by taster credibility + use the coach's read of the cup (was it brewed in the good zone?). Never let raw beginner scores punish honest roasters of tricky/light coffees.
- **Tone:** open with enjoyment ("I'd love to know your experience…"), warm, conversational *unfolding* (each question earned by the last, self-truncating by enthusiasm, answer-routed follow-ups), NOT a form. Feels like the app asking; coach surfaces only if answers reveal a brewing problem.
- **Timing:** NOT every cup. Fire at a true verdict moment — **switching coffee** (strongest) or **~2 weeks on a bag**. First cup is the worst cup. Behavior is itself a verdict (re-buy = liked it); ask less, mean more.

### Dial agent intelligence (full mechanics in design-notes doc 1)
- **Silent until asked.**
- **Always answers, honest about source** — degrades gracefully: rich community data → tight number; thin → a range; none → manufacturer spec, openly labeled.
- **Confidence as ambient color gradient** (cool/grey = manufacturer/uncharted → warm amber → rich gold/green = community-proven). Doubles as a *discovery hook* ("be the pioneer") and gamifies contribution (logging "warms" a bean's color). Turns cold-start into a draw.
- **Every parameter optional** — works with whatever the user gives (simple grind+temp setup ↔ fully instrumented with TDS/water/additives). Degrades across *breadth* of data as well as *depth*. Manufacturer baseline table should be comprehensive (prosumer audience).

### Gear comparison (for experienced users; the second moat)
The question "how do Timemore C5 Pro ESP / Kinu M47 / Comandante / 1Zpresso really compare?" — answer exists nowhere because nobody owns all of them. **Stitch distributed fragments via pairwise lived comparisons that chain through overlap.** Preserve **dimensions** (build/grind/price/speed/espresso-range) — never collapse to one ranking (a flat ranking is a lie). Present at **two depths**: calming distillation for beginners, rich matrix for enthusiasts (same data, pulled to the depth that serves you). LLM floor carries it early; community overlap-map sharpens it with scale.

### "Mentor your past self" gear wisdom (beginner-protective)
Ask experienced users: **"What would you tell yourself when you were just beginning? What gear would you suggest?"** Surfaces honest, generous, *retrospective* wisdom (regret/relief — only visible after living with a setup). The framing disarms sunk-cost defensiveness (advice to a hypothetical beginner, not a verdict on own purchases). NOT a recommendation engine, NOT promotion — the app asks warmly and surfaces collective truth; the "less is more" signal *emerges* because it's true. Revenue-blind. Lightly attach advice to the giver's journey so beginners can weight it.

### Equipment adoption curve (user setting)
Users self-select early-adopter / try-after-proven / mostly-used-only for new-to-market gear. New gear goes to influencers first. **Reputation that graduates gear must be credibility-weighted** (else beginners' bad brews unfairly bury good unfamiliar gear). Same reach-posture engine reused.

### Influencer ranking + grace period
Designation by admin (credibility gate); promotional weight earned by views/followers/engagement. **Grace period** for newcomers (boost above raw numbers — talent investment, breaks rich-get-richer). **Abuse guard:** admin-gated entry + boost decays on *trajectory* not just time. **Exit:** taper grace smoothly as earned weight rises to meet it (no cliff). Reward slope, not incumbency.

### Atmosphere videos (ambiance + soft participant connection)
Short, beautiful clips at app-open: corner-subtle, tap-to-expand, **never autoplaying heavy**. Connects creators ↔ growers/roasters/cafés/retailers (collaboration catalyst). **Curation is everything** — one mediocre clip cheapens the whole app; gate to credible participants / admin-reviewed. Being the atmosphere = an *earned mark of standing*. **Format:** social-media-native (participants reuse existing content), **5–7 sec** standard (longer only for the standalone open moment), **no purchasable length** (uniformity keeps it atmosphere not ad). **Performance discipline:** light, compressed, lazy-loaded, respects data-saver, never blocks load.

### Personalized opening / alarm / smart-home ritual
Let users *choose* a creator's short as their app-opening — even as their **alarm** (most intimate software real estate; perfect coffee-ritual fit; powerful retention). Eventually trigger **smart coffee devices** (warm up the machine on wake / on leaving work).
- **Work smart:** don't integrate per-machine. Trigger the user's existing **Apple Shortcuts / Google routines** (near-zero cost, works today), then **Matter** + major home platforms (one integration, broad reach). Many "smart" machines are just dumb machines on a smart plug = "turn on a switch."
- **Decouple the sacred from the bonus:** the alarm/wake must be self-contained and flawless offline; the machine-warming is the show-your-friends bonus layered on top, never something the wake-up depends on.
- Strategic thread: each step (atmosphere → chosen opening → alarm → device) moves the app earlier into the daily ritual = durable retention via *position*, not engagement tricks. All opt-in (pull, not push).

### Home roasting (a branch on the same trunk)
Same skeleton as brewing, pointed upstream: equipment (roaster+software) / green beans / process (the **roast curve** — a time series, the one genuinely new data shape) / environment (ambient temp, humidity, optional bean-moisture). **Every parameter optional** (offer bean-moisture, require nothing). Same engine, same community-refinement, same confidence gradient. **Strategic bonus:** roasters are the most-wanted participants — a roasting coach gives them a *craft reason* to use the coach, closing the gap between coach-users and marketplace-sellers. Build *after* the brewing coach is proven (own cold-start; don't split focus).

---

## 8. Operating model (far future)

Founder wondered about an "agentic CTO/VP-R&D." Resolution: an **agentic chief-of-staff**, not an autonomous executive. Agents can **sense, synthesize, prioritize, recommend, execute**; they cannot **own judgment or accountability**. Keep the big decisions — bets, rule-breaks, value-calls — with the founder. Especially here, because the values resist metrics: an optimizer watching engagement would "helpfully" suggest the push notification, the paid-longer video, the nag-every-cup — exactly the things deliberately *not* done. The soul lives in the judgments an optimizer gets wrong.

---

## 9. Build status

- **Phase 1 app:** clean slate — building fresh. No legacy code.
- **Phase 2 specs written:** Foundation (Supabase), Community Recipes, Affiliate Tracking — deferred until Phase 1 coach is proven.
- **Specced-but-not-written:** Beans tab/marketplace, unified split-checkout (Stripe Connect), Guru layer, payments.

**Next concrete step:** scaffold Phase 1 — get the brewing coach built and trusted before anything else.

---

## 9a. Phase 1 screen reference

The concrete UI for each tab — what the user actually sees and does.

### Discover tab
Static hardcoded recipe cards (offline-first). Each card shows bean, method, parameters, and a brief note. Browsable, no interaction beyond reading. Phase 2 replaces this with a live community feed.

### Beans tab
Merged shop + rate. Browse bean listings; tap to see detail and rate. (Detailed UI TBD when this tab is built — not Phase 1 critical path.)

### Brew tab (the keystone)

**Default view — the dialer.**
Large live ratio readout at top (e.g. "1:15"), recalculates as the user types. Input fields below: bean (text), method (dropdown — V60, Espresso, AeroPress, etc.), then dose, yield, time, grind number, grinder device, temperature. Grinder device is a separate field from grind number — "grind 14" is meaningless without knowing the grinder. Fields pre-fill from saved setup; user only changes what's different today.

**The taste step.**
Below parameters: "How did it taste?" with outcome chips — Balanced (positive/green), Sour, Bitter, Weak, Strong, Astringent, Muddled. Tap one chip. Optional notes field. Single "Log this brew" button, disabled until an outcome is selected.

**On log — three things happen in sequence:**
1. Session saves; taste identity updates silently in background.
2. A contextual tip card slides up — matched to the outcome just selected (e.g. Sour → "sourness is underextraction, grind finer"). One card, relevant to what just happened, dismissible.
3. If online: the Dial Agent box appears — brief "thinking…" pulse, then a warm specific suggestion for the next brew informed by taste history. Offline: silent, nothing breaks.

**Open design tension:** Phase 1 auto-fires the Dial Agent after every log. The matured design (silent-until-asked) points toward the coach speaking only when summoned. Current behavior is a placeholder — this decision belongs to the smart-agent upgrade, not Phase 1.

**Shots view.**
A button showing shot count switches to the Shots timeline: every logged brew in reverse-chronological order. Each entry has a colored dot (green = balanced, amber = sour/weak, red = harsh faults), bean/method/parameters, notes. A trend line appears at top when a pattern exists ("Your last 5 V60s trended bitter"). Back button returns to the dialer.

### Train tab

Swipeable cards — bite-sized coffee lessons. Each card: three sentences + one actionable takeaway. Topics span extraction science, flavor wheel basics, origin characteristics, water, grind. Cards are dismissible; a dismissed card never comes back. No levels, no progress bar, no curriculum guilt. The user can wander in, pick up a useful idea, and leave.

**Design intent:** the one place tips are allowed to just sit and wait — because the user came looking (pull, not push). Contrast Brew, where a tip surfaces only after a logged brew and only one, contextual to what just happened.

**Phase 1 version:** fixed bank of cards.
**Intended upgrade (not Phase 1):** contextual ordering driven by brew history — if your last few cups trended sour, the extraction-and-sourness card rises first. Middle-layer enhancement, deferred.

**Honest flag:** Train earns its place only if the cards feel genuinely useful. If it becomes a static FAQ nobody opens, fold its best moments into post-brew tips in Brew and drop the tab.

### Me tab
Profile: name, PIN setup/change, device UUID display (for support). Gear presets: saved grinder + default setup so Brew pre-fills correctly. Discovery level setting (conservative → open). Tier display (user/guru/grower/retailer — visual only in Phase 1).

---

## 10. The one sentence to keep

> *I wish someone had helped me start better, and I don't want others to suffer the start I did.*

That's the forest. When the work is slow or a decision is murky, return to it. Everything else is trees — and the trees are all written down and safe.
