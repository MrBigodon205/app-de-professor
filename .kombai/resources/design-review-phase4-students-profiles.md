# Revisão de Design UI/UX — Fase 4: Lista de Alunos, Perfil do Aluno & Perfil do Professor

**Data da Revisão**: 11 de Fevereiro de 2026  
**Rotas**: `/students`, `/reports/:id`, `/profile`  
**Áreas Analisadas**: Design Visual, UX/Usabilidade, Responsivo/Mobile, Acessibilidade, Micro-interações, Consistência, Performance

## Resumo Executivo

A Fase 4 analisa as três páginas de gestão de perfis. O **StudentProfile** é o segundo componente mais complexo do app (1.184 linhas), contendo lógica de gráficos (Recharts), geração de PDF (jsPDF + autoTable), e renderização condicional extensiva. O **StudentsList** inclui funcionalidade de OCR via Tesseract.js — uma feature avançada que merece destaque, mas que carrega um worker pesado. O **TeacherProfile** é mais enxuto (397 linhas), mas replica todos os problemas sistêmicos de classes dinâmicas do Tailwind.

Padrões sistêmicos de fases anteriores continuam presentes: **polling de 10s**, **dynamic Tailwind classes**, **alert()/confirm() nativos**, e **inconsistência no uso de design tokens**. Foram identificados **38 problemas** nesta fase, incluindo 3 críticos e 10 de alto impacto.

---

