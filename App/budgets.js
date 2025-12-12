import { App } from './state.js';
import { Storage } from './storage.js';
import { U } from './utils.js';

export const Budgets = {
  async save(e) {
    e.preventDefault();
    const idInput = document.getElementById('budget-id');
    const id = idInput?.value || ('budget_' + Date.now());
    const mes = document.getElementById('presupuesto-mes')?.value;
    const categoriaId = document.getElementById('presupuesto-categoria')?.value;
    const montoEstimado = parseFloat(document.getElementById('presupuesto-monto')?.value || 0);

    if (!mes || !categoriaId || !montoEstimado || montoEstimado <= 0) {
      return U.toast('Complete todos los campos con valores válidos', 'error');
    }

    const idx = App.state.presupuestos.findIndex(p => p.id === id);
    const data = { id, mes, categoriaId, montoEstimado };

    if (idx !== -1) {
      App.state.presupuestos[idx] = data;
      U.activateSection('presupuestos');
      U.focusFirstInput('presupuestos');
    } else {
      const duplicado = App.state.presupuestos.find(p => p.mes === mes && p.categoriaId === categoriaId);
      if (duplicado) return U.toast('Ya existe un presupuesto para esa categoría en ese mes', 'error');
      App.state.presupuestos.push(data);
      U.activateSection('presupuestos');
      U.focusFirstInput('presupuestos');
    }

    await Storage.saveAll(Storage.STORES.P, App.state.presupuestos);
    Budgets.render();
    Budgets.clearForm();
    window.dispatchEvent(new CustomEvent('data:changed', { detail: { type: 'presupuestos' } }));
    U.toast('Presupuesto guardado', 'success');
  },

  render() {
    const tbody = document.getElementById('cuerpo-tabla-presupuestos');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!App.state.presupuestos.length) {
      tbody.innerHTML = '<tr><td colspan="7">No hay presupuestos</td></tr>';
      return;
    }
    App.state.presupuestos.forEach(p => {
      const gastoReal = App.state.transacciones
        .filter(t => t.tipo === 'egreso' && t.categoriaId === p.categoriaId && t.fecha?.startsWith(p.mes))
        .reduce((s, t) => s + t.monto, 0);
      const desviacion = gastoReal - p.montoEstimado;
      const porcentaje = p.montoEstimado > 0 ? (gastoReal / p.montoEstimado) * 100 : 0;
      const estado = porcentaje >= 100 ? 'Superado' : (porcentaje >= 80 ? 'En riesgo' : 'Dentro');
      const cat = App.state.categorias.find(c => c.id === p.categoriaId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cat?.nombre || 'Categoría'}</td>
        <td>$${p.montoEstimado.toFixed(2)}</td>
        <td>$${gastoReal.toFixed(2)}</td>
        <td>${desviacion >= 0 ? '+' : '-'}$${Math.abs(desviacion).toFixed(2)}</td>
        <td>${porcentaje.toFixed(0)}%</td>
        <td>${estado}</td>
        <td>
          <button type="button" onclick="Budgets.edit('${p.id}')">✏️</button>
          <button type="button" onclick="Budgets.requestDelete('${p.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
      if (estado === 'Superado') tr.style.backgroundColor = '#ffe6e6';
      else if (estado === 'En riesgo') tr.style.backgroundColor = '#fff7e6';
    });

    const cont = document.getElementById('proyeccion-egresos');
    if (cont) {
      const mesSel = document.getElementById('presupuesto-mes')?.value || new Date().toISOString().slice(0, 7);
      const egresosMes = App.state.transacciones
        .filter(t => t.tipo === 'egreso' && t.fecha?.startsWith(mesSel))
        .reduce((s, t) => s + t.monto, 0);
      cont.textContent = `Egresos reales del mes ${mesSel}: $${egresosMes.toFixed(2)}`;
    }
  },

  edit(id) {
    const p = App.state.presupuestos.find(x => x.id === id);
    if (!p) return;
    document.getElementById('budget-id').value = p.id;
    document.getElementById('presupuesto-mes').value = p.mes;
    document.getElementById('presupuesto-categoria').value = p.categoriaId;
    document.getElementById('presupuesto-monto').value = p.montoEstimado;
    U.activateSection('presupuestos');
    U.focusFirstInput('presupuestos');
  },

  requestDelete(id) {
    U.confirm('Eliminar Presupuesto', '¿Está seguro de que desea eliminar este presupuesto?', () => Budgets.delete(id));
  },

  async delete(id) {
    App.state.presupuestos = App.state.presupuestos.filter(p => p.id !== id);
    await Storage.delete(Storage.STORES.P, id);
    await Storage.saveAll(Storage.STORES.P, App.state.presupuestos);
    Budgets.render();
    window.dispatchEvent(new CustomEvent('data:changed', { detail: { type: 'presupuestos' } }));
    U.toast('Presupuesto eliminado', 'success');
    U.closeModal();
  },

  clearForm() {
    const form = document.getElementById('form-presupuesto');
    if (form) form.reset();
    const id = document.getElementById('budget-id');
    if (id) id.value = '';
  }
};