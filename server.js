// ===== server.js =====
// GroceryTrack — Node.js + JSON file server

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3000;
const DB   = path.join(__dirname, 'db.json');

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve HTML/CSS/JS files

// ── DB helpers ──────────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB)) {
    const init = { users: [], inventory: [] };
    fs.writeFileSync(DB, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(DB, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// ── Auth: simple session map (in-memory, resets on server restart) ──────────
const sessions = {}; // token -> { name, email }

function makeToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function authMiddleware(req, res, next) {
  const token = req.headers['x-token'];
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  req.user = sessions[token];
  next();
}

// ── Auth Routes ─────────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const db   = readDB();
  const norm = email.toLowerCase();

  if (db.users.find(u => u.email === norm))
    return res.status(400).json({ error: 'Email already registered.' });

  db.users.push({ name, email: norm, password }); // plain text — fine for local use
  writeDB(db);

  res.json({ message: 'Account created.' });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db   = readDB();
  const norm = email.toLowerCase();
  const user = db.users.find(u => u.email === norm && u.password === password);

  if (!user)
    return res.status(401).json({ error: 'Incorrect email or password.' });

  const token = makeToken();
  sessions[token] = { name: user.name, email: user.email };

  res.json({ token, name: user.name, email: user.email });
});

// POST /api/logout
app.post('/api/logout', authMiddleware, (req, res) => {
  const token = req.headers['x-token'];
  delete sessions[token];
  res.json({ message: 'Logged out.' });
});

// ── Inventory Routes ─────────────────────────────────────────────────────────

// GET /api/inventory
app.get('/api/inventory', authMiddleware, (req, res) => {
  const db = readDB();
  res.json(db.inventory);
});

// POST /api/inventory  — add item
app.post('/api/inventory', authMiddleware, (req, res) => {
  const { name, quantity, price } = req.body;

  if (!name)               return res.status(400).json({ error: 'Name required.' });
  if (quantity == null)    return res.status(400).json({ error: 'Quantity required.' });
  if (price    == null)    return res.status(400).json({ error: 'Price required.' });
  if (quantity < 0)        return res.status(400).json({ error: 'Quantity cannot be negative.' });
  if (price    < 0)        return res.status(400).json({ error: 'Price cannot be negative.' });

  const db = readDB();

  if (db.inventory.find(i => i.name.toLowerCase() === name.toLowerCase()))
    return res.status(400).json({ error: 'Item already exists. Use Edit to update.' });

  const item = { id: Date.now(), name, quantity: Number(quantity), price: Number(price) };
  db.inventory.push(item);
  writeDB(db);

  res.status(201).json(item);
});

// PUT /api/inventory/:id  — edit item
app.put('/api/inventory/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const { name, quantity, price } = req.body;
  const db  = readDB();
  const idx = db.inventory.findIndex(i => i.id === id);

  if (idx === -1) return res.status(404).json({ error: 'Item not found.' });
  if (!name)      return res.status(400).json({ error: 'Name cannot be empty.' });
  if (quantity < 0) return res.status(400).json({ error: 'Quantity cannot be negative.' });
  if (price    < 0) return res.status(400).json({ error: 'Price cannot be negative.' });

  db.inventory[idx] = { ...db.inventory[idx], name, quantity: Number(quantity), price: Number(price) };
  writeDB(db);

  res.json(db.inventory[idx]);
});

// DELETE /api/inventory/:id
app.delete('/api/inventory/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const before = db.inventory.length;
  db.inventory = db.inventory.filter(i => i.id !== id);

  if (db.inventory.length === before)
    return res.status(404).json({ error: 'Item not found.' });

  writeDB(db);
  res.json({ message: 'Deleted.' });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  GroceryTrack server running at http://localhost:${PORT}`);
  console.log(`   Data stored in: ${DB}\n`);
});
