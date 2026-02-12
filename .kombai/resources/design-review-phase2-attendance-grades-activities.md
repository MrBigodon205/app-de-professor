# Revisão de Design UI/UX — Fase 2: Frequência, Notas & Atividades

**Data da Revisão**: 11 de Fevereiro de 2026  
**Rotas**: `/attendance`, `/grades`, `/activities`  
**Áreas Analisadas**: Design Visual, UX/Usabilidade, Responsivo/Mobile, Acessibilidade, Micro-interações, Consistência, Performance

---

## Resumo Executivo

As três páginas de gestão diária formam o núcleo operacional do Prof. Acerta+. A análise revelou **35 problemas**, com padrões recorrentes que indicam issues sistêmicos: (1) **classes Tailwind dinâmicas** que não serão processadas pelo JIT compiler, (2) **código duplicado** entre os 3 arquivos (getThemeRGB, PDF header), (3) **falta de feedback de erro** para o usuário, e (4) **ausência de visualização mobile** na página de Notas. O padrão de polling agressivo (10s) na página de Atividades também representa um risco de performance e custo de API.

---

## Issues — Frequência (`/attendance`)

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|----------|
| 1 | Classes Tailwind dinâmicas com interpolação: `bg-${theme.primaryColor}/10`, `text-${theme.primaryColor}` — não serão processadas pelo JIT | 🔴 Crítico | Consistência | `pages/Attendance.tsx:745, 758, 761, 766, 776, 777, 803, 816, 839` |
| 2 | Botões de status (P/F/J/S) sem `aria-label` — leitores de tela não sabem qual aluno está sendo marcado | 🟠 Alto | Acessibilidade | `components: AttendanceButton:971-986` |
| 3 | Ações em massa ("Todos Presentes") sem diálogo de confirmação — risco de apagar dados acidentalmente | 🟠 Alto | UX/Usabilidade | `pages/Attendance.tsx:445-494` |
| 4 | Nenhum mecanismo de "Desfazer" após ações em massa | 🟡 Médio | UX/Usabilidade | `pages/Attendance.tsx:445-494` |
| 5 | `document.body.style.overflow = 'hidden'` no MiniCalendar não é restaurado se componente desmonta anormalmente | 🟡 Médio | UX/Usabilidade | `pages/Attendance.tsx:44-48` |
| 6 | Todos os `catch` blocks fazem apenas `console.error` — sem feedback visual ao usuário | 🟠 Alto | UX/Usabilidade | `pages/Attendance.tsx:328, 398, 439, 489` |
| 7 | Erro de frequência é silenciosamente engolido (try dentro de try): `catch (attError) { console.warn(...) }` | 🟡 Médio | Qualidade | `pages/Attendance.tsx:322-325` |
| 8 | `getThemeRGB()` duplicado em Attendance, Grades e Activities — deveria estar em `utils/` | 🟡 Médio | Consistência | `pages/Attendance.tsx:12-31`, `pages/Grades.tsx:367-376`, `pages/Activities.tsx:589-599` |
| 9 | PDF gerado no thread principal — bloqueia UI durante geração com `setLoading(true)` | 🟡 Médio | Performance | `pages/Attendance.tsx:510-739` |
| 10 | Sem estatísticas em tempo real (presentes/faltando) atualizadas ao marcar — usuário não vê progresso | 🟡 Médio | UX/Usabilidade | `pages/Attendance.tsx` (global) |
| 11 | Tabela sem `<caption>` ou `aria-describedby` para acessibilidade | ⚪ Baixo | Acessibilidade | `pages/Attendance.tsx:879-923` |

---

