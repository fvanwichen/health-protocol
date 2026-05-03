# Blueprint Protocol — Deployment Guide

## Quick Deploy (Free)

### Option A: GitHub Pages (Recommended)

1. Create a new repository on GitHub (e.g., `blueprint-protocol`)
2. Upload all 4 files to the root:
   ```
   index.html
   app.js
   sw.js
   manifest.json
   ```
3. Go to **Settings → Pages → Source** → select `main` branch, root `/`
4. Your app is live at `https://yourusername.github.io/blueprint-protocol/`

> **Important for GitHub Pages subpath:** If your site is at
> `/blueprint-protocol/` instead of `/`, update these paths:
> - In `manifest.json`: change `"start_url"` and `"scope"` to `/blueprint-protocol/`
> - In `sw.js`: update the `ASSETS` array paths
> - In `index.html`: update `<script src=` and `<link rel="manifest" href=` paths
> - In `app.js`: update the SW register path in `registerSW()`

### Option B: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In your project folder (with all 4 files), run: `vercel`
3. Follow the prompts — it auto-detects a static site
4. Your app is live at the URL Vercel provides

### Option C: Netlify Drop

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag your project folder onto the page
3. Done — instant deploy with free HTTPS

---

## Installing on iPhone 13 Pro

1. Open your deployed URL in **Safari**
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** — the app icon appears on your home screen
5. Open the app → tap **"Enable Reminders"** → allow notifications

> **Note on iOS Notifications:**
> - Requires **iOS 16.4+** and **Safari**
> - The app must be added to home screen (standalone mode)
> - Notifications only fire while the device is awake
> - For background notifications, a push server would be needed

---

## Customizing Your Protocol

### Change reminder times
Open `app.js` and edit the `PROTOCOL_SCHEDULE` array at the top:
```js
{
  id: 'circadian',
  hour: 8,      // ← Change hour (24h format)
  minute: 0,    // ← Change minute
  label: 'Circadian Anchor',
  subtitle: '10 min sunlight exposure...',
  icon: '◎'
}
```

### Change accent color
- In `index.html`, find `accent: '#00E5A0'` in the Tailwind config
- In the `<style>` block, update `--accent: #00E5A0`
- For electric blue, use `#3B82F6`

### Add/remove exercises
Edit the `GYM_PROTOCOLS` object in `app.js`.

### Add new metrics to The Lab
Add entries to the `LAB_METRICS` array in `app.js`.

---

## File Structure
```
blueprint-protocol/
├── index.html      ← Main page + Tailwind config + CSS
├── app.js          ← All application logic (views, state, notifications)
├── sw.js           ← Service worker (caching, push handling)
└── manifest.json   ← PWA manifest (icons, theme, display mode)
```

## Tech Stack
- HTML5 + Tailwind CSS (CDN) + Vanilla JS
- localStorage for persistence
- Service Worker for offline + notifications
- Zero dependencies, zero backend, 100% free
