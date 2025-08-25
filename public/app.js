async function fetchClients() {
    const res = await fetch('/api/clients');
    const data = await res.json();
    const tbody = document.querySelector('#clients-table tbody');
    tbody.innerHTML = '';
    data.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
<td>${c.name ?? ''}</td>
<td>${c.phone ?? ''}</td>
<td>${c.email ?? ''}</td>
<td>${c.cpf ?? ''}</td>
<td>${c.notes ?? ''}</td>
<td>${new Date(c.created_at).toLocaleString('pt-BR')}</td>
<td class="actions">
<button data-id="${c.id}">Remover</button>
</td>
`;
        tbody.appendChild(tr);
    });
}


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


async function deleteClient(id) {
    if (!confirm('Tem certeza que deseja remover?')) return;
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        alert('Erro ao remover');
        return;
    }
    await fetchClients();
}

// ===== Utils de CPF =====
function somenteDigitos(s = '') { return (s || '').replace(/\D+/g, ''); }

function formatCpf(cpf) {
    const d = somenteDigitos(cpf);
    if (d.length !== 11) return cpf || '';
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// mostra só os 5 primeiros dígitos (resto oculto)
function maskCpfParcial(cpf) {
    const d = somenteDigitos(cpf);
    if (!d) return '';
    const visivel = d.slice(0, 5);
    const oculto = '•'.repeat(Math.max(0, d.length - 5));
    return visivel + oculto;
}

// ===== Estado na memória para filtro =====
let allClients = [];

// ===== Listagem =====
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
        const created = c.created_at ? new Date(String(c.created_at).replace(' ', 'T')).toLocaleString('pt-BR') : '';
        const cpfFull = c.cpf || '';
        const cpfMasked = maskCpfParcial(cpfFull);

        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${c.name ?? ''}</td>
      <td>
        <span class="cpf-wrap">
          <span class="cpf-text" data-full="${cpfFull}">${cpfMasked}</span>
          <button type="button" class="cpf-eye" title="Mostrar/ocultar CPF">👁️</button>
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

// ===== Toggle do olhinho (delegação por linha) =====
document.querySelector('#clients-table tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('.cpf-eye');
    if (!btn) return;

    const span = btn.parentElement.querySelector('.cpf-text');
    const full = span.getAttribute('data-full') || '';
    const showing = span.dataset.showing === '1';

    if (showing) {
        span.textContent = maskCpfParcial(full);
        span.dataset.showing = '0';
    } else {
        span.textContent = formatCpf(full);
        span.dataset.showing = '1';
    }
});


// submit do form
const form = document.getElementById('client-form');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    // normaliza CPF para apenas dígitos ao salvar (opcional)
    if (payload.cpf) payload.cpf = somenteDigitos(payload.cpf);

    await addClient(payload);
    form.reset();
});


// deletar
document.querySelector('#clients-table tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    deleteClient(btn.getAttribute('data-id'));
});

async function deleteClient(id) {
    if (!confirm('Tem certeza que deseja remover?')) return;
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('Erro ao remover'); return; }
    await fetchClients();
}

// ===== Busca (filtro em tempo real) =====
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', () => {
    const q = (searchInput.value || '').toLowerCase().trim();
    if (!q) { renderClients(allClients); return; }

    const filtered = allClients.filter(c => {
        const nome = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const cpf = somenteDigitos(c.cpf || '');
        return nome.includes(q) || email.includes(q) || cpf.includes(q.replace(/\D+/g, '')); // busca por dígitos no CPF
    });

    renderClients(filtered);
});

// Inicializa
fetchClients();