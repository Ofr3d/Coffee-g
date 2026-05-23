# Coffee G ☕ — Alpha Setup Guide

## What you need
- A computer with Node.js installed (nodejs.org)
- A Netlify account (netlify.com — free)
- An Anthropic API key (console.anthropic.com)

---

## Step 1 — Get your Anthropic API key
1. Go to console.anthropic.com
2. Sign in (same account as Claude.ai)
3. Click **API Keys** → **Create Key**
4. Copy it — you'll only see it once

---

## Step 2 — Deploy to Netlify (drag & drop — no terminal needed)

1. Install Node.js if you don't have it: nodejs.org/en/download
2. Open a terminal in this folder and run:
   ```
   npm install
   npm run build
   ```
3. This creates a `dist/` folder
4. Go to netlify.com → Log in → **Add new site** → **Deploy manually**
5. Drag the `dist/` folder onto the Netlify deploy area
6. Your app is live at a URL like `https://random-name.netlify.app`

---

## Step 3 — Add your API key to Netlify

1. In Netlify, go to your site → **Site configuration** → **Environment variables**
2. Click **Add variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: paste your API key
5. Click Save
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## Step 4 — Install on your phone (Android)

1. Open Chrome on your Android phone
2. Go to your Netlify URL
3. Tap the 3-dot menu → **Add to Home Screen**
4. Coffee G is now installed like a native app

## Step 4b — Install on iPhone

1. Open Safari (must be Safari, not Chrome)
2. Go to your Netlify URL
3. Tap the Share button → **Add to Home Screen**

---

## For local development (optional)
```
npm install
npm run dev
```
Note: AI features won't work locally without also running the Netlify function locally.
To run functions locally, install netlify-cli: `npm install -g netlify-cli` then run `netlify dev`

---

## Updating the app
1. Make changes to `src/App.jsx`
2. Run `npm run build`
3. Drag the new `dist/` folder to Netlify again

---

## Costs (alpha phase)
- Netlify hosting: **free**
- Anthropic API: ~$0.003 per conversation (very cheap for alpha testing)
- Budget $5–10/month for comfortable alpha usage

