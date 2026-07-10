# Jennipher Agent Studio — Design Language

> Visual language, layout rules, motion system, component vocabulary, and portfolio positioning for the Agent Runtime Control Center.

---

## 1. Design Philosophy

Jennipher Agent Studio is a **phone-first creative-technology control center**. Its aesthetic sits at the intersection of mission-control precision and generative-art warmth — think deep-space telemetry rendered through organic chromatic bloom. Every surface should communicate *state*, *trust level*, and *action cost* at a glance.

The three governing principles:

| Principle | Meaning | UI Expression |
|-----------|---------|---------------|
| **Signal Clarity** | Every element earns its place by carrying information | Minimal chrome; data-dense cards; no decorative gradients that don't encode state |
| **Gated Momentum** | Power lives behind approval, not behind friction | Prominent lock badges; action buttons that visually escalate (read → approve → execute) |
| **Living System** | The studio breathes — agents run, logs stream, status pulses | Subtle pulse animations on active agents; log streams with syntax highlighting |

---

## 2. Color System

All tokens map to CSS custom properties under `--js-*` (Jennipher Studio prefix).

### Base Palette

```
--js-bg-base:       #0a0b0f   /* near-black, primary surface */
--js-bg-raised:     #12141a   /* cards, panels */
--js-bg-overlay:    #1c1f2b   /* modals, drawers */
--js-border:        #252836   /* default border */
--js-border-subtle: #1a1c27   /* inset / secondary border */
```

### Signal Colors (semantic, not decorative)

```
--js-signal-safe:     #22d3a0   /* green — read-only, success, approved */
--js-signal-caution:  #f5a623   /* amber — approval pending, partial */
--js-signal-danger:   #e85454   /* red — destructive, locked, error */
--js-signal-info:     #6c9ef8   /* blue — informational, in-progress */
--js-signal-muted:    #4a5066   /* grey — disabled, skipped */
```

### Accent / Brand

```
--js-accent-bloom:   #b06ef3   /* ChromaFlora purple — primary accent */
--js-accent-melody:  #3de8c8   /* Melodyfire teal — secondary accent */
--js-accent-glow:    rgba(176, 110, 243, 0.15)  /* ambient glow for active states */
```

---

## 3. Typography

- **UI / Labels:** `Inter` or `system-ui` — 11–13 px, tracking `+0.02em` for caps labels
- **Code / Logs / IDs:** `JetBrains Mono` or `Fira Code` — all terminal, JSON, SHA, and status output
- **Headings / Narrative:** `Inter` Semi-Bold — section titles, agent names, task headings
- **Scale:** 11 / 12 / 13 / 15 / 18 / 24 / 32 px — strict 8px base grid

---

## 4. Layout Rules

### Grid

- **Mobile (primary):** single-column full-bleed cards with 16 px horizontal padding
- **Tablet:** 2-column — nav rail (56 px) + content area
- **Desktop:** 3-column — nav rail + main content + context/log drawer (320 px)
- Card max-width: 640 px on desktop; full-width on mobile

### Spacing

All spacing uses multiples of **4 px**. Primary card padding: `16px`. Section gaps: `24px`. Touch targets: minimum `44 × 44 px`.

### Hierarchy Zones

Every screen has three zones:

1. **Status Bar** (top, 48 px) — system health, active agent count, approval queue badge
2. **Command Surface** (main scroll area) — task cards, logs, audit results
3. **Action Rail** (bottom on mobile, right on desktop) — primary CTA (always approval-gated for mutations)

---

## 5. Component Vocabulary

### TaskCard

The atomic unit. Contains: agent avatar badge, task title, status chip, cost estimate (tokens/time), action button.

- **State variants:** `idle` | `running` | `awaiting-approval` | `complete` | `failed`
- Status chip color maps directly to `--js-signal-*` tokens
- Action button is disabled and shows lock icon when `WRITE_ACTIONS_ENABLED=false`

### ApprovalBadge

A pill-shaped badge shown on any card or button that triggers a write, build, deploy, or destructive operation. Always shows the gate tier (`L1` / `L2` / `L3`) and a lock icon. Clicking navigates to `APPROVAL_GATES.md` context or the in-app approval modal.

### LogStream

Full-width code surface with monospace font, syntax-highlighted JSON, auto-scroll with pause-on-hover, and a copy-to-clipboard action. Background: `--js-bg-overlay`. Line numbers in `--js-signal-muted`.

### SetupDoctorPanel

A read-only health dashboard rendered from `/api/setup-doctor`. Each check renders as a row:
`[icon] [label] — [status chip] [detail text]`

No action buttons — this panel observes only.

### AgentAvatarBadge

Circular 32 px avatar with initials or icon, plus a 10 px status dot (pulsing green = active, amber = idle, red = error).

---

## 6. Motion System

| Motion Token | Duration | Easing | Use |
|---|---|---|---|
| `--js-motion-instant` | 0 ms | — | State toggles, chip color changes |
| `--js-motion-quick` | 120 ms | ease-out | Button press, badge update |
| `--js-motion-smooth` | 240 ms | ease-in-out | Card entrance, drawer open |
| `--js-motion-drift` | 1200 ms | ease-in-out | Agent pulse, bloom ambient glow |

All motion respects `prefers-reduced-motion`. When reduced, `drift` and `smooth` collapse to `instant`.

---

## 7. Portfolio Positioning

Jennipher Agent Studio occupies the **"creative ops control center"** category — a product niche that is now being validated by platforms like FLORA ($42M Series A) and Google's Stitch (natural-language UI + MCP/SDK integration). The differentiator here is **phone-first, approval-gated agentic execution** purpose-built for the solo creative technologist.

Portfolio narrative keywords: *agent orchestration*, *design-system-native UI*, *phone-first creative ops*, *approval-gated cloud execution*, *connector-neutral runtime*.

This system is a living proof-of-concept for the broader thesis: **design systems and agent handoff tooling are converging into a single product category.**
