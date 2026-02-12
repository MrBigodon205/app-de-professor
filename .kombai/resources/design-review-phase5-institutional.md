# Revisão de Design UI/UX — Fase 5: Módulo Institucional

**Data da Revisão**: 11 de Fevereiro de 2026  
**Rotas**: `/institution/:id/dashboard`, `/institution/:id/classes`, `/institution/:id/teachers`, `/institution/:id/settings`  
**Áreas Analisadas**: Design Visual, UX/Usabilidade, Responsivo/Mobile, Acessibilidade, Micro-interações, Consistência, Performance

## Resumo Executivo

A Fase 5 analisa o módulo institucional — a área administrativa do Prof. Acerta+ usada por coordenadores e professores dentro de uma escola. O módulo contém 4 páginas principais + o componente `InviteManager`.

**Achado mais crítico**: O Dashboard Institucional exibe **métricas 100% hardcoded** (12 professores, 450 alunos, 92% presença, 3 ocorrências) — criando uma ilusão de funcionalidade que nunca reflete dados reais. O gráfico central é um placeholder vazio com texto "será implementado aqui".

**Ponto positivo**: `InstitutionSettings.tsx` é a **página mais bem implementada de todo o módulo** — usa Framer Motion corretamente, design tokens semânticos (`text-text-primary`, `bg-surface-card`), tabs animados, modal com backdrop, e ARIA labels nos inputs. É o "padrão ouro" que as outras páginas deveriam seguir.

**Divergência sistêmica**: Este módulo usa **Lucide icons** (`Users`, `GraduationCap`, `Shield`, etc.) enquanto o resto do app usa **Material Symbols**. Isso cria inconsistência visual e aumenta o bundle size com duas bibliotecas de ícones.

Foram identificados **36 problemas**, incluindo **5 críticos** e **11 de alto impacto**.

---

