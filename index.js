const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.json()); 
const authRouter = require('./routes/auth');
app.use('/api', authRouter);
const todosRouter = require('./routes/todos');
app.use('/api', todosRouter);

app.get('/', (req, res) => {
  res.send('Hello World! test');
});

const db = require('./db');

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    )`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );
});


app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