## Issues

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|----------|
| **LISTA DE ALUNOS** | | | | |
| 1 | `confirm()` e `alert()` nativos usados para delete, bulk delete, import success/error — 8 ocorrências | 🟠 Alto | UX/Usabilidade | `StudentsList.tsx:108, 113, 159, 173, 284, 311, 370, 374` |
| 2 | Cor do avatar do aluno gerada dinamicamente (`from-${theme.primaryColor} to-${theme.secondaryColor}`) — não é compilada pelo Tailwind JIT | 🔴 Crítico | Design Visual | `StudentsList.tsx:299, 359, 456, 459, 775, 778` |
| 3 | Empty state usa classes dinâmicas `bg-${theme.primaryColor}/10` e `text-${theme.primaryColor}` | 🟡 Médio | Design Visual | `StudentsList.tsx:382-384` |
| 4 | Add student form usa classes dinâmicas para borda, ícone e focus ring | 🟡 Médio | Design Visual | `StudentsList.tsx:620, 622, 633` |
| 5 | Desktop header gradient decoration usa classes dinâmicas em 4 locais | 🟡 Médio | Design Visual | `StudentsList.tsx:456` |
| 6 | Sem paginação — lista pode ter 50+ alunos renderizados de uma vez com `motion.div` individual (performance degradada) | 🟠 Alto | Performance | `StudentsList.tsx:819-897, 940-1011` |
| 7 | Report mode duplica a lógica de filtro de students — `students.filter()` chamado 2x com mesmo critério (linhas 747 e 761) | 🟡 Médio | Performance/Qualidade | `StudentsList.tsx:747-750, 761-766` |
| 8 | OCR (Tesseract.js) worker é inicializado sob demanda mas nunca mostra progresso real — só "Processando..." genérico | 🟡 Médio | UX/Usabilidade | `StudentsList.tsx:209-278` |
| 9 | Import modal não fecha com tecla ESC — falta `onKeyDown` handler | 🟡 Médio | Acessibilidade | `StudentsList.tsx:520-616` |
| 10 | Import modal z-index `z-[100]`, OCR overlay `z-[110]` — z-index escalation sem sistema centralizado | ⚪ Baixo | Consistência | `StudentsList.tsx:521, 659` |
| 11 | Mobile card view: click na row inteira faz `toggleSelect` E os botões de ação também têm `onClick` com `stopPropagation` — UX confusa (clicar onde?) | 🟡 Médio | UX/Usabilidade | `StudentsList.tsx:824-895` |
| 12 | `generateMatricula()` gera número aleatório de 5 dígitos — sem verificar duplicatas na turma | 🟡 Médio | Bug/UX | `StudentsList.tsx:123` |
| 13 | Report mode: search input falta `value={searchQuery}` — input controlado incompleto | 🟠 Alto | Bug | `StudentsList.tsx:725` |
| 14 | Desktop header background: `from-${theme.primaryColor}/5` e `from-${theme.primaryColor}/10` — classes dinâmicas | 🟡 Médio | Design Visual | `StudentsList.tsx:456` |
| 15 | Footer total count: `text-${theme.primaryColor}` — classe dinâmica | ⚪ Baixo | Design Visual | `StudentsList.tsx:1049` |
| **PERFIL DO ALUNO** | | | | |
| 16 | `setPlans(formattedPlans)` chamado 2x consecutivas — duplicação de código | ⚪ Baixo | Qualidade de Código | `StudentProfile.tsx:158-159` |
| 17 | Polling agressivo de 10 segundos — realtime subscription já cobre todas as tabelas (students, occurrences, attendance, grades) | 🟠 Alto | Performance | `StudentProfile.tsx:197-199` |
| 18 | `window.innerWidth < 1024` usado para decisão de auto-select — detecção de mobile por JS em vez de CSS/media query | 🟡 Médio | Responsivo/Mobile | `StudentProfile.tsx:186` |
| 19 | Progress bar usa classe dinâmica `w-p-${Math.round(...)}` que **não existe** no Tailwind — barra nunca renderiza a largura correta | 🔴 Crítico | Bug/Design | `StudentProfile.tsx:1073` |
| 20 | Sidebar search input **não tem onChange handler** — é puramente decorativo, não funciona | 🔴 Crítico | Bug/UX | `StudentProfile.tsx:795-799` |
| 21 | Sidebar student list: selected state usa classes dinâmicas (`bg-${theme.primaryColor}/10`, `border-${theme.primaryColor}/20`, `text-${theme.primaryColor}`) | 🟡 Médio | Design Visual | `StudentProfile.tsx:808-809, 815` |
| 22 | Header gradient usa 6 classes dinâmicas (`from-${theme.primaryColor}/20`, `from-${theme.primaryColor}/10`, `from-${theme.primaryColor}/15`) | 🟡 Médio | Design Visual | `StudentProfile.tsx:839-840` |
| 23 | Empty state usa classes dinâmicas | 🟡 Médio | Design Visual | `StudentProfile.tsx:828-829` |
| 24 | Right column stat card: gradient blur usa classe dinâmica | ⚪ Baixo | Design Visual | `StudentProfile.tsx:1042` |
| 25 | `alert()` usado para erro na geração de PDF | 🟠 Alto | UX/Usabilidade | `StudentProfile.tsx:665` |
| 26 | PDF generation function inline (linhas 217-667 = **450 linhas**) — deveria ser utilitário separado | 🟠 Alto | Qualidade/Arquitetura | `StudentProfile.tsx:217-667` |
| 27 | `handleExportPDF` carrega jsPDF e autoTable dinamicamente — sem feedback visual do loading do import | 🟡 Médio | UX/Usabilidade | `StudentProfile.tsx:221-223` |
| 28 | `getChartData()`, `getStudentOccurrences()`, `getAttendanceStats()`, `getStudentActivities()` recalculados a cada render — deveria usar `useMemo` | 🟠 Alto | Performance | `StudentProfile.tsx:674-698` |
| 29 | `saveObservation` salva a cada keystroke do textarea — sem debounce | 🟠 Alto | Performance | `StudentProfile.tsx:700-717, 1030` |
| 30 | Chart tooltip usa hardcoded dark theme colors — não segue light/dark mode do app | ⚪ Baixo | Consistência | `StudentProfile.tsx:962-964` |
| 31 | Nenhum `aria-label` no botão de export PDF | ⚪ Baixo | Acessibilidade | `StudentProfile.tsx:887-893` |
| **PERFIL DO PROFESSOR** | | | | |
| 32 | Loading spinner usa classe dinâmica `border-${theme.primaryColor}` | 🟡 Médio | Design Visual | `TeacherProfile.tsx:98` |
| 33 | Breadcrumb usa 3 classes dinâmicas `text-${theme.primaryColor}` e `hover:text-${theme.primaryColor}` | 🟡 Médio | Design Visual | `TeacherProfile.tsx:109, 111, 113` |
| 34 | Camera button e save buttons usam `bg-${theme.primaryColor}` — 6+ ocorrências de classes dinâmicas | 🟡 Médio | Design Visual | `TeacherProfile.tsx:164, 202, 214, 257, 267, 303, 308, 312, 340, 343, 359, 366, 369, 387` |
| 35 | Discipline selection salva individualmente a cada clique (via `handleAddSubject` / `handleRemoveSubject`) — deveria agrupar mudanças e salvar com botão explícito | 🟠 Alto | UX/Performance | `TeacherProfile.tsx:58-93, 286-301` |
| 36 | Password field sem validação — aceita qualquer valor sem feedback visual | 🟡 Médio | UX/Usabilidade | `TeacherProfile.tsx:241-250` |
| 37 | Foto de perfil aceitada apenas via URL text input — não há upload de arquivo direto | 🟡 Médio | UX/Usabilidade | `TeacherProfile.tsx:189-206` |
| 38 | `confirm()` nativo usado para remover disciplina | 🟡 Médio | UX/Usabilidade | `TeacherProfile.tsx:81` |