## Issues

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|-------------|
| **DASHBOARD INSTITUCIONAL** | | | | |
| 1 | Métricas KPI 100% hardcoded — "12 Professores", "450 Alunos", "92% Presença", "3 Ocorrências" nunca refletem dados reais do Supabase | 🔴 Crítico | Bug/UX | `InstitutionalDashboard.tsx:90-129` |
| 2 | Área principal "Visão Geral da Escola" é um placeholder vazio com texto "Gráficos de desempenho serão implementados aqui" — ocupa 400px de altura sem conteúdo | 🔴 Crítico | UX/Design | `InstitutionalDashboard.tsx:133-138` |
| 3 | Usa **Lucide icons** (`Users`, `GraduationCap`, `Calendar`, `Clock`, `MapPin`) enquanto todo o restante do app usa **Material Symbols** — inconsistência de icon library | 🟠 Alto | Consistência | `InstitutionalDashboard.tsx:5` |
| 4 | Botões de "Acesso Rápido" usam emojis (📅 👥 📋) em vez de ícones do design system — visualmente inconsistente e inacessível para screen readers | 🟠 Alto | Acessibilidade/Consistência | `InstitutionalDashboard.tsx:151-159` |
| 5 | Botões de Acesso Rápido não têm `onClick` handlers funcionais — são elementos decorativos sem ação | 🟠 Alto | UX/Bug | `InstitutionalDashboard.tsx:151-159` |
| 6 | Header usa `text-gray-900` sem variante `dark:` — texto invisível em dark mode | 🟡 Médio | Design Visual | `InstitutionalDashboard.tsx:76` |
| 7 | Cores hardcoded (`text-indigo-600`, `text-purple-600`, `text-blue-600`, `text-orange-600`) em vez de design tokens semânticos (`text-primary`, `text-secondary`) | 🟡 Médio | Consistência | `InstitutionalDashboard.tsx:94, 106, 115, 125` |
| 8 | Grid de métricas usa `md:grid-cols-4` — em telas médias (768-1024px), cards ficam muito estreitos (~170px) | 🟡 Médio | Responsivo | `InstitutionalDashboard.tsx:90` |
| 9 | Loading state é apenas um spinner sem skeleton — não dá indicação da estrutura da página | 🟡 Médio | UX/Micro-interações | `InstitutionalDashboard.tsx:11` |
| 10 | Ação de coordenação no header está vazia (`{/* Actions like "Edit School" could go here */}`) — div fantasma renderizada sem conteúdo | ⚪ Baixo | Qualidade de Código | `InstitutionalDashboard.tsx:83-85` |
| 11 | Estado "Aguardando Atribuição" usa `window.location.href` para navegação em vez de React Router `navigate()` — causa full page reload | 🟡 Médio | Performance/UX | `InstitutionalDashboard.tsx:59` |
| 12 | Mistura de icon systems no estado "Aguardando Atribuição": usa Lucide `Clock` no badge mas `material-symbols-outlined arrow_back` no botão | 🟡 Médio | Consistência | `InstitutionalDashboard.tsx:48, 62` |
| **LISTA DE TURMAS** | | | | |
| 13 | `confirm()` nativo usado para confirmação de delete — sem modal customizado, quebrando o padrão visual do app | 🟠 Alto | UX/Acessibilidade | `ClassesList.tsx:45` |
| 14 | `alert()` nativo usado para erro de exclusão | 🟠 Alto | UX/Acessibilidade | `ClassesList.tsx:53` |
| 15 | Contadores de "Disciplinas: --" e "Alunos: --" são placeholders estáticos — nunca fazem fetch de dados reais | 🔴 Crítico | Bug/UX | `ClassesList.tsx:128-129` |
| 16 | Botões de ação (Edit, Delete, Subjects) usam `opacity-0 group-hover:opacity-100` — **inacessíveis por teclado** e invisíveis em dispositivos touch/mobile | 🟠 Alto | Acessibilidade/Mobile | `ClassesList.tsx:101` |
| 17 | Usa Lucide icons (`Plus`, `Edit2`, `Trash2`, `BookOpen`) — inconsistente com Material Symbols do app | 🟡 Médio | Consistência | `ClassesList.tsx:4` |
| 18 | Sem loading skeleton — tela aparece vazia até o fetch completar | 🟡 Médio | UX/Micro-interações | `ClassesList.tsx:57` |
| 19 | Delete handler não verifica se turma tem alunos/disciplinas vinculadas antes de excluir — risco de data loss silencioso | 🟠 Alto | UX/Segurança | `ClassesList.tsx:44-55` |
| 20 | Empty state "Nenhuma turma cadastrada" não tem ícone ilustrativo — apenas texto | ⚪ Baixo | Design Visual | `ClassesList.tsx:81-90` |
| 21 | Card usa `rounded-xl` enquanto Dashboard usa `rounded-2xl` e Settings usa `rounded-2xl` — inconsistência de border-radius | ⚪ Baixo | Consistência | `ClassesList.tsx:94` |
| **LISTA DE PROFESSORES** | | | | |
| 22 | `console.log("Raw teachers data:", data)` expondo dados sensíveis (nomes, emails, fotos) no console de produção | 🔴 Crítico | Segurança | `TeachersList.tsx:45` |
| 23 | Tabela HTML não é responsiva — em mobile, colunas ficam comprimidas/cortadas sem scroll horizontal | 🔴 Crítico | Responsivo/Mobile | `TeachersList.tsx:113-184` |
| 24 | `alert()` nativo usado para erro ao alterar status do professor | 🟠 Alto | UX/Acessibilidade | `TeachersList.tsx:87` |
| 25 | Usa Lucide icons (`Users`, `MoreVertical`, `Shield`, `UserX`, `UserCheck`) — inconsistente com app | 🟡 Médio | Consistência | `TeachersList.tsx:5` |
| 26 | Tabela sem paginação — pode ter dezenas de professores renderizados de uma vez | 🟡 Médio | Performance | `TeachersList.tsx:123-183` |
| 27 | InviteManager integrado inline no header — em mobile, o componente empurra o título para cima causando layout quebrado | 🟡 Médio | Responsivo | `TeachersList.tsx:104-108` |
| 28 | Avatar fallback mostra apenas inicial sem cor semântica — todos os fallbacks parecem iguais (`bg-indigo-100`) | ⚪ Baixo | Design Visual | `TeachersList.tsx:135-140` |
| 29 | Toggle status não tem confirmação — um click acidental pode suspender um professor sem aviso | 🟡 Médio | UX/Segurança | `TeachersList.tsx:170-178` |
| 30 | Sem busca/filtro de professores — difícil encontrar professor específico em escola com muitos docentes | 🟡 Médio | UX/Usabilidade | `TeachersList.tsx` (ausente) |
| **CONFIGURAÇÕES INSTITUCIONAIS** | | | | |
| 31 | Botão "Salvar Configurações" não dá feedback de sucesso — sem toast/snackbar após salvar | 🟠 Alto | UX/Micro-interações | `InstitutionSettings.tsx:94-113` |
| 32 | Botão "Salvar" fica no topo — em mobile, usuário configura tudo embaixo e precisa scrollar de volta ao topo para salvar | 🟡 Médio | UX/Mobile | `InstitutionSettings.tsx:225-243` |
| 33 | Tabs não são responsivas — em mobile estreito, textos dos tabs podem ficar truncados ou causar overflow horizontal | 🟡 Médio | Responsivo | `InstitutionSettings.tsx:247-265` |
| 34 | Custom formula editor não valida a fórmula — usuário pode digitar qualquer texto sem feedback de erro | 🟡 Médio | UX/Validação | `InstitutionSettings.tsx:353-361` |
| 35 | `removeComponent` permite remover componentes padrão (`isDefault: true`) sem aviso — pode quebrar cálculos dependentes | 🟡 Médio | UX/Segurança | `InstitutionSettings.tsx:151-159` |
| **INVITE MANAGER** | | | | |
| 36 | Sem listagem de convites pendentes — coordenador não sabe quais códigos já foram gerados e estão ativos | 🟡 Médio | UX/Funcionalidade | `InviteManager.tsx` (ausente) |

