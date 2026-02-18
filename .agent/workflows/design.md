---
description: AI-powered design intelligence. Generates Design Systems, Colors, and Components.
---

# /design - Design System Pro

$ARGUMENTS

---

## 🎨 INTELLIGENT DESIGNER

This command connects to the `ui-ux-pro-max` knowledge base to generate premium design systems.

### USAGE

*   **Generate System:** `/design system "Premium Education App"`
*   **Find Components:** `/design component "Glassmorphism Card"`
*   **Check Accessibility:** `/design audit`

### PROTOCOL

1.  **Analyze Request:** Style, Industry, Vibe.
2.  **Consult Database:** Run `python .agent/.shared/ui-ux-pro-max/scripts/search.py` (Maintained internal link).
3.  **Output:**
    *   Color Palette (Tailwind classes).
    *   Typography rules.
    *   Component code (React + Tailwind).

### ⚠ VISUAL RULES
*   **No Emojis** as icons. Use Lucide/Heroicons.
*   **Contrast:** Always check Light/Dark mode.
*   **Animation:** Always propose `framer-motion` for interactions.

---

## OUTPUT

Returns the Design System markdown or Component Code directly.