## Issues — Notas (`/grades`)

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|----------|
| 12 | Classes Tailwind dinâmicas: `bg-${theme.baseColor}-500`, `focus:ring-${theme.baseColor}-500` | 🔴 Crítico | Consistência | `pages/Grades.tsx:138, 666` |
| 13 | Sem visualização mobile — tabela com `min-w-[800px]` obriga scroll horizontal em dispositivos móveis | 🟠 Alto | Responsivo/Mobile | `pages/Grades.tsx:760` |
| 14 | Inputs de nota sem `aria-label` — leitura "input numérico" genérica em leitores de tela | 🟠 Alto | Acessibilidade | `pages/Grades.tsx:132-144` |
| 15 | `saveToDB()` é uma função vazia (dead code) — declarada mas nunca implementada | 🟡 Médio | Qualidade | `pages/Grades.tsx:249-252` |
| 16 | PDF header hardcoded "CENSC" e "Centro Educacional Nossa Sra do Cenáculo" — deveria usar dados do usuário | 🟠 Alto | UX/Usabilidade | `pages/Grades.tsx:396-399` |
| 17 | Export modal usa `text-indigo-600`, `focus:ring-indigo-500` hardcoded em vez do tema dinâmico | 🟡 Médio | Consistência | `pages/Grades.tsx:691, 708, 709, 734` |
| 18 | Indicador "Salvando/Salvo" com `hidden sm:flex` — invisible em mobile onde é mais necessário | 🟡 Médio | Responsivo/Mobile | `pages/Grades.tsx:652-661` |
| 19 | Inputs não mostram validação visual (borda vermelha) quando nota excede o máximo permitido | 🟡 Médio | UX/Usabilidade | `pages/Grades.tsx:132-144` |
| 20 | `motion.div` com `className="hidden"` apenas para "forçar" import do framer-motion — código confuso | ⚪ Baixo | Qualidade | `pages/Grades.tsx:629` |
| 21 | Empty state "Nenhum aluno" usa cores hardcoded `text-slate-500 dark:text-slate-400` | ⚪ Baixo | Consistência | `pages/Grades.tsx:824` |

---

## Issues — Atividades (`/activities`)

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|----------|
| 22 | Classes Tailwind dinâmicas em massa: `bg-${theme.primaryColor}/10`, `text-${theme.primaryColor}`, `ring-${theme.primaryColor}` | 🔴 Crítico | Consistência | `pages/Activities.tsx:925, 1003, 1008, 1012, 1015, 1077, 1173, 1185, 1218` |
| 23 | Polling agressivo de 10 segundos somado a realtime — causa overhead no Supabase | 🟠 Alto | Performance | `pages/Activities.tsx:321-323` |
| 24 | `fetchActivities()` chamado duas vezes consecutivas em `handleSave()` | 🟡 Médio | Performance | `pages/Activities.tsx:455-457` |
| 25 | Todos os erros e confirmações usam `alert()` nativo — bloqueia UI e não é acessível | 🟠 Alto | UX/Usabilidade | `pages/Activities.tsx:174, 349, 386, 389, 452, 465, 487, 507, 535, 585, 758` |
| 26 | PDF header hardcoded "CENSC" — idêntico ao problema em Grades | 🟠 Alto | UX/Usabilidade | `pages/Activities.tsx:621-625` |
| 27 | Formulário sem validação inline — campos obrigatórios só validados no `handleSave()` via alert() | 🟡 Médio | UX/Usabilidade | `pages/Activities.tsx:383-391` |
| 28 | Upload de arquivos sem indicador de progresso — usuário não sabe se está carregando | 🟡 Médio | UX/Usabilidade | `pages/Activities.tsx:396-425` |
| 29 | `handlePrint()` clona todos os stylesheets da página — frágil e pesado | 🟡 Médio | Performance | `pages/Activities.tsx:753-792` |
| 30 | Botão "Google Drive" e "OneDrive" abrem o mesmo modal `FileImporterModal` — promessa de integração não entregue | ⚪ Baixo | UX/Usabilidade | `pages/Activities.tsx:1195-1210` |
| 31 | `var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)` — `==` em vez de `===` no UUID generator | ⚪ Baixo | Qualidade | `pages/Activities.tsx:39` |
| 32 | Drag zone e click handler conflitam — clicar na zona de drop abre `FileImporterModal` em vez do file picker nativo | 🟡 Médio | UX/Usabilidade | `pages/Activities.tsx:1182-1183` |

---

