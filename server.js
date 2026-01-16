const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Anti-lock + garante coluna dataNascimento (sem mexer no db.js)
try {
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');

  const cols = db.prepare("PRAGMA table_info(clients)").all().map(c => c.name);
  if (!cols.includes('dataNascimento')) {
    db.exec("ALTER TABLE clients ADD COLUMN dataNascimento TEXT");
    console.log('✅ Coluna dataNascimento criada.');
  }
} catch (e) {
  console.log('⚠️ Aviso (pragma/coluna):', String(e));
}

// Buscar (somente quando pesquisar: /api/clients?q=...)
app.get('/api/clients', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]); // não listar tudo ao abrir

    const digits = q.replace(/\D/g, '');
    const likeName = `%${q}%`;
    const likeDigits = `%${digits}%`;

    const stmt = db.prepare(`
      SELECT * FROM clients
      WHERE name LIKE ?
         OR cpf  LIKE ?
         OR phone LIKE ?
      ORDER BY created_at DESC
      LIMIT 200
    `);

    const rows = stmt.all(likeName, likeDigits, likeDigits);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar clientes', detail: String(e) });
  }
});

// Criar (salva dataNascimento)
app.post('/api/clients', (req, res) => {
  try {
    const { name, cpf, phone, notes, dataNascimento } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });

    const insert = db.prepare(`
      INSERT INTO clients (name, cpf, phone, notes, dataNascimento)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = insert.run(
      name.trim(),
      (cpf && cpf.trim()) || null,
      (phone && phone.trim()) || null,
      (notes && notes.trim()) || null,
      (dataNascimento && dataNascimento.trim()) || null // "YYYY-MM-DD"
    );

    const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao salvar cliente', detail: String(e) });
  }
});

// Remover
app.delete('/api/clients/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const info = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    return res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover cliente', detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
