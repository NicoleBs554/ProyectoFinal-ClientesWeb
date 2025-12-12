import { App } from './state.js';
import { Storage } from './storage.js';
import { U } from './utils.js';
import { Categories } from './categories.js';
import { Transactions } from './transactions.js';
import { Budgets } from './budgets.js';
import { Dashboard } from './dashboard.js';

export const AppController = {
  async init() {
    await Storage.migrateIfNeeded();
    App.state.categorias = await Storage.getAll(Storage.STORES.C);
    if (!App.state.categorias.length) { App.state.categorias = [...CATEGORIAS_PREDEFINIDAS]; await Storage.saveAll(Storage.STORES.C, App.state.categorias); }
    App.state.transacciones = await Storage.getAll(Storage.STORES.T);
    App.state.presupuestos = await Storage.getAll(Storage.STORES.P);

    this.bindEvents();
    this.initDates();
    Categories.render(); Transactions.render(); Budgets.render(); Dashboard.actualizar();
  },

  bindEvents() {
    document.querySelectorAll('.sidebar a').forEach(b => b.addEventListener('click', e => this.changeSection(e)));
    document.getElementById('form-categoria')?.addEventListener('submit', Categories.save);
    document.getElementById('form-transaccion')?.addEventListener('submit', Transactions.save);
    document.getElementById('form-presupuesto')?.addEventListener('submit', Budgets.save);
    document.getElementById('btn-modal-cancelar')?.addEventListener('click', U.closeModal);
    document.getElementById('filtro-tipo')?.addEventListener('change', Transactions.filter);
    document.getElementById('filtro-categoria')?.addEventListener('change', Transactions.filter);
    document.getElementById('busqueda')?.addEventListener('input', Transactions.filter);
    document.getElementById('filtro-mes')?.addEventListener('change', Transactions.filter);
    document.getElementById('dashboard-filtro-mes')?.addEventListener('change', Dashboard.actualizar);
    window.addEventListener('data:changed', () => { Categories.updateSelectors(); Transactions.render(); Budgets.render(); Dashboard.actualizar(); });
  },

  changeSection(e) {
    e.preventDefault();
    const id = e.currentTarget.dataset.section;
    document.querySelectorAll('.sidebar a').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    if (id === 'dashboard') Dashboard.actualizar();
    else if (id === 'transacciones') Transactions.render();
    else if (id === 'presupuestos') Budgets.render();
  },

  initDates() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha') && (document.getElementById('fecha').value = hoy);
    document.getElementById('filtro-mes') && (document.getElementById('filtro-mes').value = hoy.slice(0, 7));
  }
};

window.Categories = Categories;
window.Transactions = Transactions;
window.Budgets = Budgets;
window.Dashboard = Dashboard;
window.U = U;

document.addEventListener('DOMContentLoaded', () => AppController.init().catch(err => console.error(err)));
