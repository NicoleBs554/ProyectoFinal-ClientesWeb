import { App } from './state.js';
import { U } from './utils.js';

export const Dashboard = {
  getMonth() {
    return document.getElementById('dashboard-filtro-mes')?.value || new Date().toISOString().slice(0, 7);
  },

  actualizar() {
    const mes = Dashboard.getMonth();
    const ingresosMes = App.state.transacciones
      .filter(t => t.tipo === 'ingreso' && t.fecha && t.fecha.startsWith(mes))
      .reduce((s, t) => s + t.monto, 0);
    const egresosMes = App.state.transacciones
      .filter(t => t.tipo === 'egreso' && t.fecha && t.fecha.startsWith(mes))
      .reduce((s, t) => s + t.monto, 0);
    const balanceTotal = App.state.transacciones
      .filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0) -
      App.state.transacciones.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);

    const ingresosEl = document.getElementById('dashboard-ingresos');
    const egresosEl = document.getElementById('dashboard-gastos');
    const balanceEl = document.getElementById('dashboard-balance');
    if (ingresosEl) ingresosEl.textContent = `$${ingresosMes.toFixed(2)}`;
    if (egresosEl) egresosEl.textContent = `$${egresosMes.toFixed(2)}`;
    if (balanceEl) balanceEl.textContent = `$${balanceTotal.toFixed(2)}`;

    Dashboard.updateCharts();
    Dashboard.renderRecents();
  },

  renderRecents() {
    const tb = document.getElementById('dashboard-transacciones-recientes');
    if (!tb) return;
    tb.innerHTML = '';
    const recientes = App.state.transacciones.slice(0, 5);
    if (!recientes.length) {
      tb.innerHTML = `<tr><td colspan="5">No hay transacciones recientes</td></tr>`;
      return;
    }
    recientes.forEach(t => {
      const cat = App.state.categorias.find(c => c.id === t.categoriaId);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${U.fmt(t.fecha)}</td><td>${t.descripcion || '-'}</td><td>${cat?.nombre || 'Sin categoría'}</td><td>${t.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</td><td>$${t.monto.toFixed(2)}</td>`;
      tb.appendChild(tr);
    });
  },

  monthsLast12() {
    const meses = [];
    const base = new Date();
    base.setDate(1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return meses;
  },

  updateCharts() {
    const cG = document.getElementById('expensesByCategoryChart');
    const cE = document.getElementById('annualBalanceChart');
    const cB = document.getElementById('balanceVsEstimatedChart');
    const cV = document.getElementById('expensesVsEstimatedChart');
    const mes = Dashboard.getMonth();
    if (!cG || !cE) return;

    const gastos = {};
    App.state.transacciones
      .filter(t => t.tipo === 'egreso' && t.fecha?.startsWith(mes))
      .forEach(t => {
        const cat = App.state.categorias.find(c => c.id === t.categoriaId);
        if (cat) gastos[cat.nombre] = (gastos[cat.nombre] || 0) + t.monto;
      });

    if (window.chartGastos) window.chartGastos.destroy();
    window.chartGastos = new Chart(cG.getContext('2d'), {
      type: 'pie',
      data: {
        labels: Object.keys(gastos),
        datasets: [{
          data: Object.values(gastos),
          backgroundColor: Object.keys(gastos).map(nombre => {
            const cat = App.state.categorias.find(c => c.nombre === nombre);
            return cat ? cat.color : '#ccc';
          })
        }]
      },
      options: { responsive: true, plugins: { title: { display: true, text: `Gastos por categoría (${mes})` } } }
    });

    const evo = {};
    App.state.transacciones.forEach(t => {
      const m = t.fecha ? t.fecha.slice(0, 7) : 'unknown';
      if (!evo[m]) evo[m] = { ingresos: 0, egresos: 0 };
      if (t.tipo === 'ingreso') evo[m].ingresos += t.monto;
      else evo[m].egresos += t.monto;
    });
    const meses = Object.keys(evo).sort();

    if (window.chartEvolucion) window.chartEvolucion.destroy();
    window.chartEvolucion = new Chart(cE.getContext('2d'), {
      type: 'line',
      data: {
        labels: meses,
        datasets: [
          { label: 'Ingresos', data: meses.map(m => evo[m].ingresos), borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,0.1)', tension: 0.3 },
          { label: 'Egresos', data: meses.map(m => evo[m].egresos), borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.1)', tension: 0.3 }
        ]
      },
      options: { responsive: true, plugins: { title: { display: true, text: 'Evolución mensual' } }, scales: { y: { beginAtZero: true } } }
    });

    if (cB) {
      const meses12 = Dashboard.monthsLast12();
      const balanceRealPorMes = meses12.map(m => {
        const ingresos = App.state.transacciones.filter(t => t.tipo === 'ingreso' && t.fecha?.startsWith(m)).reduce((s, t) => s + t.monto, 0);
        const egresos = App.state.transacciones.filter(t => t.tipo === 'egreso' && t.fecha?.startsWith(m)).reduce((s, t) => s + t.monto, 0);
        return ingresos - egresos;
      });
      const balanceEstimadoPorMes = meses12.map(m => {
        const estimadoEgresos = App.state.presupuestos.filter(p => p.mes === m).reduce((s, p) => s + p.montoEstimado, 0);
        return -estimadoEgresos;
      });

      if (window.chartBalanceVs) window.chartBalanceVs.destroy();
      window.chartBalanceVs = new Chart(cB.getContext('2d'), {
        type: 'line',
        data: {
          labels: meses12,
          datasets: [
            { label: 'Balance real', data: balanceRealPorMes, borderColor: '#34495e', backgroundColor: 'rgba(52,73,94,0.1)', tension: 0.3 },
            { label: 'Balance estimado', data: balanceEstimadoPorMes, borderColor: '#8e44ad', backgroundColor: 'rgba(142,68,173,0.1)', tension: 0.3 }
          ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Balance real vs estimado' } }, scales: { y: { beginAtZero: true } } }
      });
    }

    if (cV) {
      const etiquetas = App.state.categorias.map(c => c.nombre);
      const estimados = App.state.categorias.map(c => App.state.presupuestos.filter(p => p.mes === mes && p.categoriaId === c.id).reduce((s, p) => s + p.montoEstimado, 0));
      const reales = App.state.categorias.map(c => App.state.transacciones.filter(t => t.tipo === 'egreso' && t.categoriaId === c.id && t.fecha?.startsWith(mes)).reduce((s, t) => s + t.monto, 0));

      if (window.chartEgresosVs) window.chartEgresosVs.destroy();
      window.chartEgresosVs = new Chart(cV.getContext('2d'), {
        type: 'bar',
        data: {
          labels: etiquetas,
          datasets: [
            { label: 'Estimado', data: estimados, backgroundColor: 'rgba(241, 196, 15, 0.6)' },
            { label: 'Real', data: reales, backgroundColor: 'rgba(231, 76, 60, 0.6)' }
          ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: `Egresos estimados vs reales (${mes})` } }, scales: { y: { beginAtZero: true } } }
      });
    }
  }
};
