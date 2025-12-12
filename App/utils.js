export const U = {
  parseDateLocal: (s) => {
    if (!s) return null;
    const parts = s.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  },
  fmt: (s) => {
    const d = U.parseDateLocal(s);
    return d && !isNaN(d) ? d.toLocaleDateString('es-ES') : (s || '-');
  },
  toast: (msg, type = 'info') => {
    const el = document.createElement('div');
    el.className = `alerta ${type}`;
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px',
      borderRadius: '6px',
      color: '#fff',
      zIndex: 1000,
      backgroundColor: type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
  confirm: (title, message, onConfirm) => {
    const modal = document.getElementById('modal-confirmacion');
    if (!modal) {
      if (confirm(`${title}\n\n${message}`)) onConfirm();
      return;
    }
    const titleEl = document.getElementById('modal-titulo');
    const msgEl = document.getElementById('modal-mensaje');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    modal.style.display = 'flex';
    const btnConfirm = document.getElementById('btn-modal-confirmar');
    const btnCancel = document.getElementById('btn-modal-cancelar');
    const newConfirm = btnConfirm ? btnConfirm.cloneNode(true) : null;
    const newCancel = btnCancel ? btnCancel.cloneNode(true) : null;
    if (btnConfirm && newConfirm) btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
    if (btnCancel && newCancel) btnCancel.parentNode.replaceChild(newCancel, btnCancel);
    if (newConfirm) newConfirm.addEventListener('click', () => { onConfirm(); modal.style.display = 'none'; });
    if (newCancel) newCancel.addEventListener('click', () => { modal.style.display = 'none'; });
  },

  closeModal: () => {
    const m = document.getElementById('modal-confirmacion');
    if (m) m.style.display = 'none';
  },
  activateSection: (sectionIdOrEl) => {
    const el = typeof sectionIdOrEl === 'string' ? document.getElementById(sectionIdOrEl) : sectionIdOrEl;
    if (!el) return;
    const navBtn = document.querySelector(`[data-section="${el.id}"]`);
    if (navBtn) {
      document.querySelectorAll('.sidebar a').forEach(b => b.classList.remove('active'));
      navBtn.classList.add('active');
    }
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof el.focus === 'function') {
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
    }
  },

  focusFirstInput: (sectionId) => {
    const sec = document.getElementById(sectionId);
    if (!sec) return;
    const first = sec.querySelector('input, select, textarea, button');
    if (first) {
      first.focus({ preventScroll: true });
    }
  }
};
