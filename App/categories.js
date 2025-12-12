import { App } from './state.js';
import { Storage } from './storage.js';
import { U } from './utils.js';

export const Categories = {
  render() {
    const cont = document.getElementById('lista-categorias');
    if (!cont) return;
    cont.innerHTML = '';
    App.state.categorias.forEach(c => {
      const el = document.createElement('div');
      el.className = 'categoria-card';
      el.style.borderLeftColor = c.color;
      el.innerHTML = `
        <div class="categoria-info">
          <span class="categoria-color" style="background:${c.color}"></span>
          <div><h4>${c.nombre}</h4><small>${c.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</small></div>
        </div>
        <div class="categoria-acciones">
          <button class="btn-editar" data-id="${c.id}">✏️</button>
          <button class="btn-eliminar" data-id="${c.id}">🗑️</button>
        </div>
      `;
      cont.appendChild(el);
    });
    document.querySelectorAll('.btn-editar').forEach(b => b.addEventListener('click', (e) => Categories.edit(e)));
    document.querySelectorAll('.btn-eliminar').forEach(b => b.addEventListener('click', (e) => Categories.requestDelete(e)));
    Categories.updateSelectors();
  },

  async save(e) {
    e.preventDefault();
    const name = document.getElementById('nombre-categoria')?.value?.trim();
    const tipo = document.getElementById('tipo-categoria')?.value || 'egreso';
    const color = document.getElementById('color-categoria')?.value || '#3498db';
    if (!name) return U.toast('El nombre de la categoría es obligatorio', 'error');

    if (App.mode.modoEdicion && App.mode.elementoEditando) {
      const idx = App.state.categorias.findIndex(x => x.id === App.mode.elementoEditando);
      if (idx !== -1) App.state.categorias[idx] = { ...App.state.categorias[idx], nombre: name, tipo, color };
      U.activateSection('categorias');
      U.focusFirstInput('categorias');
    } else {
      const nueva = { id: 'cat_' + Date.now(), nombre: name, tipo, color };
      App.state.categorias.push(nueva);
      U.activateSection('categorias');
      U.focusFirstInput('categorias');
    }

    await Storage.saveAll(Storage.STORES.C, App.state.categorias);
    Categories.render();
    Categories.clearForm();
    U.toast('Categoría guardada', 'success');
    window.dispatchEvent(new CustomEvent('data:changed', { detail: { type: 'categorias' } }));
  },

  edit(e) {
    const id = e.currentTarget?.dataset?.id || e.target.closest('button')?.dataset?.id;
    const c = App.state.categorias.find(x => x.id === id);
    if (!c) return;
    App.mode.modoEdicion = true;
    App.mode.elementoEditando = id;
    const title = document.getElementById('form-categoria-titulo');
    if (title) title.textContent = 'Editar Categoría';
    document.getElementById('category-id').value = c.id;
    document.getElementById('nombre-categoria').value = c.nombre;
    document.getElementById('tipo-categoria').value = c.tipo;
    document.getElementById('color-categoria').value = c.color;
    U.activateSection('categorias');
    U.focusFirstInput('categorias');
  },

  requestDelete(e) {
    const id = e.currentTarget?.dataset?.id || e.target.closest('button')?.dataset?.id;
    const has = App.state.transacciones.some(t => t.categoriaId === id);
    const msg = has ? 'Esta categoría tiene transacciones asociadas. ¿Desea eliminarla junto con todas sus transacciones?' : '¿Está seguro de que desea eliminar esta categoría?';
    U.confirm('Eliminar Categoría', msg, () => Categories.delete(id, has));
  },

  async delete(id, cascade = false) {
    if (cascade) {
      const ids = App.state.transacciones.filter(t => t.categoriaId === id).map(t => t.id);
      App.state.transacciones = App.state.transacciones.filter(t => t.categoriaId !== id);
      await Promise.all(ids.map(i => Storage.delete(Storage.STORES.T, i)));
      await Storage.saveAll(Storage.STORES.T, App.state.transacciones);
    }
    App.state.categorias = App.state.categorias.filter(c => c.id !== id);
    await Storage.delete(Storage.STORES.C, id);
    await Storage.saveAll(Storage.STORES.C, App.state.categorias);
    Categories.render();
    U.toast('Categoría eliminada', 'success');
    window.dispatchEvent(new CustomEvent('data:changed', { detail: { type: 'categorias' } }));
  },

  clearForm() {
    App.mode.modoEdicion = false;
    App.mode.elementoEditando = null;
    const form = document.getElementById('form-categoria');
    if (form) form.reset();
    const title = document.getElementById('form-categoria-titulo');
    if (title) title.textContent = 'Gestión de Categorías';
  },

  updateSelectors() {
    const selT = document.getElementById('categoria-transaccion');
    const selF = document.getElementById('filtro-categoria');
    const selP = document.getElementById('presupuesto-categoria');

    if (selT) {
      selT.innerHTML = '';
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Seleccione una categoría';
      selT.appendChild(empty);
    }
    if (selF) {
      while (selF.options.length > 1) selF.remove(1);
    }

    App.state.categorias.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.nombre;
      if (selT) selT.appendChild(o.cloneNode(true));
      if (selF) selF.appendChild(o.cloneNode(true));
    });

    if (selP) {
      selP.innerHTML = '';
      App.state.categorias.forEach(c => {
        const o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.nombre;
        selP.appendChild(o);
      });
    }
  }
};
