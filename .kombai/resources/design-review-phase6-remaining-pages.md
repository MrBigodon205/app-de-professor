# 🔍 Auditoria UI/UX — Fase 6: Páginas Restantes & Componentes Especializados

**Aplicação:** Prof. Acerta+ 3.1  
**Data:** 11/02/2026  
**Páginas Analisadas:** 15 componentes  
**Issues Encontrados nesta Fase:** 47  
**Total Acumulado (Fases 1–6):** 226 issues  

---

## 📑 Páginas Cobertas nesta Fase

| # | Página | Módulo | Linhas | Complexidade |
|---|--------|--------|--------|-------------|
| 1 | `InstitutionalAIReports` | AI Reports | 382 | Alta |
| 2 | `InstitutionalAttendance` | GPS Attendance | 179 | Alta |
| 3 | `StudentAttendanceOverview` | Attendance Overview | 427 | Média |
| 4 | `InstitutionalCheckins` | GPS Check-ins | 525 | Alta |
| 5 | `InstitutionalEvents` | Eventos | 605 | Alta |
| 6 | `InstitutionalGrades` | Notas Institucionais | 463 | Média |
| 7 | `InstitutionalOccurrences` | Ocorrências | 372 | Média |
| 8 | `InstitutionalPlans` | Planejamentos | 732 | Alta |
| 9 | `InstitutionalPlanningTemplates` | Templates | 319 | Média |
| 10 | `DocxTemplateImporter` | Importador DOCX | 698 | Muito Alta |
| 11 | `InstitutionalReports` | Pareceres | 537 | Alta |
| 12 | `InstitutionalSchedule` | Grade Horária | 529 | Alta |
| 13 | `InstitutionalStudents` | Alunos Institucionais | 779 | Alta |
| 14 | `Instructions` | Manual do Professor | 444 | Baixa |
| 15 | `ResetPassword` | Autenticação | 193 | Baixa |
| 16 | `CreateInstitutionForm` | Autenticação | 99 | Baixa |
| 17 | `JoinInstitutionForm` | Autenticação | 114 | Baixa |

---

## 🚨 Issues Encontrados

### CRÍTICO (Severidade 5)

#### P6-001 | Dados Simulados no AI Reports — Análise de Risco Falsa
- **Arquivo:** `InstitutionalAIReports.tsx:88-89`
- **Problema:** Frequência e desempenho acadêmico são gerados com `Math.random()`. O módulo de "Inteligência Pedagógica" exibe dados fictícios como se fossem análises reais, potencialmente gerando decisões erradas sobre alunos.
- **Impacto:** Alto risco de desinformação pedagógica. Um coordenador pode tomar ações baseadas em dados falsos.
- **Recomendação:** Substituir por queries reais ao Supabase (média de notas, taxa de frequência real) ou exibir banner claro de "MODO DEMONSTRAÇÃO" até implementação completa.

#### P6-002 | Webcam sem Fallback — InstitutionalAttendance Quebra sem Câmera
- **Arquivo:** `InstitutionalAttendance.tsx:121-131`
- **Problema:** O componente `Webcam` é renderizado diretamente sem verificação de permissão de câmera. Se o usuário negar acesso ou o dispositivo não tiver câmera, a tela fica preta sem feedback.
- **Impacto:** Funcionalidade de registro de ponto completamente inutilizada em dispositivos sem câmera.
- **Recomendação:** Adicionar verificação de `navigator.mediaDevices`, fallback com upload de foto, e mensagem de erro clara.

#### P6-003 | `ClockIcon` Undefined — Erro de Runtime
- **Arquivo:** `InstitutionalAttendance.tsx:103`
- **Problema:** O componente referencia `<ClockIcon />` que é definido na linha 176 como um SVG inline, mas usa uma constante local ao invés do ícone do Lucide (`Clock` importado na linha 7 mas não usado no header).
- **Impacto:** Inconsistência — funciona, mas o ícone SVG inline é redundante quando `Clock` do Lucide já está importado.
- **Recomendação:** Remover o `ClockIcon` SVG inline e usar o `Clock` do Lucide importado.

