# Design System — Why Things Look Different & What We Can Do

This doc explains **why** the chart, dot, purple screen, crash screen, Hold/Fold button, and fonts look different across the app, and **what we can do** to unify or improve them.

---

## 1. Chart (line thickness & behavior)

**Where it’s defined:** `src/components/TerminalChart.tsx` (canvas 2D drawing).

**Current state:**
- **Line:** `ctx.lineWidth = isFoldedGhost ? 2.5 : 3` (hardcoded). Color switches by state: green `#00FF41` (profit), orange `#FF8C00` (0–1x), red `#FF0000` (debt), grey when ghost.
- **Baseline (1.0x):** Dashed line, 2px, `#00FF4160`.
- **Grid:** 1px, `#00FF4125`.

**Why it feels different:** Values are local to the chart; there are no shared “chart line” tokens. Thickness isn’t configurable from outside.

**What we can do:**
- Add a small **chart theme** (e.g. in `TerminalChart.tsx` or a shared constants file):
  - `CHART_LINE_WIDTH_ACTIVE = 3`, `CHART_LINE_WIDTH_GHOST = 2.5`, `CHART_BASELINE_WIDTH = 2`.
- Optionally make line width responsive (e.g. scale with canvas size) so it doesn’t look too thin on large screens or too thick on small ones.
- Document the intended line thickness in this file so future changes stay consistent.

---

## 2. The dot (leading point on the chart)

**Where it’s defined:** `src/components/TerminalChart.tsx` — the circle at the end of the path.

**Current state:**
- **Radius:** `dotRadius = 10` (or `10 + 2 * glowIntensity` when multiplier > 5x).
- **Drawing:** 8 concentric circles (outer glow) + main circle + small inner dark circle for depth. Color matches line (white when active, grey when ghost). High-mult glow uses `shadowBlur` and optional gold/green glow.
- **No dedicated “effects” layer:** All logic is inline in the draw loop; there’s no separate “dot effects” module.

**Why it feels different:** The dot is drawn by hand each frame with ad‑hoc glow math. There’s no shared “dot style” or “effects pipeline,” so adding new effects (pulse, trail, particles) would mean editing the same block repeatedly.

**What we can do:**
- **Centralize dot styling:** Constants for radius, glow layers, and colors (e.g. `DOT_RADIUS`, `DOT_GLOW_LAYERS`, `DOT_HIGH_MULT_GLOW`).
- **Create a small “dot effects” layer:** A function or hook that takes (position, multiplier, isGhost) and returns draw commands or a list of effects (e.g. “pulse,” “trail,” “particles”). The chart would call this each frame so new effects (e.g. ripple on crash, trail on high mult) live in one place.
- **Optional:** Move dot drawing into a separate function `drawChartDot(ctx, lastX, lastY, multiplier, isFoldedGhost)` so the main draw loop stays readable and effects are easier to add.

---

## 3. Purple screen (Gateway)

**Where it’s defined:** `src/pages/Gateway.tsx` + Tailwind colors `bunker-purple` / `bunker-purple-light`.

**Current state:**
- **Background:** Page is dark (no solid purple fill); the “purple” is from **buttons and borders**: `bg-bunker-purple/35`, `border-bunker-purple-light/50`, `text-bunker-purple-light`, etc.
- **Tailwind:** `bunker-purple: #1A0033`, `bunker-purple-light: #BF00FF`.

**Why it’s different:** Gateway is the **entry/lore** screen (HOLD OR FOLD, Boot, Join). The GDD explicitly calls for a “black screen, three primary Purple buttons.” So purple is intentional there; the rest of the app (terminal, chart, sidebar) uses **green** as the main accent. Two deliberate palettes: purple = gateway, green = bunker/terminal.

**What we can do:**
- **Keep the split** but document it: e.g. “Gateway = purple accent; Terminal + in-game = green accent” in this design doc.
- **Unify only if product wants:** If you want one global accent, we could change Gateway to green as well (and optionally keep purple for one “Join” or “Resistance” CTA for contrast).
- **Consistency within Gateway:** Use the same button style (and maybe a shared `GatewayButton` component) so all three buttons and the auth modal use the same glass/opacity/border pattern.

---

## 4. Crash screen

**Where it’s defined:** `src/components/CrashScreen.tsx`.

**Current state:**
- **Layout:** Full-screen overlay; red digital rain (canvas); dark backdrop; central card with `glass-strong`, red border, Syndicate image, headline, EKG line, Ad button.
- **Fonts:** HTML uses `font-terminal` (VT323). Canvas digital rain uses `ctx.font = '12px monospace'` — so **canvas text is system monospace**, not VT323.
- **Colors:** Red-dominated (`text-red-500`, `border-red-500/80`, etc.); Ad button is amber/gold gradient.
- **No shared “crash” tokens:** Red and glass values are inline.

**Why it’s different:** Crash is a **state** (loss + drama), so it intentionally switches to red, horror BGM, and a different layout. The mismatch is mainly (1) canvas font not VT323 and (2) no shared constants for “crash red” or “crash card” style.

