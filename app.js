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

let categorias = [];
let transacciones = [];
let modoEdicion = false;
let elementoEditando = null;

function inicializarAplicacion() {
    cargarDatos();
    inicializarEventos();
    inicializarFechas();
    renderizarCategorias();
    renderizarTransacciones();
    actualizarDashboard();
    actualizarSelectoresCategorias();
}

function cargarDatos() {
    const categoriasGuardadas = localStorage.getItem('finanzas_categorias');
    if (categoriasGuardadas) {
        try {
            categorias = JSON.parse(categoriasGuardadas);
        } catch (e) {
            categorias = [...CATEGORIAS_PREDEFINIDAS];
            guardarCategorias();
        }
    } else {
        categorias = [...CATEGORIAS_PREDEFINIDAS];
        guardarCategorias();
    }
    
    const transaccionesGuardadas = localStorage.getItem('finanzas_transacciones');
    if (transaccionesGuardadas) {
        try {
            transacciones = JSON.parse(transaccionesGuardadas);
        } catch (e) {
            transacciones = [];
            guardarTransacciones();
        }
    }
}

function guardarCategorias() {
    localStorage.setItem('finanzas_categorias', JSON.stringify(categorias));
}

function guardarTransacciones() {
    localStorage.setItem('finanzas_transacciones', JSON.stringify(transacciones));
}

function inicializarEventos() {
    document.querySelectorAll('.sidebar a').forEach(btn => {
    btn.addEventListener('click', cambiarSeccion);
});
    const formCategoria = document.getElementById('form-categoria');
    if (formCategoria) formCategoria.addEventListener('submit', manejarSubmitCategoria);
    const btnCancelarCategoria = document.getElementById('btn-cancelar-categoria');
    if (btnCancelarCategoria) btnCancelarCategoria.addEventListener('click', cancelarEdicionCategoria);
    const formTransaccion = document.getElementById('form-transaccion');
    if (formTransaccion) formTransaccion.addEventListener('submit', manejarSubmitTransaccion);
    const btnCancelarTrans = document.getElementById('btn-cancelar-transaccion');
    if (btnCancelarTrans) btnCancelarTrans.addEventListener('click', cancelarEdicionTransaccion);
    const filtroTipo = document.getElementById('filtro-tipo');
    if (filtroTipo) filtroTipo.addEventListener('change', filtrarTransacciones);
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarTransacciones);
    const busqueda = document.getElementById('busqueda');
    if (busqueda) busqueda.addEventListener('input', filtrarTransacciones);
    const filtroMes = document.getElementById('filtro-mes');
    if (filtroMes) filtroMes.addEventListener('change', filtrarTransacciones);
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);
    const btnModalCancelar = document.getElementById('btn-modal-cancelar');
    if (btnModalCancelar) btnModalCancelar.addEventListener('click', cerrarModal);
}

function inicializarFechas() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.value = hoy;
    const filtroMes = document.getElementById('filtro-mes');
    if (filtroMes) filtroMes.value = hoy.slice(0, 7);
}