#### P6-004 | Uso de `alert()` e `confirm()` Nativo — UX Destrutiva
- **Arquivos:** Múltiplos (8 ocorrências nos arquivos analisados)
  - `InstitutionalAttendance.tsx:75` — `alert("Erro ao registrar ponto...")`
  - `InstitutionalPlanningTemplates.tsx:69` — `alert("Este modelo foi criado...")`
  - `InstitutionalPlanningTemplates.tsx:87` — `confirm('Tem certeza?')`
  - `InstitutionalPlanningTemplates.tsx:93` — `alert('Dê um nome ao modelo')`
  - `InstitutionalPlanningTemplates.tsx:124` — `alert('Modelo salvo com sucesso!')`
  - `InstitutionalPlanningTemplates.tsx:126` — `alert('Erro ao salvar: ' + e.message)`
  - `InstitutionalStudents.tsx:243` — `alert('Erro ao salvar...')`
  - `InstitutionalPlans.tsx:414` — `alert('Erro ao gerar documento...')`
- **Impacto:** Bloqueia a thread principal, não segue o design system, impossível de estilizar, péssima UX mobile.
- **Recomendação:** Substituir por componente Toast/Notification reutilizável que já existe no app (`NotificationCenter`), ou criar um hook `useConfirm()` com modal personalizado.

---

### ALTO (Severidade 4)

#### P6-005 | Tailwind JIT Failure — Instructions.tsx (Caso mais grave)
- **Arquivo:** `Instructions.tsx` — ~30 ocorrências
- **Problema:** Uso massivo de interpolação dinâmica de classes Tailwind:
  ```
  bg-${theme.primaryColor}/5
  text-${theme.primaryColor}
  from-${theme.primaryColor} to-${theme.secondaryColor}
  border-${theme.primaryColor}/30
  shadow-${theme.primaryColor}/20
  ```
- **Impacto:** Nenhuma dessas classes será gerada pelo Tailwind JIT. Toda a página de Instruções terá cores fallback ou transparentes.
- **Recomendação:** Usar CSS custom properties com classes estáticas: `bg-primary/5`, `text-primary`, etc. — que já existem no design system do app.

#### P6-006 | Falta de Paginação — Listas com até 500+ registros
- **Arquivos:**
  - `StudentAttendanceOverview.tsx:98` — `limit(500)`
  - `InstitutionalOccurrences.tsx:85` — `limit(300)`
  - `InstitutionalCheckins.tsx:111` — `limit(200)`
  - `InstitutionalPlans.tsx:79` — `limit(200)`
- **Problema:** Dados carregados em bloco único sem paginação, virtualização ou lazy loading.
- **Impacto:** Performance degradada em escolas grandes. DOM pesado com centenas de `<tr>` ou `<motion.div>`.
- **Recomendação:** Implementar paginação server-side com Supabase `.range()` + componente de paginação reutilizável.

#### P6-007 | DocxTemplateImporter — Componente Monolítico de 698 linhas
- **Arquivo:** `DocxTemplateImporter.tsx`
- **Problema:** Componente único com responsabilidades múltiplas: upload de arquivo, renderização DOCX, renderização PDF, renderização HTML, drag-to-scroll, zoom, edição inline, overlay de campos, serialização de posições.
- **Impacto:** Impossível de testar, manter ou reutilizar. Alto risco de regressão.
- **Recomendação:** Decompor em sub-componentes: `FileUploader`, `DocxRenderer`, `PdfRenderer`, `FieldOverlayManager`, `ZoomControls`.

#### P6-008 | Modais sem Trap de Foco — Acessibilidade WCAG 2.1
- **Arquivos:** Todos os modais nos 15 arquivos analisados
- **Problema:** Nenhum modal implementa `focus trap`, `aria-modal="true"`, `role="dialog"`, ou fecha com `Escape`.
- **Impacto:** Usuários de teclado e leitores de tela não conseguem navegar nos modais.
- **Recomendação:** Criar componente `<Modal>` reutilizável com focus trap, aria labels, e `onKeyDown` para Escape.

#### P6-009 | Formulários sem Validação Visual
- **Arquivos:** `CreateInstitutionForm.tsx`, `JoinInstitutionForm.tsx`, `InstitutionalStudents.tsx`, `InstitutionalEvents.tsx`
- **Problema:** Campos obrigatórios não mostram indicação visual de erro além do `required` nativo. Nenhum feedback inline de validação.
- **Impacto:** Usuário não sabe qual campo está incorreto.
- **Recomendação:** Adicionar estados de erro por campo com mensagens descritivas e borda vermelha.