---

## Análise por Aspecto

### 🎨 Design Visual
- **Problema central**: Módulo inteiro usa cores hardcoded (`indigo-600`, `purple-600`) em vez dos design tokens semânticos do app (`text-primary`, `bg-surface-card`). Exceção: `InstitutionSettings.tsx` que já usa tokens corretamente.
- Cards do Dashboard e ClassesList usam `rounded-xl`, enquanto Settings usa `rounded-2xl` — sem padronização.
- Avatar de professores tem cor fixa `bg-indigo-100` sem variação por professor.

### 🧭 UX/Usabilidade
- **4 ocorrências** de `alert()` / `confirm()` nativos em 3 componentes diferentes.
- Dashboard apresenta dados falsos como se fossem reais — viola a confiança do usuário.
- Botões de Acesso Rápido são decorativos sem funcionalidade.
- Toggle de status do professor não pede confirmação.

### 📱 Responsivo/Mobile
- **Tabela de professores não tem layout mobile** — é a falha mais grave de responsividade do módulo.
- Grid de métricas do Dashboard pula de 1 coluna direto para 4 — sem breakpoint intermediário.
- InviteManager inline no header dos professores causa layout quebrado em telas pequenas.
- Botão "Salvar" das configurações fica no topo, longe da área de edição em mobile.

### ♿ Acessibilidade  
- Botões de ação nas turmas são **invisíveis até hover** (`opacity-0 group-hover:opacity-100`) — inacessíveis por teclado e por dispositivos touch.
- Emojis usados como ícones nos botões de Acesso Rápido sem `aria-label`.
- `InstitutionSettings.tsx` é exceção positiva: tem `aria-label` em 8+ inputs e toggles.

### ✨ Micro-interações
- Loading states são genéricos (spinner ou texto) — sem skeletons que indiquem a estrutura da página.
- `InstitutionSettings` usa Framer Motion corretamente (tabs animadas, modal com backdrop).
- Falta feedback visual ao salvar configurações (sem toast/snackbar).
- Toggle switches não têm animação de transição no thumb — apenas mudança de cor.

### 🔄 Consistência
- **Icon library split**: Lucide (`Users`, `GraduationCap`, `Shield`, etc.) usado em 4 arquivos do módulo vs. Material Symbols no restante do app. Isso adiciona ~30KB ao bundle.
- Cores divergentes: `indigo-600` como primária neste módulo vs. design tokens `text-primary` no restante.
- `InstitutionSettings` segue as convenções do app; os outros 3 componentes não.