function cambiarSeccion(e) {
    e.preventDefault();
    const seccionId = e.currentTarget.dataset.section;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    const targetSection = document.getElementById(seccionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${seccionId}`);
    }
    if (seccionId === 'dashboard') {
        actualizarDashboard();
    } else if (seccionId === 'transacciones') {
        renderizarTransacciones();
    }
}

function renderizarCategorias() {
    const contenedor = document.getElementById('lista-categorias');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    categorias.forEach(categoria => {
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
    });
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', editarCategoria);
    });
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', solicitarEliminarCategoria);
    });
}

function manejarSubmitCategoria(e) {
    e.preventDefault();
    const idElem = document.getElementById('category-id');
    const id = idElem ? idElem.value : '';
    const nombre = document.getElementById('nombre-categoria')?.value.trim() || '';
    const tipoElem = document.getElementById('tipo-categoria');
    const colorElem = document.getElementById('color-categoria');
    const tipo = tipoElem ? tipoElem.value : 'egreso';
    const color = colorElem ? colorElem.value : '#3498db';
    if (!nombre) {
        mostrarAlerta('El nombre de la categoría es obligatorio', 'error');
        return;
    }
    
    if (modoEdicion && elementoEditando) {
        const index = categorias.findIndex(c => c.id === elementoEditando);
        if (index !== -1) {
            categorias[index] = { ...categorias[index], nombre, tipo, color };
        }
    } else {
        const nuevaCategoria = {
            id: 'cat_' + Date.now(),
            nombre,
            tipo,
            color
        };
        categorias.push(nuevaCategoria);
    }
    guardarCategorias();
    renderizarCategorias();
    actualizarSelectoresCategorias();
    limpiarFormularioCategoria();
    mostrarAlerta(
        modoEdicion ? 'Categoría actualizada' : 'Categoría creada',
        'success'
    );
}

function editarCategoria(e) {
    const btn = e.currentTarget;
    const categoriaId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    const categoria = categorias.find(c => c.id === categoriaId);
    if (!categoria) return;
    modoEdicion = true;
    elementoEditando = categoriaId;
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
}

function solicitarEliminarCategoria(e) {
    const btn = e.currentTarget;
    const categoriaId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    const categoria = categorias.find(c => c.id === categoriaId);
    
    if (!categoria) return;
    const tieneTransacciones = transacciones.some(t => t.categoriaId === categoriaId);
    
    if (tieneTransacciones) {
        mostrarModalConfirmacion(
            'Eliminar Categoría',
            'Esta categoría tiene transacciones asociadas. ¿Desea eliminarla junto con todas sus transacciones?',
            () => confirmarEliminarCategoria(categoriaId, true)
        );
    } else {
        mostrarModalConfirmacion(
            'Eliminar Categoría',
            '¿Está seguro de que desea eliminar esta categoría?',
            () => confirmarEliminarCategoria(categoriaId, false)
        );
    }
}

function confirmarEliminarCategoria(categoriaId, eliminarTransacciones) {
    if (eliminarTransacciones) {
        transacciones = transacciones.filter(t => t.categoriaId !== categoriaId);
        guardarTransacciones();
    }
    categorias = categorias.filter(c => c.id !== categoriaId);
    guardarCategorias();
    renderizarCategorias();
    actualizarSelectoresCategorias();
    renderizarTransacciones();
    actualizarDashboard();
    mostrarAlerta('Categoría eliminada', 'success');
    cerrarModal();
}

function cancelarEdicionCategoria() {
    limpiarFormularioCategoria();
}

function limpiarFormularioCategoria() {
    modoEdicion = false;
    elementoEditando = null;
    const tituloElem = document.getElementById('form-categoria-titulo');
    if (tituloElem) tituloElem.textContent = 'Nueva Categoría';
    const form = document.getElementById('form-categoria');
    if (form) form.reset();
    const idElem = document.getElementById('category-id');
    if (idElem) idElem.value = '';
    const colorElem = document.getElementById('color-categoria');
    if (colorElem) colorElem.value = '#3498db';
}

function actualizarSelectoresCategorias() {
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
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        if (selectorTransaccion) selectorTransaccion.appendChild(option.cloneNode(true));
        if (selectorFiltro) selectorFiltro.appendChild(option.cloneNode(true));
    });
}

function manejarSubmitTransaccion(e) {
    e.preventDefault();
    const idElem = document.getElementById('transaction-id');
    const id = idElem ? idElem.value : '';
    const tipoRadio = document.querySelector('input[name="tipo-transaccion"]:checked');
    const tipo = tipoRadio ? tipoRadio.value : null;
    const monto = parseFloat(document.getElementById('monto')?.value || 0);
    const fecha = document.getElementById('fecha')?.value;
    const categoriaId = document.getElementById('categoria-transaccion')?.value;
    const descripcion = document.getElementById('descripcion')?.value.trim();
    if (!tipo) {
        mostrarAlerta('Debe seleccionar el tipo de transacción', 'error');
        return;
    }
    if (!monto || monto <= 0) {
        mostrarAlerta('El monto debe ser mayor a cero', 'error');
        return;
    }
    if (!categoriaId) {
        mostrarAlerta('Debe seleccionar una categoría', 'error');
        return;
    }
    const transaccionData = {
        id: id || 'trans_' + Date.now(),
        tipo,
        monto,
        fecha,
        categoriaId,
        descripcion,
        fechaRegistro: new Date().toISOString()
    };
    if (modoEdicion && elementoEditando) {
        const index = transacciones.findIndex(t => t.id === elementoEditando);
        if (index !== -1) {
            transacciones[index] = { ...transacciones[index], ...transaccionData };
        }
    } else {
        transacciones.push(transaccionData);
    }
    transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    guardarTransacciones();
    renderizarTransacciones();
    actualizarDashboard();
    limpiarFormularioTransaccion();
    mostrarAlerta(
        modoEdicion ? 'Transacción actualizada' : 'Transacción registrada',
        'success'
    );
}

function renderizarTransacciones(filtradas = null) {
    const tbody = document.getElementById('cuerpo-tabla-transacciones');
    const datos = filtradas || transacciones;
    if (!tbody) return;
    tbody.innerHTML = '';
    if (datos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">No hay transacciones registradas</td>
            </tr>
        `;
        actualizarResumenTransacciones([]);
        return;
    }
    
    datos.forEach(transaccion => {
        const categoria = categorias.find(c => c.id === transaccion.categoriaId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatearFecha(transaccion.fecha)}</td>
            <td>${transaccion.descripcion || '-'}</td>
            <td><span class="badge-categoria" style="background-color: ${categoria?.color || '#ccc'}">
                ${categoria?.nombre || 'Sin categoría'}
            </span></td>
            <td><span class="tipo-badge ${transaccion.tipo}">
                ${transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
            </span></td>
            <td class="${transaccion.tipo === 'ingreso' ? 'positive' : 'negative'}">
                ${transaccion.tipo === 'ingreso' ? '+' : '-'}$${transaccion.monto.toFixed(2)}
            </td>
            <td>
                <button class="btn-accion btn-editar-trans" data-id="${transaccion.id}">✏️</button>
                <button class="btn-accion btn-eliminar-trans" data-id="${transaccion.id}">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    document.querySelectorAll('.btn-editar-trans').forEach(btn => {
        btn.addEventListener('click', editarTransaccion);
    });
    document.querySelectorAll('.btn-eliminar-trans').forEach(btn => {
        btn.addEventListener('click', solicitarEliminarTransaccion);
    });
    actualizarResumenTransacciones(datos);
}

function filtrarTransacciones() {
    const tipo = document.getElementById('filtro-tipo')?.value;
    const categoria = document.getElementById('filtro-categoria')?.value;
    const busqueda = document.getElementById('busqueda')?.value.toLowerCase();
    const mes = document.getElementById('filtro-mes')?.value;
    let filtradas = transacciones;
    if (tipo) {
        filtradas = filtradas.filter(t => t.tipo === tipo);
    }
    if (categoria) {
        filtradas = filtradas.filter(t => t.categoriaId === categoria);
    }
    if (busqueda) {
        filtradas = filtradas.filter(t => 
            (t.descripcion && t.descripcion.toLowerCase().includes(busqueda)) ||
            categorias.find(c => c.id === t.categoriaId)?.nombre.toLowerCase().includes(busqueda)
        );
    }
    if (mes) {
        filtradas = filtradas.filter(t => t.fecha && t.fecha.startsWith(mes));
    }
    renderizarTransacciones(filtradas);
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
    renderizarTransacciones();
}

function editarTransaccion(e) {
    const btn = e.currentTarget;
    const transaccionId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    const transaccion = transacciones.find(t => t.id === transaccionId);
    if (!transaccion) return;
    modoEdicion = true;
    elementoEditando = transaccionId;
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

function solicitarEliminarTransaccion(e) {
    const btn = e.currentTarget;
    const transaccionId = btn?.dataset.id || e.target.closest('button')?.dataset.id;
    mostrarModalConfirmacion(
        'Eliminar Transacción',
        '¿Está seguro de que desea eliminar esta transacción?',
        () => confirmarEliminarTransaccion(transaccionId)
    );
}

function confirmarEliminarTransaccion(transaccionId) {
    transacciones = transacciones.filter(t => t.id !== transaccionId);
    guardarTransacciones();
    renderizarTransacciones();
    actualizarDashboard();
    mostrarAlerta('Transacción eliminada', 'success');
    cerrarModal();
}

function cancelarEdicionTransaccion() {
    limpiarFormularioTransaccion();
}

function limpiarFormularioTransaccion() {
    modoEdicion = false;
    elementoEditando = null;
    const tituloElem = document.getElementById('form-transaccion-titulo');
    if (tituloElem) tituloElem.textContent = 'Nueva Transacción';
    const form = document.getElementById('form-transaccion');
    if (form) form.reset();
    const idElem = document.getElementById('transaction-id');
    if (idElem) idElem.value = '';
    const fechaElem = document.getElementById('fecha');
    if (fechaElem) fechaElem.value = new Date().toISOString().split('T')[0];
}

function actualizarResumenTransacciones(datos) {
    const ingresos = datos
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + t.monto, 0);
    const egresos = datos
        .filter(t => t.tipo === 'egreso')
        .reduce((sum, t) => sum + t.monto, 0);
    const balance = ingresos - egresos;
    const totalIngresosElem = document.getElementById('total-ingresos');
    const totalEgresosElem = document.getElementById('total-egresos');
    const balanceElem = document.getElementById('balance-transacciones');
    if (totalIngresosElem) totalIngresosElem.textContent = `$${ingresos.toFixed(2)}`;
    if (totalEgresosElem) totalEgresosElem.textContent = `$${egresos.toFixed(2)}`;
    if (balanceElem) balanceElem.textContent = `$${balance.toFixed(2)}`;
}

function actualizarDashboard() {
    const mesActual = new Date().toISOString().slice(0, 7);
    const ingresosMes = transacciones
        .filter(t => t.tipo === 'ingreso' && t.fecha && t.fecha.startsWith(mesActual))
        .reduce((sum, t) => sum + t.monto, 0);
    const egresosMes = transacciones
        .filter(t => t.tipo === 'egreso' && t.fecha && t.fecha.startsWith(mesActual))
        .reduce((sum, t) => sum + t.monto, 0);
    const balanceTotal = transacciones
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + t.monto, 0) -
        transacciones
            .filter(t => t.tipo === 'egreso')
            .reduce((sum, t) => sum + t.monto, 0);
    const balanceElem = document.getElementById('dashboard-balance');
    const ingresosElem = document.getElementById('dashboard-ingresos');
    const egresosElem = document.getElementById('dashboard-gastos');
    if (balanceElem) balanceElem.textContent = `$${balanceTotal.toFixed(2)}`;
    if (ingresosElem) ingresosElem.textContent = `$${ingresosMes.toFixed(2)}`;
    if (egresosElem) egresosElem.textContent = `$${egresosMes.toFixed(2)}`;
    actualizarGraficos();
    const recentTbody = document.getElementById('dashboard-transacciones-recientes');
    if (recentTbody) {
        recentTbody.innerHTML = '';
        const recientes = transacciones.slice(0, 5);
        if (recientes.length === 0) {
            recentTbody.innerHTML = `<tr><td colspan="5">No hay transacciones recientes</td></tr>`;
        } else {
            recientes.forEach(t => {
                const cat = categorias.find(c => c.id === t.categoriaId);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatearFecha(t.fecha)}</td>
                    <td>${t.descripcion || '-'}</td>
                    <td>${cat?.nombre || 'Sin categoría'}</td>
                    <td>${t.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</td>
                    <td>$${t.monto.toFixed(2)}</td>
                `;
                recentTbody.appendChild(tr);
            });
        }
    }
}

function actualizarGraficos() {
    const canvasGastos = document.getElementById('expensesByCategoryChart');
    const canvasEvolucion = document.getElementById('annualBalanceChart');
    if (!canvasGastos || !canvasEvolucion) return;

    const ctxGastos = canvasGastos.getContext('2d');
    const ctxEvolucion = canvasEvolucion.getContext('2d');

    const gastosPorCategoria = {};
    transacciones
        .filter(t => t.tipo === 'egreso')
        .forEach(t => {
            const categoria = categorias.find(c => c.id === t.categoriaId);
            if (categoria) {
                gastosPorCategoria[categoria.nombre] = (gastosPorCategoria[categoria.nombre] || 0) + t.monto;
            }
        });
    const evolucion = {};
    transacciones.forEach(t => {
        const mes = t.fecha ? t.fecha.slice(0, 7) : 'unknown';
        if (!evolucion[mes]) {
            evolucion[mes] = { ingresos: 0, egresos: 0 };
        }
        if (t.tipo === 'ingreso') {
            evolucion[mes].ingresos += t.monto;
        } else {
            evolucion[mes].egresos += t.monto;
        }
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
                    const cat = categorias.find(c => c.nombre === nombre);
                    return cat ? cat.color : '#ccc';
                })
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Gastos por Categoría'
                }
            }
        }
    });
    const meses = Object.keys(evolucion).sort();
    window.chartEvolucion = new Chart(ctxEvolucion, {
        type: 'line',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Ingresos',
                    data: meses.map(m => evolucion[m].ingresos),
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.3
                },
                {
                    label: 'Egresos',
                    data: meses.map(m => evolucion[m].egresos),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Evolución Mensual'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return fechaStr;
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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
    if (tipo === 'success') {
        alerta.style.backgroundColor = '#27ae60';
    } else if (tipo === 'error') {
        alerta.style.backgroundColor = '#e74c3c';
    } else {
        alerta.style.backgroundColor = '#3498db';
    }
    document.body.appendChild(alerta);
    setTimeout(() => {
        alerta.remove();
    }, 3000);
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

document.addEventListener('DOMContentLoaded', inicializarAplicacion);