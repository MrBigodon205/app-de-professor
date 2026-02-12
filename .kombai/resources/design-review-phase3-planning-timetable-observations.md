# Revisão de Design UI/UX — Fase 3: Planejamento, Horários & Observações

**Data da Revisão**: 11 de Fevereiro de 2026  
**Rotas**: `/planning`, `/timetable`, `/observations`  
**Áreas Analisadas**: Design Visual, UX/Usabilidade, Responsivo/Mobile, Acessibilidade, Micro-interações, Consistência, Performance

## Resumo Executivo

A Fase 3 analisa três páginas de ferramentas organizacionais do professor. Os problemas sistêmicos identificados nas fases anteriores (classes dinâmicas do Tailwind incompatíveis com JIT, hardcoded colors, polling agressivo) se repetem aqui com intensidade agravada. A página de **Planejamento** é o caso mais crítico com **2.364 linhas** em um único componente — violando toda boa prática de componentização. A **Grade Horária** tem o mesmo padrão de classes dinâmicas no `getSubjectTheme()`, e as **Observações** repetem o polling de 10 segundos. Foram identificados **42 problemas** nesta fase, incluindo 5 críticos e 11 de alto impacto.

---

## Issues

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|----------|
| **PLANEJAMENTO** | | | | |
| 1 | Componente monolítico de 2.364 linhas — extremamente difícil de manter, testar e debugar. Deve ser dividido em ≥10 sub-componentes (PlanSidebar, PlanForm, PlanView, PlanPDFExport, PlanWordExport, TemplateSelector, etc.) | 🔴 Crítico | Qualidade/Arquitetura | `pages/Planning.tsx` (todo o arquivo) |
| 2 | Branding institucional hardcoded "CENSC" e "MOISÉS FERREIRA" nos exports PDF/Word — impossibilita reutilização por outros professores/escolas | 🔴 Crítico | UX/Usabilidade | `Planning.tsx:906-907, 1139, 2188` |
| 3 | `alert()` nativo usado para feedback de sucesso/erro em 8 locais — bloqueia a thread da UI e não segue padrão de design system | 🔴 Crítico | UX/Usabilidade | `Planning.tsx:211, 407, 615, 631, 697, 704, 727, 729` |
| 4 | 40+ classes dinâmicas do Tailwind (`bg-${theme.primaryColor}`, `text-${theme.primaryColor}`, `ring-${theme.primaryColor}`, etc.) que não são compiladas pelo JIT — resultam em classes CSS ausentes | 🔴 Crítico | Design Visual | `Planning.tsx:1337, 1347, 1358, 1411-1412, 1416, 1424, 1429, 1434, 1446, 1450, 1474, 1558, 1661, 1676, 1716, 1721, 1754, 1757, 1771, 1776, 1788-1789, 1797` |
| 5 | Comentários de desenvolvimento deixados em produção incluindo TODO notes, "Build trigger" e notas sobre migrações de banco | 🟠 Alto | Qualidade de Código | `Planning.tsx:335-365, 846-868, 2364` |
| 6 | `stripHtmlAndDecode()` duplicada da Dashboard — cria elemento DOM para parsear HTML (risco XSS) | 🟠 Alto | Segurança/Performance | `Planning.tsx:770-775` |
| 7 | Polling de 10 segundos via `setInterval` — gasto de rede desnecessário, realtime subscription já está configurado | 🟠 Alto | Performance | `Planning.tsx:370` |
| 8 | Nenhuma validação no formulário antes de salvar — campos título e datas podem ficar vazios | 🟠 Alto | UX/Usabilidade | `Planning.tsx:517-635` |
| 9 | Sidebar do planejamento esconde completamente no mobile quando um plano é selecionado — botão de voltar pouco visível no header gradient | 🟡 Médio | Responsivo/Mobile | `Planning.tsx:1279, 1867-1875` |
| 10 | `handleDownload()` cria e remove elemento `<a>` sem chamar `.click()` no caso de base64 — download não funciona | 🟠 Alto | Bug/UX | `Planning.tsx:739-762` (`.click()` ausente na linha ~751) |
| 11 | `selectedPlanId === plan.id` comparação com cores dinâmicas no card (`text-${theme.primaryColor}`) — card ativo pode não ter destaque visual | 🟡 Médio | Design Visual | `Planning.tsx:1424` |
| 12 | Layout desktop usa `lg:w-80` (320px) para sidebar + flex-1 para conteúdo — proporção não ideal para formulário longo | 🟡 Médio | Design Visual | `Planning.tsx:1279` |
| 13 | Editor RichText não tem `aria-label` — inacessível para leitores de tela | 🟡 Médio | Acessibilidade | `Planning.tsx:1734, 1740` |
| 14 | Botões de export (PDF, Word, Clone, Edit, Delete) sem `aria-label` descritivo — apenas `title` attribute | 🟡 Médio | Acessibilidade | `Planning.tsx:1879-1913` |
| 15 | Template selector modal não fecha com ESC e não retém foco — não é keyboard-accessible | 🟡 Médio | Acessibilidade | `Planning.tsx:2304-2358` |
| 16 | Duplicação de lógica de cabeçalho PDF/Word — mesmas informações formatadas de forma diferente em 3 locais (PDF, Word HTML, printable-content) | 🟡 Médio | Qualidade/Manutenção | `Planning.tsx:870-937 vs 1111-1153 vs 2154-2196` |
| 17 | CSS class `shadow-premium` referenciada mas não definida no index.css — possivelmente estilo ausente | ⚪ Baixo | Consistência | `Planning.tsx:1466` |
| 18 | Markdown `**` texto no JSX não é renderizado (`**Sincronização Preditiva**`) | ⚪ Baixo | Design Visual | `Planning.tsx:269` (referenciado via Timetable) |
| **GRADE HORÁRIA** | | | | |
| 19 | `getSubjectTheme()` retorna classes Tailwind construídas dinamicamente (`bg-${color}-500/10`, `text-${color}-600`) — falha no JIT compiler | 🔴 Crítico | Design Visual | `Timetable.tsx:201-213` |
| 20 | Grid desktop hardcoded para 5 colunas (`grid-cols-[80px_repeat(5,1fr)]`) mas número de dias visíveis é configurável — grid quebra se ≠ 5 dias habilitados | 🟠 Alto | Bug/UX | `Timetable.tsx:354, 368` |
| 21 | `alert()` nativo usado para erros de CRUD | 🟠 Alto | UX/Usabilidade | `Timetable.tsx:170, 194` |
| 22 | Breadcrumb usa classe dinâmica `text-${theme.primaryColor}` e `hover:text-${theme.primaryColor}` — cor não renderizada | 🟡 Médio | Design Visual | `Timetable.tsx:262-264` |
| 23 | Config modal: horários de aula não validam sobreposição — usuário pode criar slots 07:00-08:00 e 07:30-08:30 | 🟡 Médio | UX/Usabilidade | `Timetable.tsx:225-248` |
| 24 | Config modal: botão "Concluir e Salvar" sugere save remoto, mas dados são salvos no localStorage — confusão semântica | 🟡 Médio | UX/Usabilidade | `Timetable.tsx:596-600` |
| 25 | Config modal: toggle de dias usa classes dinâmicas (`bg-${theme.primaryColor}/10`, `border-${theme.primaryColor}`) | 🟡 Médio | Design Visual | `Timetable.tsx:541-543` |
| 26 | Slot vazio no desktop mostra apenas `+` sem text label — pode não ser claro para novos usuários | ⚪ Baixo | UX/Usabilidade | `Timetable.tsx:407` |
| 27 | Markdown `**` na descrição não é renderizado como bold no JSX | ⚪ Baixo | Design Visual | `Timetable.tsx:269` |
| 28 | Nenhum feedback visual quando dados estão sendo salvos no servidor (ausência de loading state no slot) | 🟡 Médio | Micro-interações | `Timetable.tsx:121-173` |
| 29 | Botões da seleção de classe no modal usam classes dinâmicas (`hover:border-${theme.primaryColor}`) | 🟡 Médio | Design Visual | `Timetable.tsx:490` |
| 30 | Sem legend/legenda de cores para identificar disciplinas rapidamente | 🟡 Médio | UX/Usabilidade | `Timetable.tsx` (global) |
| **OBSERVAÇÕES** | | | | |
| 31 | Polling agressivo de 10 segundos — consome rede e bateria, especialmente em mobile | 🟠 Alto | Performance | `Observations.tsx:155-159` |
| 32 | `if (sError) throw sError;` duplicado 2x consecutivas + `if (occError) throw occError;` duplicado 2x | 🟡 Médio | Qualidade de Código | `Observations.tsx:73-74, 86-87` |
| 33 | Loading spinner usa classes dinâmicas `border-${theme.primaryColor}/20` e `border-t-${theme.primaryColor}` | 🟡 Médio | Design Visual | `Observations.tsx:352` |
| 34 | Empty state e header usam classes dinâmicas (`bg-${theme.primaryColor}/10`, `text-${theme.primaryColor}`) | 🟡 Médio | Design Visual | `Observations.tsx:359-361, 420-421` |
| 35 | `alert()` nativo usado para erros de save e delete | 🟠 Alto | UX/Usabilidade | `Observations.tsx:222, 304` |
| 36 | Tabs usam classes dinâmicas para estado ativo (`text-${theme.primaryColor}`) | 🟡 Médio | Design Visual | `Observations.tsx:463, 470` |
| 37 | Search input e textarea usam `focus:border-${theme.primaryColor}` e `focus:ring-${theme.primaryColor}/10` | 🟡 Médio | Design Visual | `Observations.tsx:387-388, 622-623` |
| 38 | Typo no placeholder: "pedágogicos" → deveria ser "pedagógicos" | ⚪ Baixo | UX/Usabilidade | `Observations.tsx:621` |
| 39 | `setSelectedStudentId('')` chamado após fetch resetando seleção (conflito com seleção do usuário) | 🟡 Médio | Bug/UX | `Observations.tsx:108` |
| 40 | Formulário de ocorrência não valida campo obrigatório com feedback inline — só desabilita botão silenciosamente | 🟡 Médio | UX/Usabilidade | `Observations.tsx:630-631` |
| 41 | `delay-stagger-${idx % 11}` — classe CSS dinâmica que provavelmente não existe no CSS | ⚪ Baixo | Design Visual | `Observations.tsx:519` |
| 42 | Form accent bar (`.form-accent`) com `w-2` no formulário mas com `opacity-20` — impacto visual quase nulo | ⚪ Baixo | Design Visual | `Observations.tsx:570-571` |

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
| Design Visual | 2 | 0 | 10 | 2 | **14** |
| UX/Usabilidade | 1 | 4 | 4 | 1 | **10** |
| Qualidade/Arquitetura | 1 | 1 | 2 | 0 | **4** |
| Performance/Segurança | 0 | 3 | 0 | 0 | **3** |
| Acessibilidade | 0 | 0 | 3 | 0 | **3** |
| Bug/UX | 0 | 2 | 1 | 0 | **3** |
| Micro-interações | 0 | 0 | 1 | 0 | **1** |
| Consistência | 0 | 0 | 0 | 1 | **1** |
| Outros | 1 | 1 | 0 | 1 | **3** |
| **Total** | **5** | **11** | **21** | **5** | **42** |