**What we can do:**
- **Font:** We can’t use VT323 inside canvas without loading it as a webfont and using `ctx.font = '12px VT323'` (and ensuring the font is loaded before first draw). Alternatively, keep monospace for the rain and accept that only the HTML card uses VT323.
- **Tokens:** Add crash-specific tokens (e.g. `--crash-red`, `--crash-card-bg`) or Tailwind/custom class “crash-card” so the panel style is reusable and consistent.
- **Relationship to Hold/Fold:** Crash Ad button is amber; Hold/Fold is green/amber by state. We could document “amber = warning/action on crash” and “green = primary game action” so both feel part of the same system.

---

## 5. Hold/Fold button

**Where it’s defined:** `src/components/HoldFoldButton.tsx`.

**Current state:**
- **Font:** `font-terminal` (VT323), uppercase, bold.
- **Colors:** Inline gradients — HOLD: green (`#5CFF7A` → `#1BBF3A` or breathing `#00FF41` → `#00CC34`); FOLD: amber/gold (`#FFBF47` → `#FFE082`); disabled: grey.
- **Effects:** Ripple on click, breathing glow when “HOLD” is ready, scale on press. No shared component with Gateway or Crash buttons.

**Why it’s different:** The button was built for the terminal with its own gradients and states. Gateway uses purple glass buttons; Crash uses an amber “Scan propaganda” button. So we have **three** button families: (1) Gateway purple, (2) Terminal Hold/Fold green/amber, (3) Crash amber — each with its own styling.

**What we can do:**
- **Document the three roles:** Primary terminal action (Hold/Fold) = green/amber; Gateway = purple; Crash CTA = amber. Then standardize **within** each (e.g. one gradient set for Hold/Fold, one for Gateway).
- **Shared base:** A shared “BunkerButton” (or Tailwind layer) for padding, radius, font-terminal, uppercase, so only color and hover/glow differ. HoldFoldButton and Gateway/Crash could use the same base + variant (e.g. `variant="terminal" | "gateway" | "crash-cta"`).
- **Effects:** Keep ripple and breathing in HoldFoldButton; if we add more “terminal” buttons, we can move ripple into the shared base.

---

## 6. Fonts (why they’re inconsistent)

**Where they’re defined:**
- **Body (global):** `index.css` — `font-family: 'VT323', 'Courier New', monospace`.
- **Tailwind:** `font-terminal` → `['VT323', 'Courier New', 'monospace']` (same as body).
- **Tailwind `font-mono`:** Uses Tailwind’s default monospace (no override in our config) — typically system monospace (e.g. Consolas, Menlo), **not** VT323.

**Where each is used:**
- **font-terminal:** Terminal page (headline, multiplier, wager, network, footer, regret toast), WagerInput, SuccessBanner, CrashScreen, HoldFoldButton, TerminalChart tooltip, OracleUplinkBanner. So: **in-game terminal UI**.
- **font-mono:** Gateway (title “HOLD OR FOLD”, buttons, auth modal), Header (balance, rank, Mercy Pot, user menu), GlobalChat, Holophone (tabs, labels, messages), LeftSidebar ad text, Admin, Layout toasts. So: **header, gateway, chat, sidebar, admin** — mixed.

**Why they’re different:** There was no single rule like “all UI text = font-terminal.” Gateway and Header use `font-mono`; Terminal and Crash use `font-terminal`. Canvas text uses raw `monospace` and never VT323.

**What we can do:**
- **Option A — Terminal everywhere:** Use `font-terminal` (VT323) for all UI (Gateway, Header, Chat, Holophone, etc.). Then the whole app feels like one terminal. We’d replace `font-mono` with `font-terminal` in those components.
- **Option B — Two-tier:** `font-terminal` only for “terminal” content (chart area, wager, Hold/Fold, crash card, intel). `font-mono` for chrome (header, chat, sidebar labels, Gateway). Document: “terminal = VT323, chrome = system monospace.”
- **Option C — One monospace:** If we’re okay dropping VT323, we could use one system monospace everywhere (and optionally load a single custom monospace font). Then canvas and HTML would match.

**Canvas:** To match HTML font in canvas we’d set e.g. `ctx.font = '12px VT323'` and ensure VT323 is loaded (e.g. in index.html or a font loader). Otherwise canvas will keep looking slightly different from HTML.

---

## Summary table

| Area           | Why it’s different                                      | What we can do                                              |
|----------------|---------------------------------------------------------|-------------------------------------------------------------|
| Chart line     | Hardcoded width/color in one component                  | Chart theme constants; optional responsive line width       |
| Chart dot      | Inline glow logic; no effects pipeline                  | Dot constants + dedicated “dot effects” / draw function     |
| Purple screen  | Intentional: Gateway = purple, rest = green             | Document; optionally unify to green or keep purple         |
| Crash screen   | Red theme + canvas font ≠ VT323                         | Crash tokens; optional VT323 in canvas or accept monospace  |
| Hold/Fold      | Own gradients; no shared button system                  | Document three button roles; shared base + color variants   |
| Fonts          | Mix of font-terminal and font-mono; canvas = monospace  | Choose: terminal everywhere / two-tier / one monospace      |

If you tell me your priority (e.g. “unify fonts first,” “add dot effects,” “one button system”), I can outline concrete code steps next (file-by-file or component-by-component).