#### P6-010 | InstitutionalPlans — Export DOCX com `setFont(undefined!, 'bold')`
- **Arquivo:** `InstitutionalPlans.tsx:167-168`
- **Problema:** Uso de `doc.setFont(undefined!, 'bold')` com assertion `!` em parâmetro `undefined`. Isso pode falhar em versões futuras do jsPDF.
- **Impacto:** Potencial crash durante exportação de PDF individual.
- **Recomendação:** Substituir por `doc.setFont('helvetica', 'bold')` com font name explícito.

---

### MÉDIO (Severidade 3)

#### P6-011 | Tabelas não Responsivas
- **Arquivos:** `InstitutionalAIReports.tsx`, `StudentAttendanceOverview.tsx`, `InstitutionalGrades.tsx`, `InstitutionalSchedule.tsx`
- **Problema:** Tabelas com `overflow-x-auto` mas sem layout alternativo para mobile. Em telas pequenas, a informação fica truncada e difícil de ler.
- **Recomendação:** Implementar card layout para mobile usando breakpoint `md:` — mostrar tabela em desktop e cards empilhados em mobile.

#### P6-012 | Padrão de Filtros Repetido — 0 Reutilização
- **Arquivos:** 8 dos 15 componentes têm blocos de filtros (search + date range + type) implementados independentemente.
- **Problema:** ~300 linhas de código duplicado entre `InstitutionalCheckins`, `InstitutionalOccurrences`, `InstitutionalGrades`, `StudentAttendanceOverview`, `InstitutionalEvents`, `InstitutionalReports`, `InstitutionalPlans`, `InstitutionalAIReports`.
- **Recomendação:** Criar componentes reutilizáveis: `<SearchFilter>`, `<DateRangeSelector>`, `<TypeFilter>`.

#### P6-013 | Padrão de Export PDF Repetido — 0 Reutilização
- **Arquivos:** 7 componentes implementam exportação PDF com `jsPDF` + `autoTable` de forma idêntica.
- **Problema:** Cada componente reimplementa header, logo, formatação. ~50 linhas duplicadas por arquivo = ~350 linhas totais.
- **Recomendação:** Criar utilitário `generatePdfReport({ title, school, columns, data })`.

#### P6-014 | Spinner de Loading Duplicado
- **Arquivos:** Todos os 15 componentes têm implementação própria de loading spinner.
- **Problema:** Variações entre `animate-spin h-8 w-8`, `h-12 w-12`, cores diferentes (`border-indigo-600` vs `border-primary`).
- **Recomendação:** Usar `<LoadingSpinner />` que já existe em `components/LoadingSpinner.tsx`.

#### P6-015 | InstitutionalSchedule — Hardcoded Time Slots
- **Arquivo:** `InstitutionalSchedule.tsx:54-60`
- **Problema:** Horários fixos (07:30-12:00) definidos como constante. Escolas com turnos diferentes não podem personalizar.
- **Recomendação:** Tornar os time slots configuráveis por escola, salvos no Supabase.

#### P6-016 | SUBJECT_COLORS Hardcoded
- **Arquivo:** `InstitutionalSchedule.tsx:62-75`
- **Problema:** Mapa de cores por disciplina é fixo. Disciplinas não listadas recebem `bg-slate-500`.
- **Recomendação:** Permitir configuração de cores por disciplina na interface de administração.

#### P6-017 | InstitutionalStudents — Formulário Modal Extenso
- **Arquivo:** `InstitutionalStudents.tsx:519-705`
- **Problema:** Modal de cadastro de aluno tem ~180 linhas de JSX inline. Mistura dados pessoais, inclusão e responsável em uma só tela sem steppers.
- **Recomendação:** Decompor em `<StudentPersonalInfo>`, `<StudentInclusionSection>`, `<ParentInfoSection>`, ou usar wizard/stepper.

#### P6-018 | InstitutionalReports — Star Rating sem Acessibilidade
- **Arquivo:** `InstitutionalReports.tsx:443-462`
- **Problema:** Botões de rating (estrelas) não têm `aria-label` descritivo. Um leitor de tela não consegue identificar o propósito.
- **Recomendação:** Adicionar `aria-label={`${label}: ${score} de 5`}` em cada botão.