## Issues Transversais (Todas as 3 Páginas)

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|----------|
| 33 | `.glass-card-soft` definido 2x no CSS global (linhas 187 e 421) — possível conflito | 🟡 Médio | Consistência | `index.css:187, 421` |
| 34 | Nenhuma das 3 páginas tem `<main>` landmark — herda do Layout mas sem verificação | 🟡 Médio | Acessibilidade | `components/Layout.tsx` (global) |
| 35 | `document.body.style.overflow` manipulado diretamente em DatePicker, DynamicSelect e MiniCalendar — podem conflitar | 🟡 Médio | UX/Usabilidade | `components/DatePicker.tsx:29-37`, `components/DynamicSelect.tsx:51-57`, `pages/Attendance.tsx:44-48` |

---

## Legenda de Criticidade
- 🔴 **Crítico**: Funcionalidade comprometida ou violação de padrões
- 🟠 **Alto**: Impacto significativo na experiência ou qualidade
- 🟡 **Médio**: Problema perceptível que deve ser corrigido
- ⚪ **Baixo**: Melhoria desejável

---

## Resumo por Categoria

| Categoria | 🔴 Crítico | 🟠 Alto | 🟡 Médio | ⚪ Baixo | Total |
|-----------|-----------|---------|---------|---------|-------|
| Consistência | 3 | 0 | 4 | 1 | **8** |
| UX/Usabilidade | 0 | 5 | 6 | 1 | **12** |
| Acessibilidade | 0 | 2 | 2 | 1 | **5** |
| Performance | 0 | 1 | 3 | 0 | **4** |
| Responsivo/Mobile | 0 | 1 | 1 | 0 | **2** |
| Qualidade de Código | 0 | 0 | 2 | 2 | **4** |
| **Total** | **3** | **9** | **18** | **5** | **35** |

---

## Padrões Sistêmicos Identificados

### 🔴 1. Classes Tailwind Dinâmicas (Issues #1, #12, #22)
**Problema**: `bg-${theme.primaryColor}/10` não é processado pelo Tailwind JIT — o resultado é classes CSS inexistentes.  
**Solução**: Usar CSS custom properties (`var(--theme-primary)`) ou `safelist` no `tailwind.config.js`, ou os utility classes temáticos já existentes (`theme-bg-primary`, `theme-text-primary`).

### 🟠 2. Código Duplicado (Issues #8, #16, #26)
**Problema**: `getThemeRGB()` copiado em 3 arquivos. Header do PDF com "CENSC" hardcoded em 2 arquivos.  
**Solução**: Extrair para `utils/pdfHelpers.ts` com funções `getThemeRGB()` e `drawPDFHeader(doc, user, theme)`.

### 🟠 3. Falta de Feedback de Erro (Issues #6, #25)
**Problema**: Erros vão para `console.error` ou `alert()` — sem experiência de usuário adequada.  
**Solução**: Criar um sistema de Toast global (ou usar o Notification Center já existente) e substituir todos os `alert()` e `console.error` user-facing.

### 🟡 4. Manipulação de `body.overflow` (Issue #35)
**Problema**: 3+ componentes manipulam `document.body.style.overflow` diretamente — podem conflitar.  
**Solução**: Usar um hook centralizado `useScrollLock()` com contador de referências.

---

## Próximos Passos

### Prioridade 1 — Correções Críticas
1. **Migrar classes Tailwind dinâmicas** para CSS variables ou utility classes temáticos existentes
2. **Extrair `getThemeRGB`** e `drawPDFHeader` para `utils/pdfHelpers.ts`

### Prioridade 2 — Alto Impacto
3. **Substituir `alert()` por sistema de Toast** em Activities e Grades
4. **Adicionar aria-labels** nos botões de frequência e inputs de nota
5. **Criar visualização mobile** para a tabela de Notas (cards empilháveis)
6. **Trocar "CENSC" no PDF** pelo nome da escola do usuário
7. **Adicionar confirmação** antes de ações em massa na Frequência
8. **Reduzir polling** de 10s para 30s+ nas Atividades

### Prioridade 3 — Melhorias
9. **Adicionar estatísticas em tempo real** na Frequência
10. **Adicionar toast de "Desfazer"** para ações em massa
11. **Adicionar validação inline** no formulário de Atividades
12. **Limpar dead code**: `saveToDB()`, `motion.div hidden`, `fetchActivities` duplicado

---

## Fase 3 (Próxima Iteração)
Revisão das páginas de Planejamento, Horários e Observações.
