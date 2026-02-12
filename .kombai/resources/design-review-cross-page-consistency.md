# Revisão de Consistência Visual Cross-Page — Wireframes Fases 1-4

**Data da Revisão**: 11 de Fevereiro de 2026  
**Escopo**: Todos os 11 wireframes gerados nas Fases 1 a 4  
**Objetivo**: Identificar inconsistências visuais entre wireframes e propor melhorias para mobile e desktop

---

## 1. Inconsistências de Cores (Cor Primária)

| Wireframe | Cor Primária | Cor CTA | Background dos Cards |
|-----------|-------------|---------|---------------------|
| Dashboard | `#e67e22` laranja (breadcrumb) | Verde/Laranja | **Cinza escuro** (dark theme) |
| Login | `#e67e22` laranja (CTA) | Laranja | Branco |
| Frequência | `#10b981` verde (botão) | Verde | Branco |
| Notas | `#e67e22` laranja (tema) | Preto (exportar) | Branco |
| Atividades | `#1e293b` preto (seleção) | Preto | Branco |
| Planejamento | `#6366f1` indigo (sidebar) + `#0d9488` teal | Indigo/Teal | Branco |
| Horários | `#0d9488` teal (breadcrumb) + `#e11d48` rosa | Teal | Branco |
| Observações | `#0d9488` teal | Teal | Branco |
| Lista Alunos | `#6366f1` indigo | Indigo | Branco |
| Perfil Aluno | `#6366f1` indigo | Indigo | Branco |
| Perfil Professor | `#6366f1` indigo | Indigo/Dark | Branco |

### 🔴 Problema Principal
**Não há cor primária unificada.** As Fases 1-2 usam laranja/verde, Fase 3 alterna entre teal/indigo/rosa, e Fase 4 estabiliza em indigo. O app real usa tema dinâmico por disciplina, mas os wireframes deveriam seguir um único token `--primary` para demonstrar consistência.

### ✅ Correção Recomendada
Padronizar todos os wireframes com:
```css
--primary: #6366f1;     /* Indigo — usado na maioria das fases */
--primary-light: #eef2ff;
--success: #10b981;
--danger: #ef4444;
--warning: #f59e0b;
```

---

## 2. Inconsistências de Cards & Background

| Wireframe | Background dos Cards | Border Radius | Padding | Sombra |
|-----------|---------------------|---------------|---------|--------|
| Dashboard | `#374151` (dark) | 16px | 24px | Nenhuma |
| Login | `#ffffff` (light) | 16-24px | 32px | Leve |
| Frequência | `#ffffff` | 16px | 20px | Leve |
| Notas | `#ffffff` | 16px | 20px | Nenhuma |
| Atividades | `#ffffff` | 16px | 20px | Leve |
| Planejamento | `#ffffff` | 16-20px | 20-28px | Leve |
| Horários | `#ffffff` | 16px | 20px | Leve |
| Observações | `#ffffff` | 16-24px | 20-24px | Leve |
| Lista Alunos | `#ffffff` | 16-24px | 20-32px | Leve |
| Perfil Aluno | `#ffffff` | 16-24px | 24-28px | Nenhuma |
| Perfil Professor | `#ffffff` | 16-24px | 24-32px | Leve |

### 🟠 Problemas
1. **Dashboard é o único wireframe com tema escuro** — inconsistente com todas as outras 10 páginas que são light
2. **Border radius varia** entre 16px e 24px sem padrão claro (containers maiores = 24px, menores = 16px não é consistente)
3. **Padding varia** entre 20px e 32px nos cards

### ✅ Correção Recomendada
```css
/* Design Tokens padronizados */
--radius: 16px;         /* Elementos pequenos: inputs, chips, botões */
--radius-lg: 24px;      /* Containers: cards, modais, seções */
--card-padding: 24px;   /* Padrão para todos os cards */
--card-padding-sm: 16px; /* Cards compactos (mobile) */
--shadow-card: 0 4px 20px rgba(0,0,0,0.04);
```

---

## 3. Inconsistências de Tipografia

| Elemento | Dashboard | Login | Frequência | Atividades | Planning | Students | Profile |
|----------|-----------|-------|------------|------------|----------|----------|---------|
| Page title | 28px/900 | 28px/900 | 28px/900 | 28px/900 | N/A | 28px/900 | 22px/900 |
| Section heading | 16px/900 | N/A | N/A | N/A | 16px/800 | 16px/900 | 20px/900 |
| Label | 10px/800 | 11px/800 | 10px/800 | 10px/800 | 9px/800 | 10px/800 | 9-10px/800 |
| Body text | 13-14px/500 | 14px/500 | 13px/600 | 13px/500 | 13px/500 | 13px/600 | 13-14px/700 |
| Letter spacing (labels) | 0.15em | 0.1em | 0.1em | 0.1em | 0.1em | 0.15em | 0.15em |

### 🟡 Problemas
1. **Labels oscilam** entre 9px e 11px — sem escala tipográfica consistente
2. **Letter spacing** alterna entre `0.1em` e `0.15em` sem critério
3. **Peso do body text** varia entre 500, 600 e 700
4. **Section headings** variam entre 16px e 20px

