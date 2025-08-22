const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');


const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);


const dbFile = path.join(dataDir, 'clientes.db');
const db = new Database(dbFile);


// Executa schema na primeira carga
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);


module.exports = db;