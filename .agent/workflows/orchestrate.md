---
description: Flexible Agent Coordination. Solves impossible tasks by combining experts with safety barriers.
---

# /orchestrate - Secure Team

$ARGUMENTS

---

## 🛡️ SECURE ORCHESTRATION

**Philosophy:** "Flexibility in thinking, Rigidity in safety."

### 1. SAFETY GATES
Before any agent touches the code:
*   **Gate 1 (Context):** Do we have full context? (Yes -> Proceed).
*   **Gate 2 (Impact):** Will this change the Database Schema? (Yes -> **STOP & ASK USER**).

### 2. EXECUTE (Flexible but Safe)
*   **No Minimum Agents**, but **Mandatory Reviewer**.
    *   If Agent A writes code, Agent A (or B) *must* verify it (compile/lint).
*   **Isolation:** Work in feature branches or separate modules logic first.

### 3. VERIFICATION (The "Double Check")
*   **Linting:** Must pass.
*   **Security Scan:** If touching Auth/API, run `security_scan.py`.
*   **Integration:** Ensure new code imports correctly in the main app.

---

## OUTPUT

```markdown
## 🎼 Orchestration & Review

**Equipe:**
- Frontend Developer: Implementou X.
- Security Check: Aprovou Y.

**Resultado:**
Funcionalidade pronta.

**Relatório de Segurança:**
- Schema DB: Intacto (ou Alteração Aprovada).
- Auth: Seguro.
```