#### P6-019 | Eventos — N+1 Query para View Counts
- **Arquivo:** `InstitutionalEvents.tsx:89-98`
- **Problema:** Para cada evento, uma query separada é feita para contar visualizações (`Promise.all` com N queries).
- **Impacto:** Se há 50 eventos, são 51 queries ao Supabase.
- **Recomendação:** Usar uma view materializada no Supabase ou agregar counts com `.select('*, event_views(count)')`.

#### P6-020 | Event Type Color — CSS Class Interpolation
- **Arquivo:** `InstitutionalEvents.tsx:387`
- **Problema:** `${typeInfo.color}/10` e `${typeInfo.color.replace('bg-', 'text-')}` são manipulações de string de classe Tailwind que não serão compiladas.
- **Recomendação:** Usar objetos com classes completas pré-definidas ao invés de manipulação de string.

---

### BAIXO (Severidade 2)

#### P6-021 | CreateInstitutionForm — Formulário Mínimo
- **Arquivo:** `CreateInstitutionForm.tsx`
- **Problema:** Apenas campo "Nome" para criar escola. Faltam campos úteis como endereço, CNPJ, telefone, logo.
- **Recomendação:** Adicionar campos opcionais em uma segunda etapa (wizard) ou na página de configurações.

#### P6-022 | JoinInstitutionForm — Sem Preview da Escola
- **Arquivo:** `JoinInstitutionForm.tsx`
- **Problema:** Após validar o código, o usuário é redirecionado direto sem ver o nome da escola. Os dados `institutions(name)` são buscados mas não exibidos.
- **Recomendação:** Mostrar confirmação "Você está entrando na escola X. Confirmar?" antes do redirect.

#### P6-023 | ResetPassword — Falta Indicador de Força da Senha
- **Arquivo:** `ResetPassword.tsx`
- **Problema:** Apenas valida `length >= 6`. Não mostra indicador visual de força (fraca/média/forte).
- **Recomendação:** Adicionar barra de força de senha com critérios visuais.

#### P6-024 | Instructions — Dynamic Classes Generalizado
- **Arquivo:** `Instructions.tsx:98, 119, 136, 155, 163`
- **Problema:** Componentes `Step`, `TipCard`, `QuickAction` todos usam `bg-${theme.primaryColor}` que não compila.
- **Nota:** Já reportado em P6-005 mas merece item separado por ser um padrão sistêmico.

#### P6-025 | InstitutionalAttendance — `window.location.href` ao invés de `navigate()`
- **Arquivo:** `InstitutionalDashboard.tsx:59`
- **Problema:** `window.location.href = '/dashboard'` causa reload completo da SPA ao invés de usar React Router.
- **Recomendação:** Substituir por `navigate('/dashboard')`.

#### P6-026 | InstitutionalDashboard — Emoji em Botões
- **Arquivo:** `InstitutionalDashboard.tsx:152-158`
- **Problema:** Botões de acesso rápido usam emojis (📅, 👥, 📋) ao invés de ícones do design system.
- **Recomendação:** Substituir por ícones Lucide (`Calendar`, `Users`, `FileText`).

#### P6-027 | Inconsistência de Ícones — Material Symbols vs Lucide
- **Arquivos:** `Instructions.tsx` usa Material Symbols, `DocxTemplateImporter.tsx` mistura ambos.
- **Problema:** Mesma inconsistência reportada nas fases anteriores mas ainda mais prevalente nestas páginas.
- **Recomendação:** Padronizar em Lucide (ou Material) para todo o módulo institucional.

---

### INFORMATIVO (Severidade 1)

#### P6-028–P6-047 | Outros Achados Menores

