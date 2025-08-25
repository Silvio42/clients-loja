const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Listar clientes
app.get('/api/clients', (req, res) => {
    const stmt = db.prepare('SELECT * FROM clients ORDER BY created_at DESC');
    const rows = stmt.all();
    res.json(rows);
});


// Criar cliente
app.post('/api/clients', (req, res) => {
    const { name, cpf, phone, email, notes } = req.body || {};
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    const insert = db.prepare(
        'INSERT INTO clients (name, cpf, phone, email, notes) VALUES (?, ?, ?, ?, ?)'
    );
    const info = insert.run(
        name.trim(),
        (cpf && cpf.trim()) || null,
        (phone && phone.trim()) || null,
        (email && email.trim()) || null,
        (notes && notes.trim()) || null
    );
    const created = db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
});


// Remover cliente
app.delete('/api/clients/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
    const del = db.prepare('DELETE FROM clients WHERE id = ?');
    const info = del.run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json({ ok: true });
});


app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});