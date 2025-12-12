const CATEGORIAS_PREDEFINIDAS = [
  { id: 'cat1', nombre: 'Alimentación', tipo: 'egreso', color: '#e74c3c' },
  { id: 'cat2', nombre: 'Transporte', tipo: 'egreso', color: '#3498db' },
  { id: 'cat3', nombre: 'Ocio', tipo: 'egreso', color: '#9b59b6' },
  { id: 'cat4', nombre: 'Servicios', tipo: 'egreso', color: '#1abc9c' },
  { id: 'cat5', nombre: 'Salud', tipo: 'egreso', color: '#e67e22' },
  { id: 'cat6', nombre: 'Educación', tipo: 'egreso', color: '#2ecc71' },
  { id: 'cat7', nombre: 'Otros', tipo: 'egreso', color: '#95a5a6' },
  { id: 'cat8', nombre: 'Salario', tipo: 'ingreso', color: '#27ae60' },
  { id: 'cat9', nombre: 'Ingresos Extra', tipo: 'ingreso', color: '#f39c12' }
];

const App = {
  state: {
    categorias: [],
    transacciones: [],
    presupuestos: []
  },
  mode: {
    modoEdicion: false,
    elementoEditando: null
  }
};

const Storage = (function () {
  const DB_NAME = 'finanzas_db';
  const DB_VERSION = 1;
  const STORE_CATEGORIAS = 'categorias';
  const STORE_TRANSACCIONES = 'transacciones';
  const STORE_PRESUPUESTOS = 'presupuestos';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_CATEGORIAS)) {
          db.createObjectStore(STORE_CATEGORIAS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_TRANSACCIONES)) {
          db.createObjectStore(STORE_TRANSACCIONES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PRESUPUESTOS)) {
          db.createObjectStore(STORE_PRESUPUESTOS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGetAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbPut(storeName, item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbDelete(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function migrateFromLocalStorageIfNeeded() {
    const migratedFlag = localStorage.getItem('finanzas_migrado_idx');
    if (migratedFlag) return;
    const cats = JSON.parse(localStorage.getItem('finanzas_categorias') || '[]');
    const trans = JSON.parse(localStorage.getItem('finanzas_transacciones') || '[]');
    const budgets = JSON.parse(localStorage.getItem('finanzas_presupuestos') || '[]');
    const categoriasParaGuardar = cats.length ? cats : [...CATEGORIAS_PREDEFINIDAS];
    await Promise.all(categoriasParaGuardar.map(c => dbPut(STORE_CATEGORIAS, c)));
    await Promise.all(trans.map(t => dbPut(STORE_TRANSACCIONES, t)));
    await Promise.all(budgets.map(b => dbPut(STORE_PRESUPUESTOS, b)));
    localStorage.setItem('finanzas_migrado_idx', '1');
  }

  return {
    STORE_CATEGORIAS,
    STORE_TRANSACCIONES,
    STORE_PRESUPUESTOS,
    openDB,
    dbGetAll,
    dbPut,
    dbDelete,
    migrateFromLocalStorageIfNeeded
  };
})();

const Utils = (function () {
  function parseDateLocal(fechaStr) {
    if (!fechaStr) return null;
    const parts = fechaStr.split('-').map(Number);
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  }

  function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    const fecha = parseDateLocal(fechaStr);
    if (!fecha || isNaN(fecha)) return fechaStr;
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function mostrarAlerta(mensaje, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alerta ${tipo}`;
    alerta.textContent = mensaje;
    alerta.style.position = 'fixed';
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.padding = '15px';
    alerta.style.borderRadius = '5px';
    alerta.style.color = 'white';
    alerta.style.zIndex = '1000';
    if (tipo === 'success') alerta.style.backgroundColor = '#27ae60';
    else if (tipo === 'error') alerta.style.backgroundColor = '#e74c3c';
    else alerta.style.backgroundColor = '#3498db';
    document.body.appendChild(alerta);
    setTimeout(() => { alerta.remove(); }, 3000);
  }

  function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
    const tituloElem = document.getElementById('modal-titulo');
    const mensajeElem = document.getElementById('modal-mensaje');
    if (tituloElem) tituloElem.textContent = titulo;
    if (mensajeElem) mensajeElem.textContent = mensaje;
    const modal = document.getElementById('modal-confirmacion');
    if (!modal) return;
    modal.style.display = 'flex';
    const btnConfirmar = document.getElementById('btn-modal-confirmar');
    const btnCancelar = document.getElementById('btn-modal-cancelar');
    const nuevoBtnConfirmar = btnConfirmar ? btnConfirmar.cloneNode(true) : null;
    const nuevoBtnCancelar = btnCancelar ? btnCancelar.cloneNode(true) : null;
    if (btnConfirmar && nuevoBtnConfirmar) btnConfirmar.parentNode.replaceChild(nuevoBtnConfirmar, btnConfirmar);
    if (btnCancelar && nuevoBtnCancelar) btnCancelar.parentNode.replaceChild(nuevoBtnCancelar, btnCancelar);
    if (nuevoBtnConfirmar) {
      nuevoBtnConfirmar.addEventListener('click', () => {
        onConfirm();
        modal.style.display = 'none';
      });
    }
    if (nuevoBtnCancelar) {
      nuevoBtnCancelar.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
  }

  function cerrarModal() {
    const modal = document.getElementById('modal-confirmacion');
    if (modal) modal.style.display = 'none';
  }

  return {
    parseDateLocal,
    formatearFecha,
    mostrarAlerta,
    mostrarModalConfirmacion,
    cerrarModal
  };
})();

const Categories = (function () {
  async function init() {
  }

  function renderizar() {
    const contenedor = document.getElementById('lista-categorias');
    if (!contenedor) return;
    const numTransacciones = App.state.transacciones.filter(t => t.categoriaId === categoria.id).length;
    contenedor.innerHTML = '';
    App.state.categorias.forEach(categoria => {
      const categoriaElement = document.createElement('div');
      categoriaElement.className = 'categoria-card';
      categoriaElement.style.borderLeftColor = categoria.color;
      categoriaElement.innerHTML = `
        <div class="categoria-info">
          <span class="categoria-color" style="background-color: ${categoria.color}"></span>
          <div>
            <h4>${categoria.nombre}</h4>
            <small>${categoria.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</small>
          </div>
        </div>
        <div class="categoria-acciones">
          <button class="btn-editar" data-id="${categoria.id}">✏️</button>
          <button class="btn-eliminar" data-id="${categoria.id}">🗑️</button>
        </div>
      `;
      contenedor.appendChild(categoriaElement);
      categoriaElement.style.border = `3px solid ${categoria.color}`;
      categoriaElement.style.borderRadius = '8px';  // Bordes redondeados
      categoriaElement.style.backgroundColor = `${categoria.color}15`; 
    });
    const contador = document.getElementById('total-categorias');
  if (contador) {
    contador.textContent = `${App.state.categorias.length} CATEGORÍAS`;
  }
    document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', editar));
    document.querySelectorAll('.btn-eliminar').forEach(btn => btn.addEventListener('click', solicitarEliminar));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const idElem = document.getElementById('category-id');
    const id = idElem ? idElem.value : '';
    const nombre = document.getElementById('nombre-categoria')?.value.trim() || '';
    const tipoElem = document.getElementById('tipo-categoria');
    const colorElem = document.getElementById('color-categoria');
    const tipo = tipoElem ? tipoElem.value : 'egreso';
    const color = colorElem ? colorElem.value : '#3498db';
    if (!nombre) {
      Utils.mostrarAlerta('El nombre de la categoría es obligatorio', 'error');
      return;
    }
    if (App.mode.modoEdicion && App.mode.elementoEditando) {
      const index = App.state.categorias.findIndex(c => c.id === App.mode.elementoEditando);
      if (index !== -1) {
        App.state.categorias[index] = { ...App.state.categorias[index], nombre, tipo, color };
      }
    } else {
      const nuevaCategoria = { id: 'cat_' + Date.now(), nombre, tipo, color };
      App.state.categorias.push(nuevaCategoria);
    }
    await Storage.dbPut(Storage.STORE_CATEGORIAS, App.state.categorias.find(c => c.id === (App.mode.elementoEditando || undefined)) || App.state.categorias[App.state.categorias.length - 1]);
    await Promise.all(App.state.categorias.map(c => Storage.dbPut(Storage.STORE_CATEGORIAS, c)));
    renderizar();
    updateSelectors();
    limpiarFormulario();
    Utils.mostrarAlerta(App.mode.modoEdicion ? 'Categoría actualizada' : 'Categoría creada', 'success');
  }

  function editar(e) {
    const btn = e.currentTarget;
    const categoriaId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    const categoria = App.state.categorias.find(c => c.id === categoriaId);
    if (!categoria) return;
    App.mode.modoEdicion = true;
    App.mode.elementoEditando = categoriaId;
    const tituloElem = document.getElementById('form-categoria-titulo');
    if (tituloElem) tituloElem.textContent = 'Editar Categoría';
    const idElem = document.getElementById('category-id');
    if (idElem) idElem.value = categoria.id;
    const nombreElem = document.getElementById('nombre-categoria');
    if (nombreElem) nombreElem.value = categoria.nombre;
    const tipoElem = document.getElementById('tipo-categoria');
    if (tipoElem) tipoElem.value = categoria.tipo;
    const colorElem = document.getElementById('color-categoria');
    if (colorElem) colorElem.value = categoria.color;
    const navBtn = document.querySelector('[data-section="categorias"]');
    if (navBtn) navBtn.click();
    updateSelectors(); 
  }

  function solicitarEliminar(e) {
    const btn = e.currentTarget;
    const categoriaId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    const categoria = App.state.categorias.find(c => c.id === categoriaId);
    if (!categoria) return;
    const tieneTransacciones = App.state.transacciones.some(t => t.categoriaId === categoriaId);
    if (tieneTransacciones) {
      Utils.mostrarModalConfirmacion(
        'Eliminar Categoría',
        'Esta categoría tiene transacciones asociadas. ¿Desea eliminarla junto con todas sus transacciones?',
        () => confirmarEliminar(categoriaId, true)
      );
    } else {
      Utils.mostrarModalConfirmacion(
        'Eliminar Categoría',
        '¿Está seguro de que desea eliminar esta categoría?',
        () => confirmarEliminar(categoriaId, false)
      );
    }
  }

  async function confirmarEliminar(categoriaId, eliminarTransacciones) {
    if (eliminarTransacciones) {
      const aEliminar = App.state.transacciones.filter(t => t.categoriaId === categoriaId).map(t => t.id);
      App.state.transacciones = App.state.transacciones.filter(t => t.categoriaId !== categoriaId);
      await Promise.all(aEliminar.map(id => Storage.dbDelete(Storage.STORE_TRANSACCIONES, id)));
    }
    App.state.categorias = App.state.categorias.filter(c => c.id !== categoriaId);
    await Storage.dbDelete(Storage.STORE_CATEGORIAS, categoriaId);
    await Promise.all(App.state.categorias.map(c => Storage.dbPut(Storage.STORE_CATEGORIAS, c)));
    renderizar();
    updateSelectors();
    Transactions.renderizar();
    Dashboard.actualizar();
    Utils.mostrarAlerta('Categoría eliminada', 'success');
    Utils.cerrarModal();
  }

  function cancelarEdicion() {
    limpiarFormulario();
  }

  function limpiarFormulario() {
    App.mode.modoEdicion = false;
    App.mode.elementoEditando = null;
    const tituloElem = document.getElementById('form-categoria-titulo');
    if (tituloElem) tituloElem.textContent = 'Gestión de Categorías';
    const form = document.getElementById('form-categoria');
    if (form) form.reset();
    const idElem = document.getElementById('category-id');
    if (idElem) idElem.value = '';
    const colorElem = document.getElementById('color-categoria');
    if (colorElem) colorElem.value = '#3498db';
  }

  function updateSelectors() {
    const selectorTransaccion = document.getElementById('categoria-transaccion');
    const selectorFiltro = document.getElementById('filtro-categoria');
    if (selectorTransaccion) {
      while (selectorTransaccion.options.length > 0) selectorTransaccion.remove(0);
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = 'Seleccione una categoría';
      selectorTransaccion.appendChild(emptyOpt);
    }
    if (selectorFiltro) {
      while (selectorFiltro.options.length > 1) selectorFiltro.remove(1);
    }
    App.state.categorias.forEach(categoria => {
      const option = document.createElement('option');
      option.value = categoria.id;
      option.textContent = categoria.nombre;
      if (selectorTransaccion) selectorTransaccion.appendChild(option.cloneNode(true));
      if (selectorFiltro) selectorFiltro.appendChild(option.cloneNode(true));
    });

    const selPresupuesto = document.getElementById('presupuesto-categoria');
    if (selPresupuesto) {
      selPresupuesto.innerHTML = '';
      App.state.categorias.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        selPresupuesto.appendChild(opt);
      });
    }
  }

  return {
    init,
    renderizar,
    handleSubmit,
    editar,
    solicitarEliminar,
    confirmarEliminar,
    cancelarEdicion,
    limpiarFormulario,
    updateSelectors
  };
})();

const Transactions = (function () {
  async function init() {
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const idElem = document.getElementById('transaction-id');
    const id = idElem ? idElem.value : '';
    const tipoRadio = document.querySelector('input[name="tipo-transaccion"]:checked');
    const tipo = tipoRadio ? tipoRadio.value : null;
    const monto = parseFloat(document.getElementById('monto')?.value || 0);
    const fecha = document.getElementById('fecha')?.value;
    const categoriaId = document.getElementById('categoria-transaccion')?.value;
    const descripcion = document.getElementById('descripcion')?.value.trim();
    if (!tipo) return Utils.mostrarAlerta('Debe seleccionar el tipo de transacción', 'error');
    if (!monto || monto <= 0) return Utils.mostrarAlerta('El monto debe ser mayor a cero', 'error');
    if (!categoriaId) return Utils.mostrarAlerta('Debe seleccionar una categoría', 'error');

    const transaccionData = {
      id: id || 'trans_' + Date.now(),
      tipo, monto, fecha, categoriaId, descripcion,
      fechaRegistro: new Date().toISOString()
    };
    if (App.mode.modoEdicion && App.mode.elementoEditando) {
      const index = App.state.transacciones.findIndex(t => t.id === App.mode.elementoEditando);
      if (index !== -1) {
        App.state.transacciones[index] = { ...App.state.transacciones[index], ...transaccionData };
      }
    } else {
      App.state.transacciones.push(transaccionData);
    }
    App.state.transacciones.sort((a, b) => {
      const da = Utils.parseDateLocal(a.fecha)?.getTime() || 0;
      const db = Utils.parseDateLocal(b.fecha)?.getTime() || 0;
      return db - da;
    });
    await Promise.all(App.state.transacciones.map(t => Storage.dbPut(Storage.STORE_TRANSACCIONES, t)));
    renderizar();
    Dashboard.actualizar();
    limpiarFormulario();
    Utils.mostrarAlerta(App.mode.modoEdicion ? 'Transacción actualizada' : 'Transacción registrada', 'success');
  }

  function renderizar(filtradas = null) {
    const tbody = document.getElementById('cuerpo-tabla-transacciones');
    const datos = filtradas || App.state.transacciones;
    if (!tbody) return;
    tbody.innerHTML = '';
    if (datos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-message">No hay transacciones registradas</td>
        </tr>
      `;
      actualizarResumen([]);
      return;
    }
    datos.forEach(transaccion => {
      const categoria = App.state.categorias.find(c => c.id === transaccion.categoriaId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${Utils.formatearFecha(transaccion.fecha)}</td>
        <td>${transaccion.descripcion || '-'}</td>
        <td><span class="badge-categoria" style="background-color: ${categoria?.color || '#ccc'}">${categoria?.nombre || 'Sin categoría'}</span></td>
        <td><span class="tipo-badge ${transaccion.tipo}">${transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</span></td>
        <td class="${transaccion.tipo === 'ingreso' ? 'positive' : 'negative'}">${transaccion.tipo === 'ingreso' ? '+' : '-'}$${transaccion.monto.toFixed(2)}</td>
        <td>
          <button class="btn-accion btn-editar-trans" data-id="${transaccion.id}">✏️</button>
          <button class="btn-accion btn-eliminar-trans" data-id="${transaccion.id}">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    document.querySelectorAll('.btn-editar-trans').forEach(btn => btn.addEventListener('click', editar));
    document.querySelectorAll('.btn-eliminar-trans').forEach(btn => btn.addEventListener('click', solicitarEliminar));
    actualizarResumen(datos);
  }

  function filtrar() {
    const tipo = document.getElementById('filtro-tipo')?.value;
    const categoria = document.getElementById('filtro-categoria')?.value;
    const busqueda = document.getElementById('busqueda')?.value.toLowerCase();
    const mes = document.getElementById('filtro-mes')?.value;
    let filtradas = App.state.transacciones;
    if (tipo) filtradas = filtradas.filter(t => t.tipo === tipo);
    if (categoria) filtradas = filtradas.filter(t => t.categoriaId === categoria);
    if (busqueda) {
      filtradas = filtradas.filter(t =>
        (t.descripcion && t.descripcion.toLowerCase().includes(busqueda)) ||
        App.state.categorias.find(c => c.id === t.categoriaId)?.nombre.toLowerCase().includes(busqueda)
      );
    }
    if (mes) filtradas = filtradas.filter(t => t.fecha && t.fecha.startsWith(mes));
    renderizar(filtradas);
  }

  function limpiarFiltros() {
    const filtroTipo = document.getElementById('filtro-tipo');
    if (filtroTipo) filtroTipo.value = '';
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (filtroCategoria) filtroCategoria.value = '';
    const busqueda = document.getElementById('busqueda');
    if (busqueda) busqueda.value = '';
    const filtroMes = document.getElementById('filtro-mes');
    if (filtroMes) filtroMes.value = new Date().toISOString().slice(0, 7);
    renderizar();
  }

  function editar(e) {
    const btn = e.currentTarget;
    const transaccionId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    const transaccion = App.state.transacciones.find(t => t.id === transaccionId);
    if (!transaccion) return;
    App.mode.modoEdicion = true;
    App.mode.elementoEditando = transaccionId;
    const tituloElem = document.getElementById('form-transaccion-titulo');
    if (tituloElem) tituloElem.textContent = 'Editar Transacción';
    const idElem = document.getElementById('transaction-id');
    if (idElem) idElem.value = transaccion.id;
    const tipoRadio = document.querySelector(`input[name="tipo-transaccion"][value="${transaccion.tipo}"]`);
    if (tipoRadio) tipoRadio.checked = true;
    const montoElem = document.getElementById('monto');
    if (montoElem) montoElem.value = transaccion.monto;
    const fechaElem = document.getElementById('fecha');
    if (fechaElem) fechaElem.value = transaccion.fecha;
    const categoriaElem = document.getElementById('categoria-transaccion');
    if (categoriaElem) categoriaElem.value = transaccion.categoriaId;
    const descripcionElem = document.getElementById('descripcion');
    if (descripcionElem) descripcionElem.value = transaccion.descripcion || '';
    const navBtn = document.querySelector('[data-section="transacciones"]');
    if (navBtn) navBtn.click();
  }

  function solicitarEliminar(e) {
    const btn = e.currentTarget;
    const transaccionId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    Utils.mostrarModalConfirmacion(
      'Eliminar Transacción',
      '¿Está seguro de que desea eliminar esta transacción?',
      () => confirmarEliminar(transaccionId)
    );
  }

  async function confirmarEliminar(transaccionId) {
    App.state.transacciones = App.state.transacciones.filter(t => t.id !== transaccionId);
    await Storage.dbDelete(Storage.STORE_TRANSACCIONES, transaccionId);
    await Promise.all(App.state.transacciones.map(t => Storage.dbPut(Storage.STORE_TRANSACCIONES, t)));
    renderizar();
    Dashboard.actualizar();
    Utils.mostrarAlerta('Transacción eliminada', 'success');
    Utils.cerrarModal();
  }

  function limpiarFormulario() {
    App.mode.modoEdicion = false;
    App.mode.elementoEditando = null;
    const tituloElem = document.getElementById('form-transaccion-titulo');
    if (tituloElem) tituloElem.textContent = 'Gestión de Transacciones';
    const form = document.getElementById('form-transaccion');
    if (form) form.reset();
    const idElem = document.getElementById('transaction-id');
    if (idElem) idElem.value = '';
    const fechaElem = document.getElementById('fecha');
    if (fechaElem) fechaElem.value = new Date().toISOString().split('T')[0];
  }

  function actualizarResumen(datos) {
    const ingresos = datos.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + t.monto, 0);
    const egresos = datos.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + t.monto, 0);
    const balance = ingresos - egresos;
    const totalIngresosElem = document.getElementById('total-ingresos');
    const totalEgresosElem = document.getElementById('total-egresos');
    const balanceElem = document.getElementById('balance-transacciones');
    if (totalIngresosElem) totalIngresosElem.textContent = `$${ingresos.toFixed(2)}`;
    if (totalEgresosElem) totalEgresosElem.textContent = `$${egresos.toFixed(2)}`;
    if (balanceElem) balanceElem.textContent = `$${balance.toFixed(2)}`;
  }

  return {
    init,
    handleSubmit,
    renderizar,
    filtrar,
    limpiarFiltros,
    editar,
    solicitarEliminar,
    confirmarEliminar,
    limpiarFormulario
  };
})();

const Budgets = (function () {
  async function init() {
  }

  function gastoRealDeCategoriaMes(categoriaId, mesYYYYMM) {
    return App.state.transacciones
      .filter(t => t.tipo === 'egreso' && t.categoriaId === categoriaId && t.fecha?.startsWith(mesYYYYMM))
      .reduce((sum, t) => sum + t.monto, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const idInput = document.getElementById('budget-id');
    const mes = document.getElementById('presupuesto-mes').value; // YYYY-MM
    const categoriaId = document.getElementById('presupuesto-categoria').value;
    const montoEstimado = parseFloat(document.getElementById('presupuesto-monto').value);

    if (!mes || !categoriaId || !montoEstimado || montoEstimado <= 0) {
      Utils.mostrarAlerta('Complete todos los campos con valores válidos', 'error');
      return;
    }

    const id = idInput.value || ('budget_' + Date.now());
    const existenteIdx = App.state.presupuestos.findIndex(p => p.id === id);
    const data = { id, mes, categoriaId, montoEstimado };

    if (existenteIdx !== -1) {
      App.state.presupuestos[existenteIdx] = data;
      Utils.mostrarAlerta('Presupuesto actualizado', 'success');
    } else {
      const duplicado = App.state.presupuestos.find(p => p.mes === mes && p.categoriaId === categoriaId);
      if (duplicado) {
        Utils.mostrarAlerta('Ya existe un presupuesto para esa categoría en ese mes', 'error');
        return;
      }
      App.state.presupuestos.push(data);
      Utils.mostrarAlerta('Presupuesto creado', 'success');
    }
    await Promise.all(App.state.presupuestos.map(p => Storage.dbPut(Storage.STORE_PRESUPUESTOS, p)));
    renderizar();
    limpiarFormulario();
    Dashboard.actualizar();
  }

  function limpiarFormulario() {
    const form = document.getElementById('form-presupuesto');
    if (form) form.reset();
    const id = document.getElementById('budget-id');
    if (id) id.value = '';
  }

  function editar(id) {
    const p = App.state.presupuestos.find(x => x.id === id);
    if (!p) return;
    document.getElementById('budget-id').value = p.id;
    document.getElementById('presupuesto-mes').value = p.mes;
    document.getElementById('presupuesto-categoria').value = p.categoriaId;
    document.getElementById('presupuesto-monto').value = p.montoEstimado;
  }

  async function eliminar(id) {
    App.state.presupuestos = App.state.presupuestos.filter(p => p.id !== id);
    await Storage.dbDelete(Storage.STORE_PRESUPUESTOS, id);
    await Promise.all(App.state.presupuestos.map(p => Storage.dbPut(Storage.STORE_PRESUPUESTOS, p)));
    renderizar();
    Dashboard.actualizar();
    Utils.mostrarAlerta('Presupuesto eliminado', 'success');
  }

  function renderizar() {
    const tbody = document.getElementById('cuerpo-tabla-presupuestos');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!App.state.presupuestos.length) {
      tbody.innerHTML = '<tr><td colspan="7">No hay presupuestos</td></tr>';
      return;
    }
    App.state.presupuestos.forEach(p => {
      const gastoReal = gastoRealDeCategoriaMes(p.categoriaId, p.mes);
      const desviacion = gastoReal - p.montoEstimado;
      const porcentaje = p.montoEstimado > 0 ? (gastoReal / p.montoEstimado) * 100 : 0;
      const estado = porcentaje >= 100 ? 'Superado' : (porcentaje >= 80 ? 'En riesgo' : 'Dentro');

      const cat = App.state.categorias.find(c => c.id === p.categoriaId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${cat?.nombre || 'Categoría'}</td>
        <td>$${p.montoEstimado.toFixed(2)}</td>
        <td>$${gastoReal.toFixed(2)}</td>
        <td>${desviacion >= 0 ? '+' : '-'}$${(Math.abs(desviacion)).toFixed(2)}</td>
        <td>${porcentaje.toFixed(0)}%</td>
        <td>${estado}</td>
        <td>
          <button type="button" onclick="Budgets.editar('${p.id}')">✏️</button>
          <button type="button" onclick="Budgets.eliminar('${p.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);

      if (estado === 'Superado') {
        tr.style.backgroundColor = '#ffe6e6';
      } else if (estado === 'En riesgo') {
        tr.style.backgroundColor = '#fff7e6';
      }
    });

    const cont = document.getElementById('proyeccion-egresos');
    if (cont) {
      const mesSel = document.getElementById('presupuesto-mes')?.value || new Date().toISOString().slice(0, 7);
      const egresosMes = App.state.transacciones
        .filter(t => t.tipo === 'egreso' && t.fecha?.startsWith(mesSel))
        .reduce((sum, t) => sum + t.monto, 0);
      cont.textContent = `Egresos reales del mes ${mesSel}: $${egresosMes.toFixed(2)}`;
    }
  }

  return {
    init,
    handleSubmit,
    renderizar,
    editar,
    eliminar,
    limpiarFormulario,
    gastoRealDeCategoriaMes
  };
})();

const Dashboard = (function () {
  function getMesSeleccionado() {
    return document.getElementById('dashboard-filtro-mes')?.value || new Date().toISOString().slice(0, 7);
  }

  function actualizar() {
    const mesActual = getMesSeleccionado();
    const ingresosMes = App.state.transacciones
      .filter(t => t.tipo === 'ingreso' && t.fecha && t.fecha.startsWith(mesActual))
      .reduce((sum, t) => sum + t.monto, 0);
    const egresosMes = App.state.transacciones
      .filter(t => t.tipo === 'egreso' && t.fecha && t.fecha.startsWith(mesActual))
      .reduce((sum, t) => sum + t.monto, 0);
    const balanceTotal = App.state.transacciones
      .filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0) -
      App.state.transacciones.filter(t => t.tipo === 'egreso').reduce((s, t) => s + t.monto, 0);

    const balanceElem = document.getElementById('dashboard-balance');
    const ingresosElem = document.getElementById('dashboard-ingresos');
    const egresosElem = document.getElementById('dashboard-gastos');
    if (balanceElem) balanceElem.textContent = `$${balanceTotal.toFixed(2)}`;
    if (ingresosElem) ingresosElem.textContent = `$${ingresosMes.toFixed(2)}`;
    if (egresosElem) egresosElem.textContent = `$${egresosMes.toFixed(2)}`;

    actualizarGraficos();
    renderizarRecientes();
  }

  function renderizarRecientes() {
    const recentTbody = document.getElementById('dashboard-transacciones-recientes');
    if (!recentTbody) return;
    recentTbody.innerHTML = '';
    const recientes = App.state.transacciones.slice(0, 5);
    if (!recientes.length) {
      recentTbody.innerHTML = `<tr><td colspan="5">No hay transacciones recientes</td></tr>`;
      return;
    }
    recientes.forEach(t => {
      const cat = App.state.categorias.find(c => c.id === t.categoriaId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${Utils.formatearFecha(t.fecha)}</td>
        <td>${t.descripcion || '-'}</td>
        <td>${cat?.nombre || 'Sin categoría'}</td>
        <td>${t.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</td>
        <td>$${t.monto.toFixed(2)}</td>
      `;
      recentTbody.appendChild(tr);
    });
  }

  function obtenerMesesUltimos12() {
    const meses = [];
    const base = new Date();
    base.setDate(1);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      meses.push(iso);
    }
    return meses;
  }

  function actualizarGraficos() {
    const canvasGastos = document.getElementById('expensesByCategoryChart');
    const canvasEvolucion = document.getElementById('annualBalanceChart');
    const canvasBalanceVs = document.getElementById('balanceVsEstimatedChart');
    const canvasEgresosVs = document.getElementById('expensesVsEstimatedChart');
    const mesSel = getMesSeleccionado();
    if (!canvasGastos || !canvasEvolucion) return;

    const ctxGastos = canvasGastos.getContext('2d');
    const ctxEvolucion = canvasEvolucion.getContext('2d');
    const gastosPorCategoria = {};
    App.state.transacciones
      .filter(t => t.tipo === 'egreso' && t.fecha?.startsWith(mesSel))
      .forEach(t => {
        const categoria = App.state.categorias.find(c => c.id === t.categoriaId);
        if (categoria) {
          gastosPorCategoria[categoria.nombre] = (gastosPorCategoria[categoria.nombre] || 0) + t.monto;
        }
      });

    const evolucion = {};
    App.state.transacciones.forEach(t => {
      const mes = t.fecha ? t.fecha.slice(0, 7) : 'unknown';
      if (!evolucion[mes]) evolucion[mes] = { ingresos: 0, egresos: 0 };
      if (t.tipo === 'ingreso') evolucion[mes].ingresos += t.monto;
      else evolucion[mes].egresos += t.monto;
    });

    if (window.chartGastos) window.chartGastos.destroy();
    if (window.chartEvolucion) window.chartEvolucion.destroy();
    window.chartGastos = new Chart(ctxGastos, {
      type: 'pie',
      data: {
        labels: Object.keys(gastosPorCategoria),
        datasets: [{
          data: Object.values(gastosPorCategoria),
          backgroundColor: Object.keys(gastosPorCategoria).map(nombre => {
            const cat = App.state.categorias.find(c => c.nombre === nombre);
            return cat ? cat.color : '#ccc';
          })
        }]
      },
      options: { responsive: true, plugins: { title: { display: true, text: `Gastos por categoría (${mesSel})` } } }
    });

    const meses = Object.keys(evolucion).sort();
    window.chartEvolucion = new Chart(ctxEvolucion, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [
          { label: 'Ingresos', data: meses.map(m => evolucion[m].ingresos), borderColor: '#27ae60', backgroundColor: 'rgba(39,174,96,0.1)', tension: 0.3 },
          { label: 'Egresos', data: meses.map(m => evolucion[m].egresos), borderColor: '#e74c3c', backgroundColor: 'rgba(231,76,60,0.1)', tension: 0.3 }
        ]
      },
      options: { responsive: true, plugins: { title: { display: true, text: 'Evolución mensual' } }, scales: { y: { beginAtZero: true } } }
    });

    if (canvasBalanceVs) {
      const ctxBalanceVs = canvasBalanceVs.getContext('2d');
      const mesesUltimos12 = obtenerMesesUltimos12();
      const balanceRealPorMes = mesesUltimos12.map(m => {
        const ingresos = App.state.transacciones.filter(t => t.tipo === 'ingreso' && t.fecha?.startsWith(m)).reduce((s, t) => s + t.monto, 0);
        const egresos = App.state.transacciones.filter(t => t.tipo === 'egreso' && t.fecha?.startsWith(m)).reduce((s, t) => s + t.monto, 0);
        return ingresos - egresos;
      });
      const balanceEstimadoPorMes = mesesUltimos12.map(m => {
        const estimadoEgresos = App.state.presupuestos.filter(p => p.mes === m).reduce((s, p) => s + p.montoEstimado, 0);
        return -estimadoEgresos;
      });

      if (window.chartBalanceVs) window.chartBalanceVs.destroy();
      window.chartBalanceVs = new Chart(ctxBalanceVs, {
        type: 'line',
        data: {
          labels: mesesUltimos12,
          datasets: [
            { label: 'Balance real', data: balanceRealPorMes, borderColor: '#34495e', backgroundColor: 'rgba(52,73,94,0.1)', tension: 0.3 },
            { label: 'Balance estimado', data: balanceEstimadoPorMes, borderColor: '#8e44ad', backgroundColor: 'rgba(142,68,173,0.1)', tension: 0.3 }
          ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Balance real vs estimado' } }, scales: { y: { beginAtZero: true } } }
      });
    }

    if (canvasEgresosVs) {
      const ctxEgresosVs = canvasEgresosVs.getContext('2d');
      const etiquetas = App.state.categorias.map(c => c.nombre);
      const estimados = App.state.categorias.map(c => App.state.presupuestos
        .filter(p => p.mes === mesSel && p.categoriaId === c.id)
        .reduce((s, p) => s + p.montoEstimado, 0)
      );
      const reales = App.state.categorias.map(c => App.state.transacciones
        .filter(t => t.tipo === 'egreso' && t.categoriaId === c.id && t.fecha?.startsWith(mesSel))
        .reduce((s, t) => s + t.monto, 0)
      );

      if (window.chartEgresosVs) window.chartEgresosVs.destroy();
      window.chartEgresosVs = new Chart(ctxEgresosVs, {
        type: 'bar',
        data: {
          labels: etiquetas,
          datasets: [
            { label: 'Estimado', data: estimados, backgroundColor: 'rgba(241, 196, 15, 0.6)' },
            { label: 'Real', data: reales, backgroundColor: 'rgba(231, 76, 60, 0.6)' }
          ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: `Egresos estimados vs reales (${mesSel})` } }, scales: { y: { beginAtZero: true } } }
      });
    }
  }

  return {
    actualizar,
    renderizarRecientes,
    actualizarGraficos
  };
})();

const AppController = (function () {
  async function inicializar() {
    await Storage.migrateFromLocalStorageIfNeeded();
    App.state.categorias = await Storage.dbGetAll(Storage.STORE_CATEGORIAS);
    if (!App.state.categorias.length) {
      App.state.categorias = [...CATEGORIAS_PREDEFINIDAS];
      await Promise.all(App.state.categorias.map(c => Storage.dbPut(Storage.STORE_CATEGORIAS, c)));
    }
    App.state.transacciones = await Storage.dbGetAll(Storage.STORE_TRANSACCIONES);
    App.state.presupuestos = await Storage.dbGetAll(Storage.STORE_PRESUPUESTOS);

    bindEvents();
    inicializarFechas();
    Categories.renderizar();
    Categories.updateSelectors();
    Budgets.renderizar();
    Transactions.renderizar();
    Dashboard.actualizar();
  }

  function bindEvents() {
    document.querySelectorAll('.sidebar a').forEach(btn => {
      btn.addEventListener('click', cambiarSeccion);
    });

    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) formCategoria.addEventListener('submit', Categories.handleSubmit);
    const btnCancelarCategoria = document.getElementById('btn-cancelar-categoria');
    if (btnCancelarCategoria) btnCancelarCategoria.addEventListener('click', Categories.cancelarEdicion);

    const formTransaccion = document.getElementById('form-transaccion');
    if (formTransaccion) formTransaccion.addEventListener('submit', Transactions.handleSubmit);
    const btnCancelarTrans = document.getElementById('btn-cancelar-transaccion');
    if (btnCancelarTrans) btnCancelarTrans.addEventListener('click', Transactions.limpiarFormulario);

    const filtroTipo = document.getElementById('filtro-tipo');
    if (filtroTipo) filtroTipo.addEventListener('change', Transactions.filtrar);
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (filtroCategoria) filtroCategoria.addEventListener('change', Transactions.filtrar);
    const busqueda = document.getElementById('busqueda');
    if (busqueda) busqueda.addEventListener('input', Transactions.filtrar);
    const filtroMes = document.getElementById('filtro-mes');
    if (filtroMes) filtroMes.addEventListener('change', Transactions.filtrar);
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', Transactions.limpiarFiltros);
    const btnModalCancelar = document.getElementById('btn-modal-cancelar');
    if (btnModalCancelar) btnModalCancelar.addEventListener('click', Utils.cerrarModal);

    const dashMes = document.getElementById('dashboard-filtro-mes');
    if (dashMes) dashMes.addEventListener('change', Dashboard.actualizar);

    const formPres = document.getElementById('form-presupuesto');
    if (formPres) formPres.addEventListener('submit', Budgets.handleSubmit);
    const cancelarPres = document.getElementById('btn-cancelar-presupuesto');
    if (cancelarPres) cancelarPres.addEventListener('click', Budgets.limpiarFormulario);
  }

  function cambiarSeccion(e) {
    e.preventDefault();
    const seccionId = e.currentTarget.dataset.section;
    document.querySelectorAll('.sidebar a').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(seccionId);
    if (targetSection) targetSection.classList.add('active');
    if (seccionId === 'dashboard') Dashboard.actualizar();
    else if (seccionId === 'transacciones') Transactions.renderizar();
    else if (seccionId === 'presupuestos') Budgets.renderizar();
  }

  function inicializarFechas() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.value = hoy;
    const filtroMes = document.getElementById('filtro-mes');
    if (filtroMes) filtroMes.value = hoy.slice(0, 7);
  }

  return {
    inicializar
  };
})();

window.Budgets = Budgets;
window.Utils = Utils;
window.Transactions = Transactions;
window.Categories = Categories;
window.Dashboard = Dashboard;


document.addEventListener('DOMContentLoaded', () => {
  AppController.inicializar().catch(err => {
    console.error('Error inicializando la app:', err);
  });
});