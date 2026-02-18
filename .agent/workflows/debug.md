---
description: The Master Healer. Auto-detects bugs, generates tests, and fixes issues.
---

# /debug - Auto-Healer

$ARGUMENTS

---

## ⚡ PROTOCOL: DETECT -> TEST -> FIX

**User Request:** "$ARGUMENTS"

### 1. DIAGNOSIS (The "Dr. House" Phase)
*   **Scan:** Read error logs, file context, and `types.ts`.
*   **Hypothesis:** Formulate the most likely cause.

### 2. TEST GENERATION (The "Evidence")
*   **Rule:** If the bug is logical (not just a typo), **Write a Test Case code block** to reproduce it.
*   *Note:* You don't need to save the test file if it's a quick verify, just run it in your mind or a temp script.

### 3. REPAIR (The Fix)
*   **Apply Fix:** Edit the code.
*   **Safety Gate:**
    *   If fixing **Auth/DB**: 🔴 **STOP & ASK**.
    *   If fixing **UI/Logic**: 🟢 **AUTO-APPLY**.
*   **Verify:** Did the test pass?
    *   *Yes:* Commit.
    *   *No:* Revert and Retry (Max 3 attempts).

---

## 🧪 SUB-COMMAND: /debug test
If the user asks specifically for tests:
1.  Analyze the component.
2.  Generate Unit Tests (Jest/Vitest).
3.  Check Coverage.

---

## OUTPUT

```markdown
## 🐛 Debug Report

**Issue:** [Simple Explanation]
**Diagnosis:** [Root Cause]

**Action:**
1. Created reproduction test.
2. Fixed logic in `useAuth.ts`.
3. Verified fix.

**Code:**
```typescript
// Fixed Code
...
```
```
