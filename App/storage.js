import { CATEGORIAS_PREDEFINIDAS } from './state.js';
export const Storage = (() => {
  const DB = 'finanzas_db', V = 1;
  const STORES = { C: 'categorias', T: 'transacciones', P: 'presupuestos' };

  function openDB() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, V);
      r.onupgradeneeded = e => {
        const db = e.target.result;
        Object.values(STORES).forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  const getAll = store => openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly'), st = tx.objectStore(store), r = st.getAll();
    r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error);
  }));

  const put = (store, item) => openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite'), st = tx.objectStore(store), r = st.put(item);
    r.onsuccess = () => res(item); r.onerror = () => rej(r.error);
  }));

  const del = (store, key) => openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite'), st = tx.objectStore(store), r = st.delete(key);
    r.onsuccess = () => res(); r.onerror = () => rej(r.error);
  }));

  const saveAll = (store, items) => openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite'), st = tx.objectStore(store);
    items.forEach(i => st.put(i));
    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  }));

  async function migrateIfNeeded() {
    if (localStorage.getItem('finanzas_migrado_idx')) return;
    const cats = JSON.parse(localStorage.getItem('finanzas_categorias') || '[]');
    const trans = JSON.parse(localStorage.getItem('finanzas_transacciones') || '[]');
    const buds = JSON.parse(localStorage.getItem('finanzas_presupuestos') || '[]');
    const toSave = cats.length ? cats : CATEGORIAS_PREDEFINIDAS;
    await Promise.all(toSave.map(c => put(STORES.C, c)));
    await Promise.all(trans.map(t => put(STORES.T, t)));
    await Promise.all(buds.map(b => put(STORES.P, b)));
    localStorage.setItem('finanzas_migrado_idx', '1');
  }

  return { STORES, getAll, put, delete: del, saveAll, migrateIfNeeded };
})();