---

## Padrões Sistêmicos (Repetidos das Fases 1 e 2)

### 🔄 Classes Dinâmicas do Tailwind (SISTÊMICO — 60+ ocorrências nesta fase)

O padrão `bg-${theme.primaryColor}`, `text-${theme.primaryColor}`, etc. agora foi encontrado em **todas as 8 páginas analisadas**. Recomendação: Criar um mapa de classes CSS estáticas no `index.css` ou usar CSS custom properties com classes predefinidas.

**Solução proposta:**
```css
/* index.css — theme utility classes */
.theme-text-primary { color: var(--theme-primary); }
.theme-bg-primary { background-color: var(--theme-primary); }
.theme-bg-primary-10 { background-color: color-mix(in srgb, var(--theme-primary) 10%, transparent); }
.theme-border-primary { border-color: var(--theme-primary); }
.theme-ring-primary { --tw-ring-color: var(--theme-primary); }
```
> **Nota**: Algumas dessas classes já existem no `index.css` (`theme-text-primary`, `theme-bg-primary`) mas não são usadas consistentemente.

### 🔄 `alert()` Nativo (SISTÊMICO — 13 ocorrências nesta fase)

Encontrado em Planning (8x), Timetable (2x) e Observations (3x). Deve ser substituído por um sistema de toast notifications usando Framer Motion (já instalado).

