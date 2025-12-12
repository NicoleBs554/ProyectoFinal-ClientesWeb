export const CATEGORIAS_PREDEFINIDAS = [
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

export const App = {
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
