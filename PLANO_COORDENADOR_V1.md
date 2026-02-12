# 🎓 PLANO DE IMPLEMENTAÇÃO FINAL
## Sistema Coordenador Institucional - Prof. Acerta+
### Versão 1.0 - 05/02/2026

---

# 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Fase 0: Correções Críticas](#fase-0-correções-críticas)
3. [Fase 1: Configurações da Escola](#fase-1-configurações-da-escola)
4. [Fase 2: Turmas e Professores](#fase-2-turmas-e-professores)
5. [Fase 3: Gestão de Alunos](#fase-3-gestão-de-alunos)
6. [Fase 4: Sistema de Horários](#fase-4-sistema-de-horários)
7. [Fase 5: Sistema de Notas](#fase-5-sistema-de-notas)
8. [Fase 6: Frequência de Alunos](#fase-6-frequência-de-alunos)
9. [Fase 7: Ocorrências](#fase-7-ocorrências)
10. [Fase 8: Planejamentos e Atividades](#fase-8-planejamentos-e-atividades)
11. [Fase 8.5: Parecer Pedagógico](#fase-85-parecer-pedagógico)
12. [Fase 9: Registro de Chegada GPS](#fase-9-registro-de-chegada-gps)
13. [Fase 10: Eventos](#fase-10-eventos)
14. [Fase 11: Relatórios com IA](#fase-11-relatórios-com-ia)
15. [Matriz de Permissões](#matriz-de-permissões)
16. [Cronograma](#cronograma)

---

# VISÃO GERAL

## O Que Estamos Construindo?

Um sistema completo de gestão escolar institucional onde:
- **COORDENADOR**: Gerencia toda a escola, configura regras, visualiza tudo
- **PROFESSOR**: Executa tarefas de ensino, lança notas, registra ocorrências

## Diferença Principal

| Conta Pessoal | Conta Institucional |
|---------------|---------------------|
| Professor é dono dos dados | Escola é dona dos dados |
| Professor escolhe disciplina | Coordenador atribui disciplina |
| Cada um com suas configurações | Todos seguem regras da escola |

---

# FASE 0: CORREÇÕES CRÍTICAS
> **Prazo:** 1-2 dias | **Prioridade:** BLOQUEANTE

## Problema Atual
Quando o usuário cria conta escolhendo "Criar minha escola":
- ❌ A instituição NÃO é criada no banco de dados
- ❌ Usuário fica com `account_type = 'personal'`
- ❌ Não aparece como coordenador

## Solução
- [ ] Corrigir criação automática da instituição no banco
- [ ] Definir `account_type = 'institutional'`
- [ ] Criar registro em `institution_teachers` com role `admin`
- [ ] Redirect automático para painel institucional após login

## Verificação
Novo usuário cria escola → Login → Aparece no dashboard institucional como coordenador

---

# FASE 1: CONFIGURAÇÕES DA ESCOLA
> **Prazo:** 5-7 dias | **Prioridade:** ALTA

## 1.1 Tipo de Cálculo

```
┌─────────────────────────────────────────────────────────┐
│  📊 TIPO DE CÁLCULO DAS NOTAS                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ○ Média Aritmética Simples                             │
│     Fórmula: (N1 + N2 + N3 + N4) ÷ 4                   │
│     Exemplo: (8 + 7 + 6 + 9) ÷ 4 = 7.5                 │
│                                                         │
│  ○ Média Aritmética Ponderada (Estilo ENEM)             │
│     Cada nota tem um peso diferente                     │
│     Fórmula: (N1×P1 + N2×P2 + ...) ÷ (P1+P2+...)       │
│     Exemplo: (8×2 + 7×1 + 6×1 + 9×3) ÷ 7 = 8.0         │
│                                                         │
│  ○ Soma Total (Apenas soma, sem dividir)                │
│     Fórmula: N1 + N2 + N3 + N4                         │
│     Exemplo: 8 + 7 + 6 + 9 = 30 pontos                 │
│     Ideal para: escolas que trabalham com pontuação    │
│                                                         │
│  ○ Fórmula Personalizada                                │
│     O coordenador cria sua própria fórmula              │
│     Exemplo: ((U1+U2)/2 × 0.4) + ((U3+U4)/2 × 0.6)     │
│     Flexibilidade total para qualquer cálculo          │
│                                                         │
└─────────────────────────────────────────────────────────┘

Se escolher "Fórmula Personalizada":

┌─────────────────────────────────────────────────────────┐
│  ✏️ EDITOR DE FÓRMULA                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Variáveis disponíveis:                                 │
│  U1, U2, U3, U4 = Nota de cada unidade                 │
│  P1, P2, P3, P4 = Prova de cada unidade                │
│  T1, T2, T3, T4 = Teste de cada unidade                │
│  Q1, Q2, Q3, Q4 = Qualitativo de cada unidade          │
│                                                         │
│  Sua fórmula:                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ((U1 + U2) / 2) * 0.4 + ((U3 + U4) / 2) * 0.6  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ⚙️ Teste da fórmula:                                  │
│  Se U1=8, U2=7, U3=6, U4=9                             │
│  Resultado: ((8+7)/2)*0.4 + ((6+9)/2)*0.6 = 7.5        │
│                                                         │
│                              [Salvar Fórmula]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 1.2 Configuração de Unidades

```
┌─────────────────────────────────────────────────────────┐
│  📅 UNIDADES DO ANO LETIVO                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Quantas unidades? [ 4 ]                                │
│                                                         │
│  Nomes das unidades:                                    │
│  1ª Unidade: [ 1º Bimestre        ]                    │
│  2ª Unidade: [ 2º Bimestre        ]                    │
│  3ª Unidade: [ 3º Bimestre        ]                    │
│  4ª Unidade: [ 4º Bimestre        ]                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 1.3 Componentes de Notas (Por Unidade)

**PADRÃO:** Cada unidade já vem com 3 componentes obrigatórios:
- ✅ Qualitativo (obrigatório por padrão)
- ✅ Teste (obrigatório por padrão)
- ✅ Prova (obrigatório por padrão)

O coordenador pode:
- Remover qualquer componente (inclusive os padrão)
- Adicionar novos componentes (Projeto, Simulado, Trabalho, etc.)
- Editar valores e pesos

```
┌─────────────────────────────────────────────────────────┐
│  📝 COMPONENTES DA 1ª UNIDADE                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  COMPONENTES PADRÃO:                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ✅ Qualitativo                                  │    │
│  │    Valor máximo: [ 2.0 ]   Peso: [ 1 ]          │    │
│  │    Variável na fórmula: Q1, Q2, Q3, Q4          │    │
│  │    [Editar] [Remover]                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ✅ Teste                                        │    │
│  │    Valor máximo: [ 3.0 ]   Peso: [ 1 ]          │    │
│  │    Variável na fórmula: T1, T2, T3, T4          │    │
│  │    [Editar] [Remover]                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ✅ Prova                                        │    │
│  │    Valor máximo: [ 5.0 ]   Peso: [ 2 ]          │    │
│  │    Variável na fórmula: P1, P2, P3, P4          │    │
│  │    [Editar] [Remover]                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ══════════════════════════════════════════════════════│
│  ADICIONAR COMPONENTES PERSONALIZADOS:                  │
│  ══════════════════════════════════════════════════════│
│                                                         │
│  [+ Adicionar Componente]                               │
│                                                         │
│  Sugestões:                                             │
│  │ 🎯 Projeto       │ → Variável: PJ1, PJ2, PJ3, PJ4  │
│  │ 📋 Simulado      │ → Variável: SM1, SM2, SM3, SM4  │
│  │ 📖 Trabalho      │ → Variável: TR1, TR2, TR3, TR4  │
│  │ 🎭 Seminário     │ → Variável: SE1, SE2, SE3, SE4  │
│  │ ✏️ Redação       │ → Variável: RE1, RE2, RE3, RE4  │
│  │ Ou digite outro: [ _________________ ]             │
│                                                         │
│  ══════════════════════════════════════════════════════│
│  COMPONENTES ADICIONADOS:                               │
│  ══════════════════════════════════════════════════════│
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🎯 Projeto (adicionado pelo coordenador)        │    │
│  │    Valor máximo: [ 2.0 ]   Peso: [ 1 ]          │    │
│  │    Variável na fórmula: PJ1, PJ2, PJ3, PJ4      │    │
│  │    [Editar] [Remover]                           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ══════════════════════════════════════════════════════│
│  TOTAL DA UNIDADE: 12.0 pontos                          │
│  ══════════════════════════════════════════════════════│
│                                                         │
│  ⚠️ As variáveis ficam disponíveis na Fórmula          │
│     Personalizada automaticamente!                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Como Componentes Aparecem na Fórmula

Quando você adiciona um componente, ele automaticamente vira uma variável:

| Componente | Variável | Exemplo na Fórmula |
|------------|----------|-------------------|
| Qualitativo | Q1, Q2, Q3, Q4 | `(Q1 + Q2 + Q3 + Q4) / 4` |
| Teste | T1, T2, T3, T4 | `T1 * 0.5 + T2 * 0.5` |
| Prova | P1, P2, P3, P4 | `(P1 + P2 + P3 + P4)` |
| **Projeto** | PJ1, PJ2, PJ3, PJ4 | `(P1 + PJ1) + (P2 + PJ2)` |
| **Simulado** | SM1, SM2, SM3, SM4 | `SM1 * 1.5` |
| U (Total Unidade) | U1, U2, U3, U4 | `(U1 + U2 + U3 + U4) / 4` |

## 1.4 Sistema de Aprovação Completo

### Configuração de Pontos

```
┌─────────────────────────────────────────────────────────┐
│  🎯 CRITÉRIOS DE APROVAÇÃO                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PONTUAÇÃO TOTAL DO ANO:                                │
│  Soma de todas as unidades: [ 40.0 ] pontos            │
│  (Exemplo: 4 unidades × 10 pontos = 40 pontos)         │
│                                                         │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  ✅ APROVAÇÃO DIRETA:                                  │
│  Nota mínima para aprovação: [ 28.0 ] pontos           │
│  (Quem tirar 28+ pontos: PASSOU DE ANO)               │
│                                                         │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  📝 PROVA FINAL:                                       │
│  ☑️ Instituição tem prova final? [Sim]                │
│  Valor máximo da prova final: [ 10.0 ] pontos          │
│                                                         │
│  Quem vai para prova final?                             │
│  → Aluno que precisa de ATÉ 10 pontos para chegar em 28│
│  → Ou seja: quem tem entre 18 e 27.9 pontos            │
│                                                         │
│  Para ser aprovado pela prova final:                    │
│  Precisa tirar os pontos que faltam                     │
│  Exemplo: João tem 22 pontos, precisa de 6 na final    │
│                                                         │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  🔄 RECUPERAÇÃO:                                       │
│  ☑️ Instituição tem recuperação? [Sim]                │
│                                                         │
│  Quem vai para recuperação?                             │
│  → Quem precisa de MAIS pontos do que a prova final dá │
│  → Ou seja: quem tem menos de 18 pontos                │
│  → OU quem reprovou na prova final                     │
│                                                         │
│  ⚠️ Na recuperação: NOTAS ANTERIORES SÃO ZERADAS      │
│                                                         │
│  Valor máximo da recuperação: [ 10.0 ] pontos          │
│  Nota mínima para aprovação: [ 6.0 ] pontos            │
│                                                         │
│  ❌ REPROVAÇÃO DEFINITIVA:                             │
│  Quem não atingir 6.0 na recuperação: PERDEU O ANO     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Aprovação Visual

```
                         PONTOS DO ALUNO NO ANO
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                >= 28          18 a 27.9      < 18
              (passou)    (faltam até 10)  (faltam +10)
                    │             │             │
                    ▼             ▼             ▼
              ✅ APROVADO    PROVA FINAL    🔄 RECUPERAÇÃO
                 DIRETO           │         (notas zeradas)
                                  │             │
                     ┌────────────┼────────┐    │
                     │                     │    │
              Tirou pontos          Não tirou   │
              que faltavam          suficiente  │
                     │                     │    │
                     ▼                     ▼    ▼
           ✅ APROVADO PELA          🔄 RECUPERAÇÃO
              PROVA FINAL           (notas zeradas)
                                          │
                               ┌──────────┼──────────┐
                               │                     │
                           >= 6.0                 < 6.0
                               │                     │
                               ▼                     ▼
                    ✅ APROVADO PELA          ❌ REPROVADO
                      RECUPERAÇÃO               DEFINITIVO
```

### Exemplos Práticos

**Exemplo 1 - Aprovado Direto:**
- João: 30 pontos no ano → ✅ Aprovado (passou de 28)

**Exemplo 2 - Prova Final (Sucesso):**
- Maria: 22 pontos no ano → Faltam 6 para chegar em 28
- Prova final vale até 10 → Pode recuperar os 6 pontos
- Maria tira 7 na prova final → ✅ Aprovado pela prova final

**Exemplo 3 - Prova Final (Falha) → Recuperação:**
- Pedro: 24 pontos no ano → Faltam 4 para chegar em 28
- Pedro tira 3 na prova final → Não conseguiu os 4 pontos
- Vai para recuperação (notas zeradas)
- Pedro tira 7 na recuperação → ✅ Aprovado pela recuperação

**Exemplo 4 - Direto para Recuperação:**
- Ana: 15 pontos no ano → Faltam 13 para chegar em 28
- Prova final vale só 10 → Não consegue recuperar 13 pontos
- Vai direto para recuperação (notas zeradas)
- Ana tira 5 na recuperação → ❌ Reprovada (precisava de 6)

---

# FASE 2: TURMAS E PROFESSORES
> **Prazo:** 5-7 dias | **Prioridade:** ALTA

## 2.1 Criação de Turmas

```
┌─────────────────────────────────────────────────────────┐
│  📚 CRIAR NOVA TURMA                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Série/Ano: [ 6º Ano              ▼]                   │
│  Turma:     [ A                   ]                    │
│  Ano letivo: [ 2026               ▼]                   │
│                                                         │
│  Nome completo: 6º Ano A - 2026                        │
│                                                         │
│                              [Criar Turma]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 2.2 Atribuir Professores a Turmas

**IMPORTANTE:** O professor NÃO escolhe sua disciplina. O coordenador decide!

```
┌─────────────────────────────────────────────────────────┐
│  👨‍🏫 ATRIBUIR PROFESSOR                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Professor: [ Maria Silva         ▼]                   │
│  Turma:     [ 6º Ano A - 2026     ▼]                   │
│  Disciplina: [ Matemática         ▼]                   │
│                                                         │
│  Horários desta atribuição: (definido na Fase 4)       │
│                                                         │
│                              [Salvar Atribuição]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 2.3 O Que o Professor Vê

Apenas as turmas onde foi atribuído:

```
┌─────────────────────────────────────────────────────────┐
│  Olá, Maria! Suas turmas em 2026:                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📐 Matemática                                          │
│     • 6º Ano A (25 alunos)                             │
│     • 6º Ano B (23 alunos)                             │
│                                                         │
│  ⚛️ Física                                              │
│     • 7º Ano A (28 alunos)                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 3: GESTÃO DE ALUNOS
> **Prazo:** 5-6 dias | **Prioridade:** ALTA

## 3.1 Cadastro de Aluno

```
┌─────────────────────────────────────────────────────────┐
│  👨‍🎓 CADASTRAR ALUNO                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Nome completo: [ João Pedro da Silva              ]   │
│  Data de nascimento: [ 15/03/2012 ]                    │
│                                                         │
│  Turma: [ 6º Ano A - 2026         ▼]                   │
│                                                         │
│  ──────────────────────────────────────────────────────│
│  ♿ ALUNO DE INCLUSÃO                                   │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  ☐ Este aluno é de inclusão                            │
│                                                         │
│  (Se marcado, aparece:)                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Tipo de inclusão (descreva):                    │   │
│  │ [ TDAH - Transtorno de Déficit de Atenção      ]│   │
│  │                                                  │   │
│  │ Nota MÁXIMA para aprovação: [ 20.0 ] pontos     │   │
│  │ (Normal seria 28. Este aluno passa com 20)      │   │
│  │                                                  │   │
│  │ Observações adicionais:                         │   │
│  │ [ Precisa de tempo extra em provas.             ]│   │
│  │ [ Evitar ambiente com muito estímulo visual.   ]│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                              [Salvar Aluno]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 3.2 Alunos de Inclusão - Explicação

**O que muda?** A nota MÁXIMA para aprovação, NÃO a média.

| Aluno Normal | Aluno Inclusão |
|--------------|----------------|
| Precisa de 28 pontos para passar | Precisa de 20 pontos para passar |
| Prova final: precisa de até 10 pontos | Prova final: precisa de até 10 pontos |
| Recuperação: mínimo 6 pontos | Recuperação: mínimo definido individual |

**Exemplo:**
- João (inclusão): Meta = 20 pontos
- João tirou 18 pontos → Faltam 2 pontos → Prova final
- João tira 3 na prova final → ✅ Aprovado (18+3 > 20)

## 3.3 Notificação de Aniversário

```
┌─────────────────────────────────────────────────────────┐
│  🎂 ANIVERSARIANTES DE HOJE                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📍 6º Ano A:                                          │
│  • João Pedro da Silva faz 14 anos hoje! 🎉            │
│                                                         │
│  📍 7º Ano B:                                          │
│  • Maria Fernanda Costa faz 13 anos hoje! 🎉           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Esta notificação aparece automaticamente para todos os professores que dão aula para o aluno.

## 3.4 Transferência de Turma (Novo Ano Letivo)

Quando muda de 2026 para 2027, o coordenador pode transferir alunos:

```
┌─────────────────────────────────────────────────────────┐
│  🔄 TRANSFERIR ALUNOS PARA NOVO ANO LETIVO             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  De: [ 6º Ano A - 2026            ▼]                   │
│  Para: [ 7º Ano A - 2027          ▼]                   │
│                                                         │
│  Modo de transferência:                                 │
│  ● Transferir TODOS os alunos da turma                 │
│  ○ Selecionar alunos individualmente                   │
│                                                         │
│  ⚠️ O QUE SERÁ TRANSFERIDO:                            │
│  ✅ Nome do aluno                                      │
│  ✅ Data de nascimento                                 │
│  ✅ Configuração de inclusão                           │
│                                                         │
│  ⚠️ O QUE NÃO SERÁ TRANSFERIDO (dados do ano letivo):  │
│  ❌ Notas                                              │
│  ❌ Ocorrências                                        │
│  ❌ Pareceres pedagógicos                              │
│  ❌ Frequência                                         │
│                                                         │
│                [Transferir Alunos Selecionados]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Transferência Individual

```
┌─────────────────────────────────────────────────────────┐
│  🔄 TRANSFERÊNCIA INDIVIDUAL                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Turma origem: 6º Ano A - 2026                         │
│                                                         │
│  ☐ João Pedro da Silva                                 │
│  ☑️ Maria Fernanda Costa → Para: [7º Ano B - 2027 ▼]   │
│  ☑️ Lucas Oliveira Santos → Para: [7º Ano A - 2027 ▼]  │
│  ☐ Ana Beatriz Pereira                                 │
│                                                         │
│                              [Confirmar Transferência]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 4: SISTEMA DE HORÁRIOS
> **Prazo:** 4-5 dias | **Prioridade:** MÉDIA

## 4.1 Grade de Horários (Coordenador)

```
┌─────────────────────────────────────────────────────────┐
│  ⏰ HORÁRIO - 6º ANO A                    [Editar]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           │ Seg   │ Ter   │ Qua   │ Qui   │ Sex       │
│  ─────────┼───────┼───────┼───────┼───────┼───────    │
│  07:00    │📐 Mat │📚 Port│🌍 Geo │📐 Mat │🎨 Art    │
│  07:50    │       │       │       │       │           │
│  ─────────┼───────┼───────┼───────┼───────┼───────    │
│  08:00    │📐 Mat │📚 Port│⚛️ Ciên│📖 His │🎨 Art    │
│  08:50    │       │       │       │       │           │
│  ─────────┼───────┼───────┼───────┼───────┼───────    │
│           │       │       │       │       │           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 4.2 Horário do Professor

O professor vê apenas seu próprio horário.

---

# FASE 5: SISTEMA DE NOTAS
> **Prazo:** 10-12 dias | **Prioridade:** ALTA

## 5.1 Lançamento de Notas (Professor)

```
┌─────────────────────────────────────────────────────────┐
│  📊 LANÇAR NOTAS - 1ª UNIDADE                           │
│  Turma: 6º Ano A  │  Disciplina: Matemática             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Componentes configurados pelo coordenador:             │
│                                                         │
│  Aluno          │Qualit.│ Teste │ Prova │Projeto│ Total│
│                 │(max 2)│(max 3)│(max 5)│(max 2)│      │
│  ───────────────┼───────┼───────┼───────┼───────┼──────│
│  João Pedro     │[ 1.8 ]│[ 2.5 ]│[ 4.5 ]│[ 1.8 ]│ 10.6 │
│  Maria Fernanda │[ 2.0 ]│[ 3.0 ]│[ 5.0 ]│[ 2.0 ]│ 12.0 │
│  Lucas Oliveira │[ 1.5 ]│[ 2.0 ]│[ 3.5 ]│[ 1.0 ]│  8.0 │
│                                                         │
│                              [Salvar Notas]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 5.2 Relatório Detalhado de Notas (Coordenador)

```
┌─────────────────────────────────────────────────────────┐
│  📊 RELATÓRIO DE NOTAS - João Pedro da Silva            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Turma: 6º Ano A  │  Ano: 2026  │  Status: ⚠️ PROVA FINAL│
│  Total de pontos: 35.2 de 40  │  Meta: 28 pontos       │
│                                                         │
│  ══════════════════════════════════════════════════════│
│  📐 MATEMÁTICA (Prof. Maria)                            │
│  ══════════════════════════════════════════════════════│
│                                                         │
│  1ª Unidade:                                            │
│  │ Qualitativo: 1.8 │ Teste: 2.5 │ Prova: 4.5 │ = 8.8  │
│                                                         │
│  2ª Unidade:                                            │
│  │ Qualitativo: 2.0 │ Teste: 2.8 │ Prova: 5.0 │ = 9.8  │
│                                                         │
│  3ª Unidade:                                            │
│  │ Qualitativo: 1.5 │ Teste: 2.0 │ Prova: 3.5 │ = 7.0  │
│                                                         │
│  4ª Unidade:                                            │
│  │ Qualitativo: 1.8 │ Teste: 2.5 │ Prova: 5.3 │ = 9.6  │
│                                                         │
│  TOTAL MATEMÁTICA: 35.2 pontos ✅                       │
│                                                         │
│  ══════════════════════════════════════════════════════│
│  📚 PORTUGUÊS (Prof. Carlos)                            │
│  ══════════════════════════════════════════════════════│
│  ... (mesma estrutura)                                  │
│  TOTAL PORTUGUÊS: 25.0 pontos ⚠️ PROVA FINAL           │
│                                                         │
│  ──────────────────────────────────────────────────────│
│  🎯 ANÁLISE DO DESEMPENHO                               │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  ✅ DISCIPLINAS INDO BEM (meta atingida):              │
│     • Matemática (35.2 pts) - Excelente!               │
│     • Geografia (30.5 pts) - Muito bem!                 │
│     • Ciências (29.0 pts) - Aprovado                    │
│                                                         │
│  ⚠️ DISCIPLINAS QUE PRECISAM DE FOCO:                  │
│     • Português (25.0 pts) - Faltam 3 pontos           │
│     • História (22.0 pts) - Faltam 6 pontos            │
│                                                         │
│                              [📥 Baixar PDF Completo]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 6: FREQUÊNCIA DE ALUNOS
> **Prazo:** 4-5 dias | **Prioridade:** MÉDIA

## 6.1 Professor Marca Frequência
(Funciona igual ao sistema atual)

## 6.2 Coordenador Visualiza e Baixa

```
┌─────────────────────────────────────────────────────────┐
│  📋 FREQUÊNCIA - João Pedro da Silva                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frequência Geral: 89%                                  │
│                                                         │
│  Por disciplina:                            DOWNLOAD    │
│  │ 📐 Matemática    │ 92%  │ 46/50 aulas │ [📥 PDF]   │
│  │ 📚 Português     │ 85%  │ 42/50 aulas │ [📥 PDF]   │
│  │ 🌍 Geografia     │ 91%  │ 45/50 aulas │ [📥 PDF]   │
│  │ 📖 História      │ 88%  │ 44/50 aulas │ [📥 PDF]   │
│  │ ⚛️ Ciências      │ 90%  │ 45/50 aulas │ [📥 PDF]   │
│                                                         │
│                    [📥 Baixar Frequência Completa (PDF)]│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 7: OCORRÊNCIAS
> **Prazo:** 6-8 dias | **Prioridade:** MÉDIA

## 7.1 Professor Registra Ocorrência
(Funciona igual ao sistema atual)

## 7.2 Professor Vê Outros (OPCIONAL)

O professor pode ESCOLHER se quer ver o que outros professores disseram:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ OCORRÊNCIAS - João Pedro (6º Ano A)                 │
│  Você: Prof. Maria (Matemática)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📐 MINHAS OCORRÊNCIAS:                                 │
│  ──────────────────────────────────────────────────────│
│  15/03 │ ✅ Ajudou colega com exercício                │
│  10/03 │ ⚠️ Chegou atrasado                            │
│                                                         │
│  ──────────────────────────────────────────────────────│
│  ☑️ Ver ocorrências de outros professores desta turma  │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  (Se marcado, mostra:)                                  │
│                                                         │
│  📚 Português (Prof. Carlos):                           │
│  │ 12/03 │ ⚠️ Conversou durante a aula               │
│                                                         │
│  🌍 Geografia (Prof. Ana):                              │
│  │ 14/03 │ ✅ Apresentação excelente                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 7.3 Relatório de Ocorrências com IA (Coordenador)

```
┌─────────────────────────────────────────────────────────┐
│  🤖 RELATÓRIO COMPORTAMENTAL - 6º Ano A                 │
│  Gerado por IA                     [📥 Baixar Turma]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 ANÁLISE GERAL DA TURMA                              │
│                                                         │
│  🤖 "A turma 6º Ano A apresenta comportamento          │
│      majoritariamente positivo. 68% das ocorrências     │
│      são elogios. Principais desafios: uso de celular   │
│      (12 registros) e conversas paralelas (8)."         │
│                                                         │
│  🏆 Destaque: João Pedro (8 elogios)                   │
│  ⚠️ Atenção: Lucas Oliveira (5 advertências)           │
│                                                         │
│  ──────────────────────────────────────────────────────│
│  👤 ANÁLISE INDIVIDUAL              [📥 Baixar Aluno]   │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  Aluno: [ João Pedro             ▼]                    │
│                                                         │
│  🤖 "João demonstra perfil de liderança colaborativa.  │
│      Pontos fortes: colaboração, participação.          │
│      Áreas de atenção: pontualidade."                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 8: PLANEJAMENTOS E ATIVIDADES
> **Prazo:** 10-12 dias | **Prioridade:** MÉDIA

## 8.1 Editor de Template (Coordenador)

O coordenador cria o modelo que todos os professores usam.

```
┌─────────────────────────────────────────────────────────┐
│  🎨 EDITOR DE TEMPLATE - PLANEJAMENTO                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layout: ○ Vertical  ● Horizontal                       │
│                                                         │
│  ELEMENTOS DISPONÍVEIS (arraste para o modelo):         │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐    │
│  │ 🏫   │ 📅   │ 👨‍🏫  │ 📚   │ 🎯   │ 📝   │ 📋   │    │
│  │ Logo │ Data │ Prof │Disci │Objeti│Conteú│Metodo│    │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘    │
│                                                         │
│  [+ Adicionar Elemento Personalizado]                   │
│                                                         │
│  Elementos personalizados criados:                      │
│  [🏷️ Título "PLANEJAMENTO CENSC 2026"]                 │
│  [📍 Campo "Competências BNCC"]                         │
│  [✅ Campo "Recursos Necessários"]                     │
│                                                         │
│  ──────────────────────────────────────────────────────│
│  PRÉVIA DO MODELO:                                      │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [LOGO]  │  PLANEJAMENTO CENSC 2026             │    │
│  │          │  Turma: ___  Data: ___               │    │
│  ├──────────┴──────────────────────────────────────│    │
│  │  Professor: _______  Disciplina: _______        │    │
│  │  Objetivo: _________________________________    │    │
│  │  Conteúdo: _________________________________    │    │
│  │  Metodologia: ______________________________    │    │
│  │  Competências BNCC: ________________________    │    │
│  │  Recursos Necessários: _____________________    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ⚠️ Ao alterar o modelo:                               │
│  • Planejamentos JÁ FEITOS: ficam no modelo antigo     │
│  • Planejamentos NOVOS: usarão o modelo novo            │
│                                                         │
│                              [Salvar Template]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 8.2 Download de Planejamentos (Coordenador)

```
┌─────────────────────────────────────────────────────────┐
│  📥 BAIXAR PLANEJAMENTOS                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  FILTROS:                                               │
│                                                         │
│  Por Professor: [ Todos                    ▼]          │
│  Por Disciplina: [ Matemática              ▼]          │
│  Por Série: [ 6º Ano                       ▼]          │
│  Por Turma: [ Todas                        ▼]          │
│  Período: [ 01/02/2026 ] até [ 28/02/2026 ]           │
│                                                         │
│  Formato: ○ PDF  ○ Word  ○ Impressão                   │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  RESULTADO: 15 planejamentos encontrados                │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ☑️ Selecionar todos                                   │
│  ☑️ 15/02 - Prof. Maria - 6º A - Equações              │
│  ☑️ 14/02 - Prof. Maria - 6º B - Frações               │
│  ☑️ 13/02 - Prof. Carlos - 6º A - Potenciação          │
│  ...                                                    │
│                                                         │
│                [📥 Baixar Selecionados]                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 8.3 Professor

- Usa o modelo definido pelo coordenador
- Só pode baixar SEUS PRÓPRIOS planejamentos

---

# FASE 8.5: PARECER PEDAGÓGICO
> **Prazo:** 4-5 dias | **Prioridade:** MÉDIA

## 8.5.1 Professor Dá Parecer (Por Unidade)

```
┌─────────────────────────────────────────────────────────┐
│  📝 PARECER PEDAGÓGICO - João Pedro                     │
│  1ª Unidade - Matemática                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ☑️ Ver pareceres de outros professores desta turma    │
│                                                         │
│  (Se marcado:)                                          │
│  ──────────────────────────────────────────────────────│
│  📚 Português (Prof. Carlos):                           │
│  "Dificuldade em interpretação. Sugestão: leitura."     │
│                                                         │
│  🌍 Geografia (Prof. Ana):                              │
│  "Excelente em mapas. Muito participativo."             │
│  ──────────────────────────────────────────────────────│
│                                                         │
│  ✏️ SEU PARECER:                                       │
│                                                         │
│  Como o aluno foi nesta unidade?                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Evolução significativa em operações básicas.    │    │
│  │ Dificuldade com problemas de múltiplas etapas.  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Como ele pode melhorar?                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Exercícios de interpretação de problemas.       │    │
│  │ Conectar com Português (Prof. Carlos sugeriu).  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│                              [Salvar Parecer]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 8.5.2 Coordenador Vê Parecer Consolidado

Mesma estrutura anterior, com síntese IA de todos os pareceres.

---

# FASE 9: REGISTRO DE CHEGADA GPS
> **Prazo:** 8-10 dias | **Prioridade:** MÉDIA-BAIXA

## 9.1 Configuração (Coordenador)

- Define perímetros GPS da escola (múltiplos prédios)
- Define horário de trabalho de cada professor
- Define dias de trabalho

## 9.2 Check-in (Professor)

- Abre o app, clica em "Registrar Chegada"
- Sistema valida GPS
- Foto obrigatória (selfie)
- Salva: hora + localização + foto

## 9.3 Gestão (Coordenador)

- Vê histórico de check-ins COM fotos
- Marca presença/falta manual
- Falta automática se não registrou

## 9.4 Relatório de Ponto (SEM FOTOS)

```
┌─────────────────────────────────────────────────────────┐
│  📊 RELATÓRIO DE PONTO - MARÇO 2026                     │
│  (Dados apenas, sem fotos)            [📥 Baixar Excel] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📈 RANKING DE PONTUALIDADE                             │
│                                                         │
│  🥇 Maria Silva   │ 98% pontual │ 0 faltas │ Destaque  │
│  🥈 Carlos Santos │ 95% pontual │ 1 falta  │           │
│  🥉 Ana Paula     │ 92% pontual │ 1 falta  │           │
│     Pedro Oliveira│ 85% pontual │ 2 faltas │           │
│     João Costa    │ 72% pontual │ 4 faltas │ Atenção   │
│                                                         │
│  ✅ FUNCIONÁRIOS MAIS DEDICADOS:                       │
│  • Maria Silva: 0 atrasos em 22 dias úteis             │
│  • Carlos Santos: Sempre chega 10 min antes            │
│                                                         │
│  ⚠️ FUNCIONÁRIOS COM DIFICULDADES:                     │
│  • João Costa: Média de 8 min de atraso                │
│    Padrão: Segundas (15 min) e Quintas (10 min)        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 10: EVENTOS
> **Prazo:** 3-4 dias | **Prioridade:** BAIXA

## 10.1 Criar Evento (Coordenador)

```
┌─────────────────────────────────────────────────────────┐
│  📅 CRIAR EVENTO                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Título: [ Feira de Ciências                       ]   │
│                                                         │
│  Tipo de data:                                          │
│  ○ Data única (apenas dia da realização)                │
│  ● Período (data de início e fim)                       │
│                                                         │
│  Data início: [ 15/06/2026 ]                           │
│  Data fim:    [ 17/06/2026 ]                           │
│                                                         │
│  Descrição detalhada:                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Feira de Ciências anual da escola.              │    │
│  │                                                  │    │
│  │ DIA 15 (Sexta): Montagem dos estandes          │    │
│  │    Horário: 08h às 17h                          │    │
│  │    Local: Pátio principal                       │    │
│  │                                                  │    │
│  │ DIA 16 (Sábado): Apresentações                 │    │
│  │    Manhã: 08h às 12h (turmas 6º e 7º)          │    │
│  │    Tarde: 14h às 17h (turmas 8º e 9º)          │    │
│  │                                                  │    │
│  │ DIA 17 (Domingo): Premiação e desmontagem      │    │
│  │    Horário: 08h às 12h                          │    │
│  │                                                  │    │
│  │ OBRIGATÓRIO: Cada turma deve ter 2 projetos.   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│                              [Criar Evento]             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 10.2 Visualização (Professor)

Professores veem o calendário de eventos (somente leitura).

## 10.3 Rastreamento de Visualizações (Coordenador)

```
┌─────────────────────────────────────────────────────────┐
│  📊 QUEM VISUALIZOU - Feira de Ciências                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Total: 12 professores                                  │
│  Visualizaram: 9 (75%)  │  Não viram: 3 (25%)          │
│                                                         │
│  ✅ VISUALIZARAM:                                       │
│  │ Maria Silva      │ 10/05 às 14:32                  │
│  │ Carlos Santos    │ 10/05 às 15:45                  │
│  │ ...mais 7                                          │
│                                                         │
│  ❌ NÃO VISUALIZARAM:                                   │
│  │ João Costa       │ Último acesso: 05/05            │
│  │ Pedro Oliveira   │ Último acesso: 08/05            │
│                                                         │
│  [📧 Enviar lembrete para quem não viu]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

# FASE 11: RELATÓRIOS COM IA
> **Prazo:** 5-7 dias | **Prioridade:** BAIXA

Cruza dados de todos os professores para gerar relatório completo de cada aluno.

---

# MATRIZ DE PERMISSÕES

| Funcionalidade | Coordenador | Professor |
|----------------|:-----------:|:---------:|
| **TURMAS** | CRUD | View |
| **PROFESSORES - Atribuição** | ✅ | ❌ |
| **DISCIPLINAS - Atribuição** | ✅ | ❌ |
| **ALUNOS** | CRUD + Inclusão + Transferência | View + Filter |
| **ANIVERSÁRIOS** | Ver todos | Ver de suas turmas |
| **HORÁRIOS** | CRUD | View own |
| **NOTAS - Config** | ✅ (componentes, aprovação, final, recuperação) | ❌ |
| **NOTAS - Lançar** | ❌ | ✅ |
| **NOTAS - Ver** | All + Download | Own only |
| **FREQUÊNCIA ALUNOS** | View + Download (por disciplina) | CRUD |
| **OCORRÊNCIAS - Registrar** | ❌ | ✅ |
| **OCORRÊNCIAS - Ver outros** | ✅ All | ✅ Mesma turma (opcional) |
| **OCORRÊNCIAS - Relatório IA** | ✅ Download (turma/aluno) | ❌ |
| **PARECER PEDAGÓGICO** | View All | Write + View others (opcional) |
| **TEMPLATES (plan/ativ)** | CRUD + Elementos personalizados | Use only |
| **PLANEJAMENTO/ATIV - Download** | ✅ All (filtros: prof/disc/turma/série) | ✅ Own only |
| **PONTO GPS - Relatório** | ✅ Download (sem fotos) | ❌ |
| **EVENTOS** | CRUD + Ver quem visualizou | View only |

---

# CRONOGRAMA

```
Semana 1-2:   Fase 0 + 1 (Correções + Config Notas Completa)
Semana 3-4:   Fase 2 + 3 (Turmas + Alunos + Inclusão + Transferência)
Semana 5-6:   Fase 4 + 5 (Horários + Notas + Relatórios)
Semana 7-8:   Fase 6 + 7 (Frequência + Ocorrências + IA)
Semana 9-10:  Fase 8 + 8.5 (Templates + Parecer Pedagógico)
Semana 11-12: Fase 9 (GPS Check-in + Relatório)
Semana 13-14: Fase 10 + 11 (Eventos + Relatórios IA)
```

**Total Estimado: ~14 semanas (3.5 meses)**

---

# PERGUNTAS RESPONDIDAS

✅ **Prova Final:** Baseado em pontos que faltam vs valor máximo da prova
✅ **Inclusão:** Altera nota máxima, não média
✅ **Componentes:** Qualitativo, Teste e Prova vêm por padrão (editáveis)
✅ **Tipo Inclusão:** Campo texto livre
✅ **Aniversários:** Notificação automática para professores
✅ **Transferência:** Em massa ou individual, sem dados do ano letivo
✅ **Ocorrências outros:** OPCIONAL, professor escolhe se quer ver
✅ **Templates:** Adicionar elementos, não elementos fixos
✅ **Download planejamentos:** Filtros por disciplina, professor, turma, série

---

# DOCUMENTO PARA REFERÊNCIA

Este documento está salvo em:
`c:\Users\Chinc\Downloads\prof.-acerta+-3.1\PLANO_COORDENADOR_V1.md`

Você pode abrir este arquivo a qualquer momento para verificar o plano original.

---

**Versão:** 1.0
**Data:** 05/02/2026
**Autor:** Antigravity AI + Usuario
