# Revisão de Design UI/UX — Fase 1: Dashboard & Login

**Data da Revisão**: 11 de Fevereiro de 2026  
**Rotas**: `/` (Dashboard), `/login` (Login)  
**Áreas Analisadas**: Design Visual, UX/Usabilidade, Responsivo/Mobile, Acessibilidade, Micro-interações, Consistência, Performance

## Resumo Executivo

A plataforma Prof. Acerta+ 3.2 apresenta um design visual premium com glassmorphism e animações sofisticadas. No entanto, foram identificados **28 problemas** distribuídos entre acessibilidade crítica (contraste de cores insuficiente em múltiplos elementos), inconsistências no design system (mix de tokens semânticos com cores hardcoded), problemas de performance (bundle de 4MB na página de login), e questões de UX (erros exibidos como modal fullscreen). A estrutura de código é robusta, mas há duplicações e variáveis não utilizadas que precisam de limpeza.

## Issues

| # | Issue | Criticidade | Categoria | Localização |
|---|-------|-------------|----------|----------|
| 1 | Labels de formulário com contraste insuficiente: `text-text-muted` (#94a3b8) sobre branco resulta em ratio 2.56:1 — WCAG AA exige 4.5:1 | 🔴 Crítico | Acessibilidade | `pages/Login.tsx:351, 433, 455` |
| 2 | Botão "Cadastrar" ativo: texto branco (#fff) sobre cyan (#06b6d4) com ratio 2.42:1 — insuficiente para texto | 🔴 Crítico | Acessibilidade | `pages/Login.tsx:319-323` |
| 3 | Link "Esqueci meu e-mail" com contraste 2.56:1 em tamanho 10px — texto pequeno precisa de ratio ainda maior | 🔴 Crítico | Acessibilidade | `pages/Login.tsx:443-449` |
| 4 | Sem landmark `<main>` na página de Login — necessário para navegação por leitores de tela | 🟠 Alto | Acessibilidade | `pages/Login.tsx:228` |
| 5 | Conteúdo do formulário não está dentro de landmarks semânticos (form, main, nav) | 🟠 Alto | Acessibilidade | `pages/Login.tsx:338-568` |
| 6 | Botões de navegação do carrossel (Plano do Dia) sem `aria-label` — inacessível para leitores de tela | 🟠 Alto | Acessibilidade | `pages/Dashboard.tsx:820-826` |
| 7 | Nenhum mecanismo de "skip to content" para navegação por teclado | 🟡 Médio | Acessibilidade | `components/Layout.tsx` (global) |
| 8 | Erros de formulário exibidos como modal overlay fullscreen — UX agressiva para erros simples de validação | 🟠 Alto | UX/Usabilidade | `pages/Login.tsx:578-622` |
| 9 | Link "Esqueci meu e-mail" redireciona para WhatsApp externo — deveria ter solução in-app | 🟡 Médio | UX/Usabilidade | `pages/Login.tsx:443-449` |
| 10 | Botão de submit com `opacity-50 grayscale` quando desabilitado — não comunica claramente por que está desabilitado | 🟡 Médio | UX/Usabilidade | `pages/Login.tsx:516-518` |
| 11 | Dashboard sem estados de erro visíveis — todos os `catch` blocks apenas fazem `console.error` sem feedback ao usuário | 🟠 Alto | UX/Usabilidade | `pages/Dashboard.tsx:209, 304, 392, 455, 517` |
| 12 | Sem ações rápidas no Dashboard — professor precisa navegar para páginas separadas para tarefas frequentes (chamada, lançar notas) | 🟡 Médio | UX/Usabilidade | `pages/Dashboard.tsx` (global) |
| 13 | Terminologia "Chave de Acesso" para campo de senha — não é padrão e pode confundir usuários | ⚪ Baixo | UX/Usabilidade | `pages/Login.tsx:455` |
| 14 | Page size total de 4.13MB na página de Login — muito pesado para primeira impressão | 🟠 Alto | Performance | `index.html` (global) |
| 15 | `setUpcomingActivities` chamado duas vezes consecutivamente no mesmo callback | 🟡 Médio | Performance | `pages/Dashboard.tsx:509-511` |
| 16 | `setClassPlans` chamado duas vezes consecutivamente no mesmo callback | 🟡 Médio | Performance | `pages/Dashboard.tsx:449-452` |
| 17 | `console.log("♻️ Triggering Debounced Dashboard Refresh")` presente em código de produção | ⚪ Baixo | Performance | `pages/Dashboard.tsx:658` |
| 18 | Função `stripHtml()` cria elementos DOM para parsear HTML — risco de XSS se conteúdo não sanitizado | 🟠 Alto | Performance/Segurança | `pages/Dashboard.tsx:105-110` |
| 19 | 15 ícones decorativos posicionados absolutamente no background do Dashboard com animações — gera overhead de layout | 🟡 Médio | Performance | `pages/Dashboard.tsx:750-759` |
| 20 | Spring animations com filtro blur em todos os cards do Dashboard — pode causar jank em dispositivos de baixo desempenho | 🟡 Médio | Performance | `pages/Dashboard.tsx:707-725` |
| 21 | Login importa `framer-motion`, `lucide-react`, `BackgroundPattern` etc. para animações de background — peso desnecessário | 🟡 Médio | Performance | `pages/Login.tsx:1-11` |
| 22 | Mix de tokens semânticos (`text-text-muted`, `text-text-primary`) com cores hardcoded (`text-slate-400`, `text-slate-700`, `text-slate-500`) | 🟡 Médio | Consistência | `pages/Login.tsx:413, 488-490` e `pages/Dashboard.tsx:991, 1079-1080` |
| 23 | Labels de formulário usando classes diferentes: algumas `text-text-muted`, outras `text-slate-400 dark:text-slate-500` — inconsistente | 🟡 Médio | Consistência | `pages/Login.tsx:351 vs 413, 488` |
| 24 | Classes `.glass-card-premium` definida duas vezes no CSS global com estilos conflitantes | 🟡 Médio | Consistência | `index.css:173-178` e `index.css:407-413` |
| 25 | Variável `totalSelected` declarada mas nunca utilizada | ⚪ Baixo | Qualidade de Código | `pages/Dashboard.tsx:119` |
| 26 | Favicon retornando 404 — erro no console | ⚪ Baixo | SEO/Completude | `public/` (favicon não configurado) |
| 27 | No mobile (375px), o formulário de registro fica muito longo e requer scroll extenso sem indicador visual | 🟡 Médio | Responsivo/Mobile | `pages/Login.tsx:348-498` |
| 28 | Blobs animados no background (`animate-blob`) com `mix-blend-multiply` e blur pesado causam problemas de performance em mobile | 🟡 Médio | Responsivo/Mobile | `components/Layout.tsx:296-299` |

## Legenda de Criticidade
- 🔴 **Crítico**: Viola padrões de acessibilidade (WCAG AA) ou quebra funcionalidade
- 🟠 **Alto**: Impacta significativamente a experiência do usuário ou qualidade do design
- 🟡 **Médio**: Problema perceptível que deve ser corrigido
- ⚪ **Baixo**: Melhoria desejável (nice-to-have)

## Resumo por Categoria

| Categoria | 🔴 Crítico | 🟠 Alto | 🟡 Médio | ⚪ Baixo | Total |
|-----------|-----------|---------|---------|---------|-------|
| Acessibilidade | 3 | 3 | 1 | 0 | **7** |
| UX/Usabilidade | 0 | 2 | 3 | 1 | **6** |
| Performance | 0 | 2 | 5 | 1 | **8** |
| Consistência | 0 | 0 | 3 | 0 | **3** |
| Responsivo/Mobile | 0 | 0 | 2 | 0 | **2** |
| Qualidade/Outros | 0 | 0 | 0 | 2 | **2** |
| **Total** | **3** | **7** | **14** | **4** | **28** |

## Próximos Passos

### Prioridade 1 — Correções Críticas (Acessibilidade)
1. **Aumentar contraste dos labels**: Trocar `text-text-muted` (#94a3b8) por `text-slate-600` (#475569) que tem ratio 7.06:1
2. **Corrigir contraste do botão Cadastrar**: Usar fundo mais escuro (ex: #0891b2) ou texto escuro sobre fundo claro
3. **Corrigir link "Esqueci meu e-mail"**: Aumentar tamanho de fonte e usar cor com contraste adequado

### Prioridade 2 — Correções de Alto Impacto
4. **Adicionar `<main>` landmark** na página de Login e no Layout
5. **Substituir modal de erro por inline error** no formulário de Login
6. **Adicionar aria-labels** nos botões do carrossel do Dashboard
7. **Adicionar estados de erro visíveis** no Dashboard
8. **Sanitizar HTML** no `stripHtml()` usando DOMPurify (já instalado)

### Prioridade 3 — Melhorias de Consistência
9. **Padronizar cores**: Migrar todas as cores hardcoded para design tokens do Tailwind
10. **Limpar CSS duplicado**: Remover definição duplicada de `.glass-card-premium`
11. **Remover código morto**: `totalSelected`, `console.log`, setters duplicados

### Fase 2 (Próxima Iteração)
Revisão das páginas de Frequência, Notas e Atividades.