| # | Issue | Arquivo | Descrição |
|---|-------|---------|-----------|
| 028 | Loading state inconsistente | Múltiplos | Alguns usam `LoadingSpinner`, outros inline `animate-spin` |
| 029 | Dark mode parcial | `CreateInstitutionForm` | Classes `dark:` presentes mas inconsistentes |
| 030 | Falta de empty state ilustrado | `InstitutionalSchedule` | Sem turma selecionada não mostra mensagem |
| 031 | Textarea sem auto-resize | `InstitutionalEvents` | Campo descrição tem `rows={3}` fixo |
| 032 | Sem skeleton loading | `InstitutionalGrades` | Transição abrupta de spinner para conteúdo |
| 033 | Botão sem disabled state visual | `InstitutionalSchedule:391` | `disabled={!isCoordinator}` sem feedback visual |
| 034 | Console.log em produção | `Dashboard.tsx:658` | `console.log("♻️ Triggering Debounced..."` |
| 035 | Código duplicado `setUpcomingActivities` | `Dashboard.tsx:509-511` | Chamado 2 vezes seguidas |
| 036 | Código duplicado `setClassPlans` | `Dashboard.tsx:449-452` | Chamado 2 vezes seguidas |
| 037 | DocxTemplateImporter `createPortal` | Line 275 | Renderiza fora da árvore React, perde contexto de tema |
| 038 | PDF Worker via unpkg CDN | `DocxTemplateImporter.tsx:26` | Dependência externa sem fallback offline |
| 039 | `type` attribute missing em forms | `InstitutionalEvents.tsx:476` | Input text sem `type` explícito |
| 040 | Falta `key` única em listas | `InstitutionalGrades.tsx` | Usa `g.id` que pode colidir entre unidades |
| 041 | `title` attribute vazio | Múltiplos modais | Botões de fechar com `title="Fechar"` mas sem `aria-label` |
| 042 | Geofence modal sem backdrop click | `InstitutionalCheckins.tsx:427` | Fecha no click do backdrop mas não tem keyboard trap |
| 043 | Transfer modal sem loading state | `InstitutionalStudents.tsx:248` | Operação async sem indicador de progresso |
| 044 | Birthday filter bug potencial | `InstitutionalStudents.tsx:159` | `split('-').map(Number)` pode falhar se `birth_date` formato inesperado |
| 045 | InstitutionalPlans header vazio | `InstitutionalPlans.tsx:429-431` | `<div>` de header sem conteúdo |
| 046 | Textos hardcoded sem i18n | Todos | Todos os textos em português sem internacionalização |
| 047 | `useEffect` sem deps corretas | `InstitutionalPlanningTemplates.tsx:37` | `currentSchool?.id` na dep mas `loadTemplates` usa closure |

---

## 📊 Distribuição de Severidade — Fase 6

| Severidade | Contagem | % |
|-----------|----------|---|
| 🔴 Crítico (5) | 4 | 9% |
| 🟠 Alto (4) | 6 | 13% |
| 🟡 Médio (3) | 10 | 21% |
| 🔵 Baixo (2) | 7 | 15% |
| ⚪ Informativo (1) | 20 | 43% |
| **Total** | **47** | **100%** |

---

## 🔄 Padrões Sistêmicos Confirmados (Cross-Phase)

Estes padrões foram detectados nas Fases 1–5 e agora RECONFIRMADOS com dados adicionais:

| Padrão | Ocorrências Totais | Fases Afetadas |
|--------|-------------------|----------------|
| Dynamic Tailwind class interpolation | ~175+ instâncias | 1, 2, 3, 4, 5, 6 |
| Uso de `alert()`/`confirm()` nativo | 15+ ocorrências | 3, 5, 6 |
| Componentes monolíticos (>500 linhas) | 5 arquivos | 3, 4, 6 |
| Falta de paginação em listas | 8 páginas | 4, 5, 6 |
| Spinner de loading não-padronizado | 15+ variações | Todas |
| Export PDF duplicado sem utilitário | 7 implementações | 5, 6 |
| Modais sem acessibilidade (focus trap) | 12+ modais | Todas |
| Ícones misturados (Material + Lucide) | 10+ páginas | Todas |

---

## 💡 Wireframes — Esta Fase

Dado o volume de páginas nesta fase (15 componentes) e que muitas seguem padrões já redesenhados em fases anteriores (filtros + tabela + export), **recomendamos aplicar os padrões dos wireframes existentes** ao invés de criar 15 wireframes individuais. Os componentes que mais se beneficiariam de wireframes dedicados são:

1. **InstitutionalAIReports** — Design único de "painel de risco" que merece reimaginação
2. **InstitutionalAttendance (GPS)** — Fluxo de câmera + GPS que precisa de UX mobile-first
3. **InstitutionalSchedule** — Grade horária visual que precisa de redesign responsivo

Os demais seguem o padrão "header + filtros + tabela/lista + export" já coberto.
