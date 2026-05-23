# Coffee G ☕ — Project Brief for Claude Code

## What is Coffee G?
A mobile-first PWA (Progressive Web App) for coffee enthusiasts. It's a personal coffee companion — not a tool, a friend. The name combines "coffee" with "ji", a Hindi honorific meaning warmth and friendship.

**Live repo:** https://github.com/Ofr3d/Coffee-g
**Stack:** React 18 + Vite + Netlify (hosting + serverless functions)
**Primary user:** Mobile (Android first, iOS second)

---

## Architecture

```
Coffee-g/
├── index.html                  # PWA entry point, all meta tags
├── package.json
├── vite.config.js              # Vite + React, proxies /.netlify/functions to port 9999
├── netlify.toml                # Build: npm run build, publish: dist, functions: netlify/functions
├── CLAUDE.md                   # This file
├── src/
│   ├── main.jsx                # React root, registers service worker
│   └── App.jsx                 # Entire app (single file by design)
├── public/
│   ├── manifest.json           # PWA manifest, theme #c4923a
│   ├── sw.js                   # Service worker, cache-first except API calls
│   └── logo.png                # Coffee G logo (PNG, will be replaced with SVG later)
└── netlify/
    └── functions/
        └── claude.js           # API proxy — reads ANTHROPIC_API_KEY env var, calls Anthropic
```

---

## App Structure (App.jsx)

### Storage
- Uses `localStorage` (not window.storage — that's Claude artifact only)
- All keys namespaced: `coffeeg:userId:key`
- Helper functions: `gset(key, val)` and `gget(key)`
- Multi-user: each user has isolated storage under their uid

### Users
- Name + 4-digit PIN
- Stored in `coffeeg:users` and `coffeeg:activeUser`
- Login screen → PIN keypad → load user data

### Per-user data keys
- `coffeeg:uid:presets` — gear presets array
- `coffeeg:uid:activePreset` — active preset id
- `coffeeg:uid:sessions` — brew session logs
- `coffeeg:uid:palette` — palate training progress
- `coffeeg:uid:identity` — taste identity (traits, vocabulary, log)
- `coffeeg:uid:rate` — beans and gear ratings
- `coffeeg:uid:discovery` — discovery level (conservative/adventurous/funky)
- `coffeeg:uid:discoveryTooltipSeen` — first-time tooltip flag
- `coffeeg:uid:firstLaunch` — intro screen shown flag

### AI Agents
All AI calls go through `/.netlify/functions/claude` (never direct to Anthropic).
- **Dial** — dialing-in expert, knows rig + sessions + palate + identity + discovery mode
- **Palate** — sensory training coach, guides through curriculum lessons
- **Scout** — discovery agent for beginners, builds taste identity passively

### Tabs (in order)
1. **Dial** — chat with Dial agent
2. **Log** — log a brew session
3. **Shots** — session history
4. **Train** — palate curriculum (15 lessons, 3 levels)
5. **Discover** — Scout agent for taste discovery
6. **Rate** — rate beans and gear (affiliate buy links ready)
7. **Me** — taste identity, stats, gear presets, settings, about

### Persistent UI elements (always visible in app)
- **Discovery strip** — top of screen, above nav. Three modes: 🎯 Conservative / 🧭 Adventurous / 🌀 Funky. First-time tooltip explains it.
- **Your Setup strip** — below nav, always visible. Shows active rig name + all filled variables. Tappable → jumps to Me tab.

---

## Design System

### Colors
```
bg:         #0a0503 (near black espresso)
card:       rgba(255,255,255,0.042)
border:     rgba(212,164,90,0.13)
gold:       #c4923a
goldLight:  #d4a45a
text:       #f5e6c8 (warm cream)
muted:      rgba(245,230,200,0.42)
green:      #7ec87e (Palate agent)
teal:       #5ab8b0 (Scout agent)
```

### Typography
- Body/serif: `'Crimson Pro', Georgia, serif`
- Monospace/labels: `'Courier New', monospace`
- Import: Google Fonts — Crimson Pro

### Tone
- Warm, knowledgeable, never preachy
- Suggestions are always subtle: "based on your preferences you might want to test..." or "many people who love X have found Y — I think you'd like it because..."
- Funky mode = effortless and joyful, NOT obscure or gatekeeping

---

## Key Rules for Development

1. **Single App.jsx** — keep everything in one file by design. Don't split into components unless the file exceeds ~2000 lines.
2. **Mobile-first always** — max-width 480px, no hover states as primary interaction, touch-friendly tap targets (min 44px).
3. **localStorage only** — never use window.storage (that's Claude artifact environment only).
4. **API calls via proxy** — always `/.netlify/functions/claude`, never direct to api.anthropic.com.
5. **Per-user data** — always namespace storage with `sk(uid, key)`, never write to global keys for user data.
6. **Preserve the identity loop** — every user interaction that reveals taste preference should feed into the identity system if identityEnabled is true.
7. **Discovery mode affects ALL agents** — conservative/adventurous/funky must be injected into Dial, Palate, and Scout system prompts.
8. **Don't break existing features** — when adding, patch surgically. Full rebuilds only when architecture requires it.
9. **Logo** — currently PNG at `/logo.png`. Will be replaced with SVG later. Don't hardcode dimensions.
10. **Affiliate ready** — buy links on beans and gear are intentional. Don't remove them.

---

## Deployment

- **Host:** Netlify
- **Build command:** `npm run build`
- **Publish dir:** `dist`
- **Functions dir:** `netlify/functions`
- **Required env var:** `ANTHROPIC_API_KEY`
- **Auto-deploy:** connected to GitHub main branch

## Current Status
- Alpha — being tested by founder (Ofer)
- All core features built and working
- Logo PNG in place, SVG version coming
- Affiliate/monetization hooks in place, not yet activated
- Roasters and cafés planned for v2 of Rate tab

---

## What's Next (v2 roadmap)
- Roasters section in Rate tab
- Café experience log (full — name, location, coffee ordered, barista, brew method, photos, tasting notes, rating)
- Community data layer (anonymized cross-user taste patterns)
- Affiliate link activation with real partner URLs
- Google Play submission via TWA wrapper