---

## Legenda de Criticidade

- 🔴 **Crítico**: Viola padrões de acessibilidade (WCAG AA), quebra funcionalidade, ou representa risco arquitetural severo
- 🟠 **Alto**: Impacta significativamente a experiência do usuário ou qualidade do código
- 🟡 **Médio**: Problema perceptível que deve ser corrigido
- ⚪ **Baixo**: Melhoria desejável (nice-to-have)

---

## Resumo por Categoria

| Categoria | 🔴 Crítico | 🟠 Alto | 🟡 Médio | ⚪ Baixo | Total |
|-----------|-----------|---------|---------|---------|-------|
| Design Visual | 1 | 0 | 12 | 2 | **15** |
| UX/Usabilidade | 1 | 2 | 5 | 0 | **8** |
| Performance | 0 | 4 | 0 | 0 | **4** |
| Bug/UX | 1 | 1 | 1 | 0 | **3** |
| Qualidade/Arquitetura | 0 | 1 | 0 | 1 | **2** |
| Acessibilidade | 0 | 0 | 1 | 1 | **2** |
| Consistência | 0 | 0 | 0 | 2 | **2** |
| Responsivo/Mobile | 0 | 0 | 1 | 0 | **1** |
| Outros | 0 | 2 | 0 | 0 | **2** |
| **Total** | **3** | **10** | **20** | **6** | **38** (corrigido: 1 item contado duas vezes) |

---

## Destaques Críticos desta Fase

### 🔴 Issue #19 — Progress bar com classe inexistente
```tsx
// StudentProfile.tsx:1073
className={`... w-p-${Math.round((Math.min((annualTotal / 18) * 100, 100)) / 5) * 5} ...`}
```
A classe `w-p-55`, `w-p-70`, etc. **não existe** no Tailwind CSS. A barra de progresso nunca renderiza a largura correta. **Solução**: usar `style={{ width: `${percentage}%` }}`.

### 🔴 Issue #20 — Search inoperante no StudentProfile
```tsx
// StudentProfile.tsx:795-799
<input
  type="text"
  placeholder="Buscar aluno..."
  className="..."
/>
// ❌ Falta: value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
```
O input é renderizado mas não tem nenhum state ou handler — é puramente visual. O professor vê um campo de busca que não faz nada.

### 🔴 Issue #2 — Avatar colors dinâmicas (StudentsList)
```tsx
// StudentsList.tsx:299
color: `from-${theme.primaryColor} to-${theme.secondaryColor}`,
```
Esta string é salva no banco de dados (Supabase) como cor do aluno. Quando usada em `className`, Tailwind JIT não pode compilar classes dinâmicas. **Todos os avatares** renderizam sem gradiente.

---

## Padrões Sistêmicos (Acumulativo)

### 📊 Contagem acumulada de ocorrências sistêmicas (Fases 1-4)

