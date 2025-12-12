import { App } from './state.js';
import { Storage } from './storage.js';
import { U } from './utils.js';

export const Transactions = {
  async save(e) {
    e.preventDefault();
    const id = document.getElementById('transaction-id')?.value || '';
    const tipo = document.querySelector('input[name="tipo-transaccion"]:checked')?.value;
    const monto = parseFloat(document.getElementById('monto')?.value || 0);
    const fecha = document.getElementById('fecha')?.value;
    const categoriaId = document.getElementById('categoria-transaccion')?.value;
    const descripcion = document.getElementById('descripcion')?.value?.trim();

    if (!tipo) return U.toast('Debe seleccionar el tipo de transacción', 'error');
    if (!monto || monto <= 0) return U.toast('El monto debe ser mayor a cero', 'error');
    if (!categoriaId) return U.toast('Debe seleccionar una categoría', 'error');

    const data = {
      id: id || 'trans_' + Date.now(),
      tipo,
      monto,
      fecha,
      categoriaId,
      descripcion,
      fechaRegistro: new Date().toISOString()
    };

    if (App.mode.modoEdicion && App.mode.elementoEditando) {
      const idx = App.state.transacciones.findIndex(t => t.id === App.mode.elementoEditando);
      if (idx !== -1) App.state.transacciones[idx] = { ...App.state.transacciones[idx], ...data };
      U.activateSection('transacciones');
      U.focusFirstInput('transacciones');
    } else {
      App.state.transacciones.push(data);
      U.activateSection('transacciones');
      U.focusFirstInput('transacciones');
    }

    App.state.transacciones.sort((a, b) => (U.parseDateLocal(b.fecha)?.getTime() || 0) - (U.parseDateLocal(a.fecha)?.getTime() || 0));
    await Storage.saveAll(Storage.STORES.T, App.state.transacciones);
    Transactions.render();
    window.dispatchEvent(new CustomEvent('data:changed', { detail: { type: 'transacciones' } }));
    U.toast('Transacción guardada', 'success');
    Transactions.clearForm();
  },

  render(list = null) {
    const tbody = document.getElementById('cuerpo-tabla-transacciones');
    if (!tbody) return;
    const datos = list || App.state.transacciones;
    tbody.innerHTML = '';
    if (!datos.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-message">No hay transacciones registradas</td></tr>`;
      Transactions.updateSummary([]);
      return;
    }
    datos.forEach(t => {
      const cat = App.state.categorias.find(c => c.id === t.categoriaId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${U.fmt(t.fecha)}</td>
        <td>${t.descripcion || '-'}</td>
        <td><span class="badge-categoria" style="background:${cat?.color || '#ccc'}">${cat?.nombre || 'Sin categoría'}</span></td>
        <td><span class="tipo-badge ${t.tipo}">${t.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</span></td>
        <td class="${t.tipo === 'ingreso' ? 'positive' : 'negative'}">${t.tipo === 'ingreso' ? '+' : '-'}$${t.monto.toFixed(2)}</td>
        <td>
          <button class="btn-accion btn-editar-trans" data-id="${t.id}">✏️</button>
          <button class="btn-accion btn-eliminar-trans" data-id="${t.id}">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.btn-editar-trans').forEach(b => b.addEventListener('click', (e) => Transactions.edit(e)));
    document.querySelectorAll('.btn-eliminar-trans').forEach(b => b.addEventListener('click', (e) => Transactions.requestDelete(e)));
    Transactions.updateSummary(datos);
  },

  filter() {
    const tipo = document.getElementById('filtro-tipo')?.value;
    const categoria = document.getElementById('filtro-categoria')?.value;
    const q = document.getElementById('busqueda')?.value?.toLowerCase();
    const mes = document.getElementById('filtro-mes')?.value;
    let res = App.state.transacciones;
    if (tipo) res = res.filter(x => x.tipo === tipo);
    if (categoria) res = res.filter(x => x.categoriaId === categoria);
    if (q) {
      res = res.filter(x =>
        (x.descripcion && x.descripcion.toLowerCase().includes(q)) ||
        (App.state.categorias.find(c => c.id === x.categoriaId)?.nombre.toLowerCase().includes(q))
      );
    }
    if (mes) res = res.filter(x => x.fecha && x.fecha.startsWith(mes));
    Transactions.render(res);
  },

  clearFilters() {
    ['filtro-tipo', 'filtro-categoria', 'busqueda'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const fm = document.getElementById('filtro-mes');
    if (fm) fm.value = new Date().toISOString().slice(0, 7);
    Transactions.render();
  },

  edit(e) {
    const id = e.currentTarget?.dataset?.id || e.target.closest('button')?.dataset?.id;
    const t = App.state.transacciones.find(x => x.id === id);
    if (!t) return;
    App.mode.modoEdicion = true;
    App.mode.elementoEditando = id;
    const title = document.getElementById('form-transaccion-titulo');
    if (title) title.textContent = 'Editar Transacción';
    document.getElementById('transaction-id').value = t.id;
    const radio = document.querySelector(`input[name="tipo-transaccion"][value="${t.tipo}"]`);
    if (radio) radio.checked = true;
    document.getElementById('monto').value = t.monto;
    document.getElementById('fecha').value = t.fecha;
    document.getElementById('categoria-transaccion').value = t.categoriaId;
    document.getElementById('descripcion').value = t.descripcion || '';
    U.activateSection('transacciones');
    U.focusFirstInput('transacciones');
  },

  requestDelete(e) {
    const id = e.currentTarget?.dataset?.id || e.target.closest('button')?.dataset?.id;
    U.confirm('Eliminar Transacción', '¿Está seguro de que desea eliminar esta transacción?', () => Transactions.delete(id));
  },

  async delete(id) {
    App.state.transacciones = App.state.transacciones.filter(t => t.id !== id);
    await Storage.delete(Storage.STORES.T, id);
    await Storage.saveAll(Storage.STORES.T, App.state.transacciones);
    Transactions.render();
    window.dispatchEvent(new CustomEvent('data:changed', { detail: { type: 'transacciones' } }));
    U.toast('Transacción eliminada', 'success');
    U.closeModal();
  },

  clearForm() {
    App.mode.modoEdicion = false;
    App.mode.elementoEditando = null;
    const form = document.getElementById('form-transaccion');
    if (form) form.reset();
    const title = document.getElementById('form-transaccion-titulo');
    if (title) title.textContent = 'Gestión de Transacciones';
    const idEl = document.getElementById('transaction-id');
    if (idEl) idEl.value = '';
    const fecha = document.getElementById('fecha');
    if (fecha) fecha.value = new Date().toISOString().split('T')[0];
  },

  updateSummary(datos) {
    const ingresos = datos.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
    const egresos = datos.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);
    const totalIngresosEl = document.getElementById('total-ingresos');
    const totalEgresosEl = document.getElementById('total-egresos');
    const balanceEl = document.getElementById('balance-transacciones');
    if (totalIngresosEl) totalIngresosEl.textContent = `$${ingresos.toFixed(2)}`;
    if (totalEgresosEl) totalEgresosEl.textContent = `$${egresos.toFixed(2)}`;
    if (balanceEl) balanceEl.textContent = `$${(ingresos - egresos).toFixed(2)}`;
  }
};