### ✅ Correção Recomendada (Escala Tipográfica)
```css
/* Type Scale */
--text-xs: 10px;   font-weight: 800; letter-spacing: 0.12em; /* Labels, badges */
--text-sm: 13px;   font-weight: 600;                          /* Body, descrições */
--text-base: 14px; font-weight: 700;                          /* Body importante */
--text-lg: 16px;   font-weight: 900;                          /* Section headings */
--text-xl: 20px;   font-weight: 900;                          /* Card titles */
--text-2xl: 28px;  font-weight: 900;                          /* Page titles */
```

---

## 4. Inconsistências de Componentes Reutilizáveis

### 4.1 Search Input
| Wireframe | Altura | Border Radius | Ícone | Background |
|-----------|--------|---------------|-------|------------|
| Observações | ~40px | 12px | 🔍 text | Branco |
| Lista Alunos | 40px | 10px | 🔍 text | `#f8fafc` |
| Perfil Aluno | 40px | 10px | SVG bg-image | Transparente |
| Perfil Professor | 48px | 12px | 👤 svg bg | `#fafbfe` |

**→ 4 estilos diferentes para o mesmo componente!**

### 4.2 Botões Primários
| Wireframe | Altura | Border Radius | Texto |
|-----------|--------|---------------|-------|
| Login | ~56px | 16px | UPPERCASE tracking |
| Frequência | ~44px | 12px | Normal |
| Lista Alunos | ~48px | 16px | UPPERCASE tracking |
| Perfil Professor | ~48px | 14px | UPPERCASE tracking |

### 4.3 Avatares
| Wireframe | Tamanho | Border Radius |
|-----------|---------|---------------|
| Observações | 44px | 14px |
| Lista Alunos | 40px | 14px |
| Perfil Aluno (sidebar) | 36px | 10px |
| Perfil Aluno (main) | 80px | 24px |

### ✅ Correção Recomendada
Definir componentes base:
```css
/* Search Input */
.search-input { height: 44px; border-radius: 12px; background: #f8fafc; padding-left: 40px; }

/* Button Primary */
.btn-primary { height: 48px; border-radius: 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
.btn-primary-lg { height: 56px; } /* Login, CTAs principais */

/* Avatar */
.avatar-sm { width: 36px; height: 36px; border-radius: 10px; }
.avatar-md { width: 44px; height: 44px; border-radius: 14px; }
.avatar-lg { width: 80px; height: 80px; border-radius: 24px; }
```

---

## 5. Melhorias para Mobile (< 768px)

| # | Wireframe | Problema Mobile | Melhoria |
|---|-----------|----------------|----------|
| 1 | **Dashboard** | Wireframe não demonstra layout mobile — sidebar colapsa? Bento grid empilha? | Adicionar seção mobile mostrando sidebar colapsada em hamburger, cards KPI empilhados 2x1, heatmap scrollável horizontal |
| 2 | **Login** | Layout já é mobile-friendly (single column) | ✅ OK — apenas garantir inputs com `min-height: 48px` para toque |
| 3 | **Notas** | Wireframe mostra apenas mobile — não tem desktop | Adicionar desktop view com tabela completa (header fixo, scroll horizontal) |
| 4 | **Atividades** | Detail view cobre toda a tela no mobile — sem transição visual | Adicionar animação de slide-in para detalhe + header sticky no mobile |
| 5 | **Planejamento** | Barra de ações (5 ícones) fica apertada em telas < 360px | Reduzir para 3 ícones + menu "mais" (three-dot) |
| 6 | **Horários** | Mobile list view OK, mas falta indicação visual de que há grid desktop oculto | Adicionar mini toggle "Lista / Grade" para mobile |
| 7 | **Observações** | Formulário longo no mobile com teclado aberto pode empurrar o botão "Confirmar" para fora da viewport | Fixar botão de confirmar no bottom com `position: sticky` |
| 8 | **Lista Alunos** | Tabela com 5 colunas não cabe no mobile — wireframe usa `display: none` em coluna 1 | Converter inteiro para card list no mobile em vez de esconder colunas (já feito na app, não no wireframe) |
| 9 | **Perfil Aluno** | Layout 3-colunas colapsa para 1 coluna — sidebar + stats + main ficam muito longos em scroll vertical | Reorganizar: Header → Stats (2 cols grid) → Chart → Units → Timeline — reduzir scroll total |
| 10 | **Perfil Professor** | ID Card e forms empilham verticalmente — layout OK, mas disciplinas grid 3 cols fica apertado | Reduzir grid disciplinas para 2 cols em mobile (já feito no wireframe ✅) |

---

## 6. Melhorias para Desktop (> 1024px)

