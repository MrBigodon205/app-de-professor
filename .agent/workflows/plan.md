---
description: Practical Planning. Creates a roadmap AND allows code prototyping.
---

# /plan - Actionable Planning

$ARGUMENTS

---

## ⚡ MODERN PLANNING

**Rule Shift:**
*   Old Rule: "NO CODE".
*   **New Rule:** **PROTOTYPING ENCOURAGED.**
    *   If you need to test a library to see if the plan works, **Write the Proof of Concept code.**
    *   Don't guess architecture; validate it.

### WORKFLOW
1.  **Analyze:** What are we building?
2.  **Prototype (Optional):** "Let me quickly check if this API works..."
3.  **Draft Plan:** Create `PLAN-{slug}.md`.
    *   Step-by-step checklist.
    *   File structure.
    *   Data model updates.

### SELF-ORGANIZATION
*   **File Naming:** Automatically name the plan file based on the feature (e.g., `docs/plans/login-refactor.md`).
*   **Linkage:** If this plan relates to an existing user story or previous plan, link them.

---

## OUTPUT

```markdown
## 🗺️ Blueprint: [Feature Name]

**Arquivo de Plano:** `docs/plans/PLAN-feature.md`

**Resumo da Estratégia:**
Vamos usar a abordagem X porque é mais simples/rápida.
Criei um protótipo em `scratchpad.ts` e funcionou.

**Próximo:**
Digite `/enhance` para executar este plano.
```