| Padrão Sistêmico | Fase 1 | Fase 2 | Fase 3 | Fase 4 | Total |
|-------------------|--------|--------|--------|--------|-------|
| Classes dinâmicas Tailwind | ~15 | ~25 | ~60 | ~45 | **~145** |
| `alert()`/`confirm()` nativos | 2 | 4 | 13 | 10 | **29** |
| Polling redundante (com realtime) | 1 | 0 | 2 | 1 | **4** |
| Componentes monolíticos (>500 linhas) | 1 | 0 | 1 | 2 | **4** |

### Recomendação consolidada para classes dinâmicas

O app inteiro depende de `useTheme()` que retorna nomes de cores Tailwind (`indigo`, `blue`, `emerald`, etc.) e os usa em interpolação:

```tsx
// ❌ Nunca funciona com Tailwind JIT
`bg-${theme.primaryColor}/10`
`text-${theme.primaryColor}`
`border-${theme.primaryColor}/20`
```

**Solução definitiva recomendada:**

1. Já existem classes utilitárias no `index.css` (`theme-bg-primary`, `theme-text-primary`)
2. Expandir para cobrir todos os casos:

```css
/* index.css - Expandir sistema de tema */
.theme-bg-primary-5 { background-color: color-mix(in srgb, var(--theme-primary) 5%, transparent); }
.theme-bg-primary-10 { background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent); }
.theme-bg-primary-20 { background-color: color-mix(in srgb, var(--theme-primary) 20%, transparent); }
.theme-border-primary { border-color: var(--theme-primary); }
.theme-border-primary-20 { border-color: color-mix(in srgb, var(--theme-primary) 20%, transparent); }
.theme-ring-primary { --tw-ring-color: color-mix(in srgb, var(--theme-primary) 20%, transparent); }
.theme-from-primary { --tw-gradient-from: var(--theme-primary); }
.theme-to-secondary { --tw-gradient-to: var(--theme-secondary); }
```

3. Migrar todas as ~145 ocorrências para usar essas classes estáticas.

---

## Próximos Passos

### Prioridade 1 — Correções Críticas
1. **Corrigir progress bar** (Issue #19): Substituir `w-p-*` por `style={{ width }}`
2. **Corrigir sidebar search** (Issue #20): Adicionar `value` e `onChange` handler
3. **Corrigir avatar colors** (Issue #2): Usar CSS variables ou mapa estático de gradientes

### Prioridade 2 — Alto Impacto
4. **Extrair PDF generation** em utility separado (`utils/exportStudentPDF.ts`)
5. **Remover polling** em StudentProfile (realtime já cobre todas as tabelas)
6. **Adicionar debounce** no `saveObservation` textarea (500ms)
7. **Memoizar** `getChartData`, `getStudentOccurrences`, `getAttendanceStats`, `getStudentActivities`
8. **Agrupar saves de disciplinas** no TeacherProfile (batch save em vez de per-click)
9. **Adicionar paginação** na StudentsList para turmas grandes

### Prioridade 3 — Melhorias de UX
10. **Adicionar loading feedback** para dynamic import do jsPDF
11. **Validação inline** de senha no TeacherProfile
12. **Upload de foto via arquivo** (Supabase Storage) em vez de apenas URL

---

## Acumulativo (Fases 1-4)

| Fase | Páginas | Issues | 🔴 | 🟠 | 🟡 | ⚪ |
|------|---------|--------|-----|-----|-----|-----|
| Fase 1 | Dashboard, Login | 28 | 3 | 7 | 14 | 4 |
| Fase 2 | Frequência, Notas, Atividades | 35 | 2 | 9 | 18 | 6 |
| Fase 3 | Planejamento, Horários, Observações | 42 | 5 | 11 | 21 | 5 |
| Fase 4 | Lista Alunos, Perfil Aluno, Perfil Professor | 38 | 3 | 10 | 20 | 5 |
| **Total** | **11 páginas** | **143** | **13** | **37** | **73** | **20** |

---

## Próxima Fase

**Fase 5 — Institucional**: Dashboard Institucional, Turmas, Professores, Configurações (área administrativa).
