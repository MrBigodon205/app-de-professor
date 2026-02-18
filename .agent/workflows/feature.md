---
description: The Master Builder. Plans, Creates, and Enhances features intelligently based on complexity.
---

# /feature - Smart Builder

$ARGUMENTS

---

## 🧠 INTELLIGENT ROUTER

**User Request:** "$ARGUMENTS"

**1. DETECT INTENT:**

*   **New App?** -> Trigger **CREATE Mode**.
*   **New Big Module?** (e.g., "Add Admin Panel") -> Trigger **PLAN Mode**.
*   **Small Tweak?** (e.g., "Change button color") -> Trigger **EXECUTE Mode**.
*   **Idea Exploration?** (e.g., "How should I do X?") -> Trigger **BRAINSTORM Mode**.

---

## 🛡️ SAFETY PROTOCOL (Traffic Light)

*   🟢 **Green (Safe):** UI, CSS, Text, New Components. -> **Auto-Execute.**
*   🟡 **Yellow (Logic):** State, Hooks, API integration. -> **Verify Structure First.**
*   🔴 **Red (Critical):** DB Schema, Auth, Payments, Deletions. -> **STOP & ASK USER.**

---

## 💠 MODES

### 1. EXECUTE Mode (The "Just Do It")
*   **For:** Small tasks, bug fixes, UI tweaks.
*   **Action:**
    1.  Read context (`package.json`, related files).
    2.  **Safety Check:** Will this break the build?
    3.  Implement immediately.
    4.  **Auto-Cleanup:** format code, remove unused imports.

### 2. PLAN Mode (The "Architect")
*   **For:** Large features, complex logic.
*   **Action:**
    1.  **Draft:** Create `docs/PLAN-{feature}.md`.
    2.  **Prototype:** You are ALLOWED to write "Proof of Concept" code to test ideas.
    3.  **Review:** Show plan/prototype to user.
    4.  **Execute:** After approval, switch to EXECUTE mode.

### 3. CREATE Mode (The "Genesis")
*   **For:** New projects or sub-apps.
*   **Action:**
    1.  Setup folder structure.
    2.  Install dependencies (check `package.json` first to avoid dupes).
    3.  Initialize boilerplate.

### 4. BRAINSTORM Mode (The "Thinker")
*   **For:** Open-ended questions.
*   **Action:**
    1.  Provide 3 distinct options (Conservative, Balanced, innovative).
    2.  List Pros/Cons for each.
    3.  Wait for user selection.

---

## OUTPUT

```markdown
## 🚀 Feature Status: [Name]

**Mode:** [Execute/Plan/Brainstorm]
**Risk:** 🟢 Safe

**Actions Taken:**
- Created `src/components/MyFeature.tsx`
- Updated `src/App.tsx`

**Verification:**
- Build: ✅ Passed
- Safety Gate: ✅ Open
```
