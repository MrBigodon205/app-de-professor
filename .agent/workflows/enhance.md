---
description: Smart Feature Implementation. Detects complexity and ensures safety before major changes.
---

# /enhance - Safe Smart Builder

$ARGUMENTS

---

## 🛡️ SAFETY FIRST PROTOCOL

**User Request:** "$ARGUMENTS"

### PHASE 1: SIZE UP & RISK CHECK
**Decision Matrix:**
*   **Trivial/Safe?** (New UI component, CSS, Text, Helper function) -> **EXECUTE.**
*   **Complex/Risky?** (Modifying `App.tsx`, Global Context, Routing, DB) -> **PLAN & CONFIRM.**

### PHASE 2: SAFE EXECUTION LOOP

1.  **Read Context & Dependencies:**
    *   Check `package.json`, `types.ts`, and *existing patterns*.
    *   *Safety Check:* Am I about to overwrite a file that didn't need to be changed? -> **STOP.**

2.  **Implementation Strategy:**
    *   **Isolation:** Create new features in new files/folders whenever possible to avoid breaking existing code.
    *   **Fallback:** If modifying a core file, keep a commented backup or ensure `git` can revert.

3.  **The "Do No Harm" Verification:**
    *   Does it compile?
    *   Did I break the build?
    *   **Auto-Cleanup:** Undo changes if the build fails dramatically.

---

## OUTPUT

```markdown
## ✅ Feature Update

**Status:** Implementado (Modo Seguro)

**O que foi feito:**
1. Criei `src/components/NewFeature.tsx` (Novo arquivo - Seguro).
2. Adicionei a rota em `App.tsx`.

**Teste de Segurança:**
Build: ✅ Sucesso
Alterações Críticas: Nenhuma detectada.

**Próximo Passo:**
Verifique se a tela aparece como esperado.
```
