// ===== Utils de CPF =====
function somenteDigitos(s = '') {
  return (s || '').replace(/\D+/g, '');
}

function formatCpf(cpf) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11) return cpf || '';
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function maskCpfParcial(cpf) {
  const d = somenteDigitos(cpf);
  if (!d) return '';
  const visivel = d.slice(0, 5);
  const oculto = '•'.repeat(Math.max(0, d.length - 5));
  return visivel + oculto;
}

// ===== ÍCONES (SVG inline, sem dependências) =====
const eyeOpenIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5Z" fill="currentColor"/>
  <circle cx="12" cy="12" r="4.5" fill="white"/>
  <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
</svg>`;

const eyeSlashIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7z" fill="currentColor" opacity="0.25"/>
  <path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="12" r="4.5" fill="currentColor" opacity="0.25"/>
</svg>`;

// ===== Estado na memória =====
let allClients = [];

// ===== Buscar clientes e renderizar =====
async function fetchClients() {
  const res = await fetch('/api/clients');
  const data = await res.json();
  allClients = Array.isArray(data) ? data : [];
  renderClients(allClients);
}

function renderClients(list) {
  const tbody = document.querySelector('#clients-table tbody');
  tbody.innerHTML = '';
  list.forEach(c => {
    const created = c.created_at
      ? new Date(String(c.created_at).replace(' ', 'T')).toLocaleString('pt-BR')
      : '';
    const cpfFull = c.cpf || '';
    const cpfMasked = maskCpfParcial(cpfFull);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name ?? ''}</td>
      <td>
        <span class="cpf-wrap">
          <span class="cpf-text" data-full="${cpfFull}" data-showing="0">${cpfMasked}</span>
          <button type="button" class="cpf-eye" title="Mostrar/ocultar CPF">
            ${eyeOpenIcon}
          </button>
        </span>
      </td>
      <td>${c.phone ?? ''}</td>
      <td>${c.email ?? ''}</td>
      <td>${c.notes ?? ''}</td>
      <td>${created}</td>
      <td class="actions">
        <button data-id="${c.id}">Remover</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Adicionar cliente =====
async function addClient(payload) {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.error || 'Erro ao salvar');
    return;
  }
  await fetchClients();
}

// ===== Deletar cliente =====
async function deleteClient(id) {
  if (!confirm('Tem certeza que deseja remover?')) return;
  const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    alert('Erro ao remover');
    return;
  }
  await fetchClients();
}

// ===== Delegação de eventos para CPF (mostrar/ocultar) =====
document.querySelector('#clients-table tbody').addEventListener('click', (e) => {
  const btn = e.target.closest('.cpf-eye');
  if (!btn) return;

  const span = btn.parentElement.querySelector('.cpf-text');
  const full = span.getAttribute('data-full') || '';
  const showing = span.dataset.showing === '1';

  if (showing) {
    // Ocultar
    span.textContent = maskCpfParcial(full);
    span.dataset.showing = '0';
    btn.innerHTML = eyeOpenIcon;
  } else {
    // Mostrar
    span.textContent = formatCpf(full);
    span.dataset.showing = '1';
    btn.innerHTML = eyeSlashIcon;
  }
});

// ===== Delegação de eventos para remoção =====
document.querySelector('#clients-table tbody').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  deleteClient(btn.getAttribute('data-id'));
});

// ===== Submissão do formulário =====
const form = document.getElementById('client-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = Object.fromEntries(fd.entries());

  if (payload.cpf) payload.cpf = somenteDigitos(payload.cpf);

  await addClient(payload);
  form.reset();
});

// ===== Inicialização =====
fetchClients();