### 🔄 Polling Agressivo (SISTÊMICO)

- Planning: 10s `setInterval`
- Observations: 10s `setInterval`  
- Dashboard (Fase 1): 5min `setInterval`

Os realtime subscriptions do Supabase já estão configurados, tornando o polling redundante.

---

## Próximos Passos

### Prioridade 1 — Correções Críticas
1. **Refatorar Planning.tsx**: Dividir em sub-componentes (PlanSidebar, PlanForm, PlanViewMode, PlanExportPDF, PlanExportWord, TemplateSelector, TemplatePicker)
2. **Eliminar branding hardcoded**: Criar configuração por escola/usuário para dados de cabeçalho dos exports
3. **Substituir `alert()` por toast system**: Implementar componente Toast reutilizável
4. **Corrigir `getSubjectTheme()`**: Usar mapa estático de classes CSS ou CSS variables

### Prioridade 2 — Alto Impacto
5. **Corrigir grid dinâmico do Timetable**: Usar `grid-template-columns: 80px repeat(${visibleDays.length}, 1fr)` via style prop
6. **Remover polling redundante**: Manter apenas realtime subscriptions
7. **Corrigir `handleDownload()`**: Adicionar `.click()` faltante
8. **Adicionar validação de formulário**: Feedback inline nos campos obrigatórios

### Prioridade 3 — Melhorias de Consistência
9. **Migrar todas as classes dinâmicas** para classes utilitárias `theme-*`
10. **Limpar código morto**: Remover comentários de desenvolvimento, duplicações, e "Build trigger"
11. **Adicionar legend de cores** na Grade Horária

### Fase 4 (Próxima Iteração)
Revisão das páginas de Lista de Alunos, Perfil do Aluno e Perfil do Professor.

---

## Acumulativo (Fases 1-3)

| Fase | Páginas | Issues | 🔴 | 🟠 | 🟡 | ⚪ |
|------|---------|--------|-----|-----|-----|-----|
| Fase 1 | Dashboard, Login | 28 | 3 | 7 | 14 | 4 |
| Fase 2 | Frequência, Notas, Atividades | 35 | 2 | 9 | 18 | 6 |
| Fase 3 | Planejamento, Horários, Observações | 42 | 5 | 11 | 21 | 5 |
| **Total** | **8 páginas** | **105** | **10** | **27** | **53** | **15** |
