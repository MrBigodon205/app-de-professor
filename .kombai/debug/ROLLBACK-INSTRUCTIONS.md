# ⏪ INSTRUÇÕES DE ROLLBACK — Sprint 1 Fixes

**Data:** 11/02/2026  
**Branch de Trabalho:** `audit-fixes-sprint1-backup`  
**Branch Original:** `main`  

---

## 🎯 O que foi modificado?

### Arquivos Criados
- `components/Toast.tsx` - Componente Toast reutilizável com ToastProvider

### Arquivos Modificados
- `App.tsx` - ToastProvider wrapper adicionado
- `institutional/attendance/InstitutionalAttendance.tsx` - 1 alert substituído
- `institutional/planning/InstitutionalPlanningTemplates.tsx` - 5 alerts/confirms substituídos

**Total:** 1 arquivo criado, 3 arquivos modificados

---

## ✅ OPÇÃO 1: Rollback Completo via Git (RECOMENDADO)

Se você quiser **desfazer todas as mudanças** e voltar ao estado anterior:

```powershell
# 1. Voltar para o branch main
git checkout main

# 2. Deletar o branch de teste (OPCIONAL - só se quiser limpar)
git branch -D audit-fixes-sprint1-backup

# 3. Verificar que está no estado original
git status
```

**Resultado:** Todas as mudanças serão descartadas e o código voltará ao estado exato antes da implementação.

---

## 🔧 OPÇÃO 2: Rollback Parcial (Manter Toast, remover uso)

Se você quiser **manter o componente Toast** mas **remover temporariamente o uso**:

### Passo 1: Remover ToastProvider do App.tsx

```tsx
// App.tsx - REMOVER estas linhas:
import { ToastProvider } from './components/Toast';  // ← DELETAR

// Na função App, REMOVER:
<ToastProvider>                                       // ← DELETAR
  <SpeedInsights />
  ...
</ToastProvider>                                      // ← DELETAR

// Deixar apenas:
<SpeedInsights />
```

### Passo 2: Restaurar alert() em InstitutionalAttendance.tsx

```tsx
// institutional/attendance/InstitutionalAttendance.tsx
// REMOVER:
import { useToast } from '../../components/Toast';   // ← DELETAR
const { showToast } = useToast();                     // ← DELETAR

// LINHA 75 - RESTAURAR:
showToast("Erro ao registrar ponto...", 'error');    // ← DELETAR
// ↓ SUBSTITUIR POR:
alert("Erro ao registrar ponto via App.");
```

### Passo 3: Restaurar alert()/confirm() em InstitutionalPlanningTemplates.tsx

```tsx
// institutional/planning/InstitutionalPlanningTemplates.tsx
// REMOVER:
import { useToast } from '../../components/Toast';   // ← DELETAR
const { showToast, showConfirm } = useToast();        // ← DELETAR

// LINHA 69 - RESTAURAR:
showToast("Este modelo foi criado...", 'warning');   // ← DELETAR
// ↓ SUBSTITUIR POR:
alert("Este modelo foi criado com o editor antigo e não pode ser editado...");

// LINHA 81-88 - RESTAURAR:
showConfirm('Tem certeza?...', async () => { ... }); // ← DELETAR TODO O BLOCO
// ↓ SUBSTITUIR POR:
if (!confirm('Tem certeza? Isso não afetará planos já criados...')) return;
try {
  const { error } = await supabase.from('planning_templates').delete().eq('id', id);
  if (error) throw error;
  setTemplates(prev => prev.filter(t => t.id !== id));
} catch (e) {
  alert('Erro ao excluir');
}

// LINHA 92-95 - RESTAURAR:
if (!currentTemplate.name) {
  showToast('Dê um nome ao modelo', 'warning');      // ← DELETAR
  return;
}
// ↓ SUBSTITUIR POR:
if (!currentTemplate.name) return alert('Dê um nome ao modelo');

// LINHA 124 - RESTAURAR:
showToast('Modelo salvo com sucesso!', 'success');   // ← DELETAR
// ↓ SUBSTITUIR POR:
alert('Modelo salvo com sucesso!');

// LINHA 126 - RESTAURAR:
showToast('Erro ao salvar: ' + e.message, 'error'); // ← DELETAR
// ↓ SUBSTITUIR POR:
alert('Erro ao salvar: ' + e.message);
```

---

## 🧪 OPÇÃO 3: Testar antes de decidir

Se você quiser **testar as mudanças** antes de fazer rollback:

```powershell
# 1. Abrir a aplicação (já está rodando em http://localhost:3000)
# 2. Navegar para páginas que usam Toast:
#    - Institutional → Attendance (GPS)
#    - Institutional → Planning Templates

# 3. Testar ações que geram notificações:
#    - Tentar registrar ponto sem GPS
#    - Salvar/editar/excluir modelos de planejamento

# 4. Verificar se:
#    ✅ Toast aparece no canto superior direito
#    ✅ Toast tem ícone e cor corretos (erro = vermelho, sucesso = verde)
#    ✅ Confirm mostra botões "Confirmar" e "Cancelar"
#    ✅ Toast fecha automaticamente após 4 segundos
#    ✅ Não há erros no console
```

Se tudo funcionar bem → **NÃO faça rollback**, as mudanças estão funcionando!  
Se houver problemas → **Use OPÇÃO 1 para rollback completo**.

---

## 📝 Notas Importantes

- O branch `audit-fixes-sprint1-backup` **contém um commit limpo** com todas as mudanças
- Você pode **comparar** o código antes/depois usando: `git diff main audit-fixes-sprint1-backup`
- O componente Toast é **totalmente independente** e pode ser removido sem afetar o resto do app
- Todas as mudanças foram **testadas localmente** mas **não em produção**

---

## ❓ Dúvidas ou Problemas?

Se encontrar qualquer erro durante o rollback ou tiver dúvidas:
1. Consulte o changelog completo em `.kombai/debug/sprint1-fixes-changelog.md`
2. Verifique o status do Git: `git status`
3. Se necessário, force o reset: `git reset --hard main`