| # | Wireframe | Problema Desktop | Melhoria |
|---|-----------|-----------------|----------|
| 1 | **Dashboard** | Bento grid com 3 colunas poderia usar 4° coluna para próximas aulas | Adicionar coluna "Agenda do Dia" no desktop widescreen (> 1400px) |
| 2 | **Login** | Split layout (brand | form) é bom, mas muito espaço branco vertical | Centralizar verticalmente o conteúdo dentro de cada painel |
| 3 | **Frequência** | Single column no desktop desperdiça espaço lateral | Layout 2 colunas: lista de alunos à esquerda + stats panel fixo à direita |
| 4 | **Notas** | Wireframe não mostra desktop — é a única página sem versão desktop | Crítico: mostrar tabela full-width com sticky header, editable cells, e painel de exportação lateral |
| 5 | **Atividades** | Split view (list | detail) é bom no desktop | Adicionar breadcrumb + filtro por tipo no sidebar header |
| 6 | **Planejamento** | Split view é bom | Sidebar poderia mostrar mini-calendário de cobertura (quais dias têm plano) |
| 7 | **Horários** | Grid desktop não mostrado no wireframe | Adicionar grid completo (5-7 colunas) com drag-and-drop para reatribuir slots |
| 8 | **Observações** | 2 cols (sidebar + content) bom no desktop | Adicionar mini-stat cards do aluno no header do conteúdo |
| 9 | **Lista Alunos** | Tabela funcional no desktop | Adicionar coluna "Última Ocorrência" e "Frequência %" para contexto rápido |
| 10 | **Perfil Aluno** | 3 colunas funciona bem | Progress bar do "Resumo Anual" poderia ter tooltip interativo com breakdown |
| 11 | **Perfil Professor** | 2 colunas (ID card sticky + forms) funciona bem | ✅ Sem problemas significativos |

---

## 7. Inconsistências de Anotações/Tags nos Wireframes

| Wireframe | Formato de Tags | Cores Tags |
|-----------|----------------|------------|
| Dashboard | `[REUSE] LayoutHeader`, `[NEW] QuickActions` | Verde/Laranja com fundo sólido |
| Login | `[REUSE] LoginForm`, `[NEW] InlineError` | Verde/Laranja com fundo sólido |
| Frequência | `[REUSE] HeaderControle`, `[FIX] aria-labels` | Verde/Laranja/Vermelho |
| Notas | `[FIX] ThemeColor`, `[NEW] MobileGradeCards` | Vermelho/Verde |
| Atividades | `[REUSE] Sidebar`, `[REUSE] GradientHero` | Verde |
| Planejamento | `DRAFT RECOVERY`, `REPLACES ALERT0` | Cyan/Verde |
| Horários | Sem tags | N/A |
| Observações | `INLINE VALIDATION` | Verde |
| Lista Alunos | `✨ MELHORIA` (annotation blocks amarelos) | Amarelo |
| Perfil Aluno | `✨ MELHORIA` (annotation blocks) | Amarelo |
| Perfil Professor | `✨ MELHORIA` (annotation blocks) | Amarelo |

### 🟠 Problema
**3 sistemas de anotação diferentes** entre fases:
- Fases 1-2: Tags inline com `[REUSE]`, `[NEW]`, `[FIX]` em canto superior
- Fase 3: Tags inline simples sem sistema de cores consistente
- Fase 4: Blocks de anotação amarelos com `✨ MELHORIA` e `improvement-tag`

### ✅ Correção
Padronizar para Fase 4 style (annotation blocks) que é mais legível e não polui o wireframe.

---

## 8. Resumo de Prioridades

### 🔴 Crítico (Deve ser corrigido)
1. **Cor primária unificada** — padronizar `#6366f1` indigo em todos os wireframes
2. **Dashboard dark theme** — alinhar com tema light de todas as outras páginas
3. **Wireframe de Notas sem versão desktop** — adicionar

### 🟠 Alto (Fortemente recomendado)
4. **Escala tipográfica** — definir e aplicar tokens consistentes
5. **Componentes base** — padronizar search input, botão primário, avatar
6. **Sistema de anotações** — usar formato de Fase 4 para todos
7. **Mobile: Frequência** — converter para 2 colunas no desktop
8. **Mobile: Observações** — botão de confirmar sticky no bottom

### 🟡 Médio (Desejável)
9. Padding de cards padronizado (24px)
10. Border radius padronizado (16px/24px)
11. Shadow consistente em todos os cards
12. Mobile: Dashboard — demonstrar layout mobile
13. Desktop: Horários — mostrar grid completo

### ⚪ Baixo (Nice-to-have)
14. Desktop: Adicionar coluna "Agenda do Dia" no Dashboard widescreen
15. Desktop: Mini-calendário no sidebar do Planejamento
16. Desktop: Colunas extras na tabela de Alunos

---

## Conclusão

Os wireframes foram produzidos em 4 fases separadas, o que naturalmente gerou **drift visual** entre eles. As **Fases 3 e 4** são mais coesas entre si, enquanto as **Fases 1 e 2** têm identidade visual diferente (cores, formato de tags). A principal ação de alto valor é **padronizar os design tokens** (cores, tipografia, radius, sombras) e reaplicá-los nos wireframes das Fases 1-2 para atingir consistência total.