### ⚡ Performance
- `console.log` de dados sensíveis em produção (`TeachersList.tsx:45`).
- Sem paginação nas listas de turmas e professores.
- Dashboard faz zero queries ao Supabase — mas isso é porque é tudo hardcoded.
- `InviteManager` gera código client-side sem verificar duplicatas no backend.

---

## Recomendação de Priorização

### Correções Imediatas (Sprint Atual)
1. ❌ Remover `console.log` de dados sensíveis (`TeachersList.tsx:45`)
2. 🔌 Conectar métricas do Dashboard a queries reais do Supabase
3. 📱 Adicionar layout responsivo (cards) para tabela de professores
4. ♿ Tornar botões de ação das turmas sempre visíveis (não só hover)

### Melhorias de Curto Prazo (Próximo Sprint)
5. 🔄 Migrar todas as Lucide icons para Material Symbols (consistência)
6. 🎨 Migrar cores hardcoded para design tokens semânticos
7. 💬 Substituir `alert()`/`confirm()` por modais/toasts customizados
8. ✅ Adicionar toast de sucesso ao salvar configurações
9. 🔍 Adicionar busca/filtro na lista de professores

### Melhorias de Médio Prazo
10. 📊 Implementar gráficos reais no Dashboard (Recharts já está no projeto)
11. 📋 Adicionar listagem de convites pendentes no InviteManager
12. 🧮 Adicionar validação de fórmulas customizadas no Settings

---

## Comparação com Fases Anteriores

| Aspecto | Fase 1-4 (Pessoal) | Fase 5 (Institucional) |
|---------|-------------------|----------------------|
| Icon Library | Material Symbols | Lucide (divergente) |
| Design Tokens | Parcial (tokens + hardcoded) | Mínimo (quase tudo hardcoded) |
| Responsividade | Parcial (alguns layouts mobile) | Fraca (tabela não responsiva) |
| Dados | Reais (Supabase queries) | Hardcoded/Placeholder |
| Animações | Framer Motion extensivo | Só em InstitutionSettings |
| Qualidade | Variável (Planning 2364 linhas) | Variável (Settings ótimo, Dashboard fraco) |
| Acessibilidade | ARIA labels parciais | ARIA labels só em Settings |

---

## Wireframes Reimaginados

Os 4 wireframes em `.kombai/resources/` demonstram:

1. **Dashboard Institucional** — KPIs conectados a dados reais, gráficos de presença e desempenho, feed de atividade recente
2. **Lista de Turmas** — Cards com contadores reais, ações sempre visíveis, busca por nome
3. **Corpo Docente** — Layout responsivo com cards mobile, busca, filtros por status/disciplina
4. **Configurações de Notas** — Botão salvar fixo no footer, validação visual de fórmula, tabs responsivos

---

## Estatísticas da Auditoria Completa

| Fase | Páginas | Issues | 🔴 Crítico | 🟠 Alto | 🟡 Médio | ⚪ Baixo |
|------|---------|--------|-----------|---------|---------|---------|
| Fase 1 — Dashboard & Login | 2 | 28 | 2 | 8 | 12 | 6 |
| Fase 2 — Frequência, Notas, Atividades | 3 | 35 | 3 | 9 | 15 | 8 |
| Fase 3 — Planejamento, Horários, Observações | 3 | 42 | 4 | 12 | 18 | 8 |
| Fase 4 — Alunos & Perfis | 3 | 38 | 3 | 10 | 16 | 9 |
| Fase 5 — Institucional | 4+1 | 36 | 5 | 11 | 14 | 6 |
| **TOTAL** | **16** | **179** | **17** | **50** | **75** | **37** |

### Padrões Sistêmicos Recorrentes (Todas as Fases)
1. **Dynamic Tailwind Classes** (~145 ocorrências) — classes como `bg-${color}-500` que o JIT não compila
2. **`alert()`/`confirm()` nativos** (~25 ocorrências) — substituir por modal/toast system
3. **Polling agressivo** (10s-30s) — migrar para Supabase Realtime com debounce
4. **Componentes monolíticos** — Planning (2364 linhas), StudentProfile (1184 linhas)
5. **Inconsistência de icon library** — Material Symbols + Lucide no mesmo projeto
6. **Dark mode incompleto** — muitas classes `text-gray-900` sem variante `dark:`
