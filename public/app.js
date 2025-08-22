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


// Form submit
const form = document.getElementById('client-form');
form.addEventListener('submit', async (e) => {
e.preventDefault();
const formData = new FormData(form);
const payload = Object.fromEntries(formData.entries());
await addClient(payload);
form.reset();
});


// Delegação de clique para deletar
const tbody = document.querySelector('#clients-table tbody');
tbody.addEventListener('click', (e) => {
const btn = e.target.closest('button[data-id]');
if (!btn) return;
deleteClient(btn.getAttribute('data-id'));
});


// Inicializa
fetchClients();