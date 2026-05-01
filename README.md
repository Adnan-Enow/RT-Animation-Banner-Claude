# RecruitTalent — Hero Banner

Working folder for the homepage banner animation. Two implementations:

## 📁 What's where

| Folder | Purpose |
|---|---|
| **`remotion-banner/`** | ⭐ **Final production version.** React/Remotion code → exports MP4. Studio-grade motion design with springs, easing curves, and number tickers. |
| **`concepts/`** | Earlier HTML/CSS prototypes used to lock in the visual direction. Useful as reference but not the deliverable. |

## 🎬 The deliverable

**`remotion-banner/out/banner.mp4`** — a 21-second 1452×709 H.264 loop (5.3 MB).

Drop it into your homepage:
```html
<video src="/banner.mp4" autoplay loop muted playsinline></video>
```

## 🚀 Resume working on it

```bash
cd "C:\RT - Claude\remotion-banner"
npm run dev   # opens Remotion Studio at http://localhost:3000
```

Then read `remotion-banner/HANDOFF.md` for the full architecture, brand palette, easing curves, and timeline.

## 📜 Story so far

1. Started from Legora's reference video → identified the visual style (Editorial Bento SaaS Motion)
2. Drafted 3 concept directions (`concepts/concept-a.html`, `b`, `c`)
3. Pivoted to a new visual concept based on a custom SVG (gradient mesh + glass card + chat input)
4. Built 4 banner scenes in HTML iteratively (`concepts/banner-scene{1,2,3}.html`)
5. Locked in 4-scene sequence: **proposal → software → staffing → helpdesk**
6. Ported to Remotion with studio-grade motion design (`remotion-banner/`)
7. Rendered final MP4 — ready to ship
