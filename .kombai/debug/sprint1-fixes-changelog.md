# 🔧 CHANGELOG — Sprint 1 Audit Fixes

**Data:** 11/02/2026  
**Branch:** `audit-fixes-sprint1-backup`  
**Objetivo:** Corrigir os 3 issues mais críticos identificados na auditoria  

---

## 📝 Mudanças Implementadas

### 1. Sistema de CSS Variables para Temas
- **Arquivo:** `src/index.css`
- **Mudança:** Adicionado CSS variables globais para suportar temas dinâmicos sem quebrar Tailwind JIT
- **Linhas:** Seção `:root` expandida
- **Revert:** Remover as novas variáveis CSS adicionadas

### 2. Componente Toast Reutilizável
- **Arquivo:** `src/components/Toast.tsx` (NOVO ARQUIVO)
- **Mudança:** Criado componente Toast com contexto para substituir alert()/confirm()
- **Revert:** Deletar o arquivo

### 3. ToastProvider no App
- **Arquivo:** `src/App.tsx`
- **Mudança:** Adicionado ToastProvider wrapper
- **Linhas:** Importação + wrapper no componente principal
- **Revert:** Remover importação e wrapper

### 4. Substituição de alert() por Toast — Dashboard
- **Arquivo:** `src/pages/Dashboard.tsx`
- **Mudança:** Substituído `alert()` por `useToast()` hook
- **Linhas:** A definir
- **Revert:** Restaurar `alert()` original

### 5. Substituição de alert() por Toast — InstitutionalAttendance
- **Arquivo:** `src/institutional/attendance/InstitutionalAttendance.tsx`
- **Mudança:** Substituído `alert()` por `useToast()` hook
- **Linhas:** 75
- **Revert:** Restaurar `alert("Erro ao registrar ponto...")`

### 6. Substituição de alert()/confirm() — InstitutionalPlanningTemplates
- **Arquivo:** `src/institutional/planning/InstitutionalPlanningTemplates.tsx`
- **Mudança:** Substituídos 5 usos de `alert()` e `confirm()` por Toast
- **Linhas:** 69, 87, 93, 124, 126
- **Revert:** Restaurar chamadas nativas originais

---

## ⏪ Como Fazer Rollback

### Opção 1: Rollback Completo (Git)
```bash
git checkout main
git branch -D audit-fixes-sprint1-backup
```

### Opção 2: Rollback Manual (Por Arquivo)
Usar este changelog como referência para reverter cada mudança individualmente.

---

## ✅ Testes Necessários

Após implementação, verificar:
- [ ] Tema dinâmico renderiza cores corretamente
- [ ] Toast aparece em vez de alert() nativo
- [ ] Toast é acessível (foco, ARIA, keyboard)
- [ ] Aplicação compila sem erros
- [ ] Aplicação roda sem erros de runtime

---

## 📊 Status

- [x] Branch de backup criado (`audit-fixes-sprint1-backup`)
- [x] Changelog criado
- [x] CSS variables já existiam (nenhuma mudança necessária - sistema já usa CSS vars)
- [x] Toast component criado (`components/Toast.tsx`) v2 com helpers
- [x] Modal component criado (`components/Modal.tsx`) com a11y completo
- [x] ConfirmDialog variant criado
- [x] ToastProvider integrado no App.tsx
- [x] alert() substituídos (17 ocorrências em 5 arquivos principais)
  - InstitutionalAttendance.tsx: 1 alert → showToast
  - InstitutionalPlanningTemplates.tsx: 5 alerts + 1 confirm → useToast
  - Planning.tsx: 3 alerts → success/error/warning
  - Observations.tsx: 4 alerts → showError/success
  - InstitutionalStudents.tsx: 3 alerts + 1 confirm → showToast/showConfirm
- [x] Dynamic Tailwind classes corrigidas (Instructions.tsx - 30+ interpolações)
- [ ] Testes realizados (PENDENTE - aguardando engenheiro)
- [ ] Merge para main (se aprovado)

## 🎯 Arquivos Modificados

### Commit 1 (e5335c9)
1. `components/Toast.tsx` - CRIADO (v1)
2. `App.tsx` - ToastProvider adicionado
3. `institutional/attendance/InstitutionalAttendance.tsx` - alert → showToast
4. `institutional/planning/InstitutionalPlanningTemplates.tsx` - 5 alerts/confirms → useToast

### Commit 2 (ec3cfb3)
5. `components/Modal.tsx` - CRIADO (Modal + ConfirmDialog)
6. `components/Toast.tsx` - ATUALIZADO (v2 com helpers)
7. `pages/Planning.tsx` - 3 alerts → toast helpers
8. `pages/Observations.tsx` - 4 alerts → toast
9. `institutional/students/InstitutionalStudents.tsx` - 4 alerts/confirms → toast/dialog
10. `pages/Instructions.tsx` - 30+ dynamic classes → static theme classes

**Total:** 2 commits, 10 arquivos modificados, 2 arquivos criados, ~1600 linhas adicionadas
