# 🎵 AURA Music Player

A visually stunning offline music player PWA built with React + Vite.

---

## 🚀 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 📱 Install on Android Phone (Same WiFi)

```bash
# Run with host flag to expose on your network
npm run dev -- --host
```

You'll see something like:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

1. Open Chrome on your Android phone
2. Type that **Network IP** (e.g. `http://192.168.1.5:5173`) in Chrome
3. Tap the **3-dot menu (⋮)** → **"Add to Home screen"** → **Install**
4. Done! AURA appears on your home screen 🎉

---

## 🌐 Deploy & Install from Anywhere (Vercel)

```bash
# Build the app
npm run build

# Deploy to Vercel (install Vercel CLI first)
npm i -g vercel
vercel
```

Then open the Vercel URL in Chrome on your phone and install.

---

## ✨ Features

- Import & play local audio files (MP3, FLAC, WAV, OGG, M4A)
- Full playback controls — play, pause, next, previous, seek
- Shuffle & Repeat (none / all / one)
- Animated frequency visualizer
- Library view with track management
- Dynamic color theming per track
- PWA — installable, works offline
