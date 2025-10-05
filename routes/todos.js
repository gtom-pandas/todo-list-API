const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

router.post('/todos', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id; // Ajouté par le middleware

  if (!title || !description) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  db.run(
    'INSERT INTO todos (user_id, title, description) VALUES (?, ?, ?)',
    [userId, title, description],
    function (err) {
      if (err) return res.status(500).json({ message: 'Erreur BDD' });
      res.status(201).json({ id: this.lastID, title, description });
    }
  );
});
router.get('/todos', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const sortBy = req.query.sortBy || 'id';      // Par défaut trié sur l'id
  const order = req.query.order === 'desc' ? 'DESC' : 'ASC'; // asc ou desc (par défaut asc)

  // Filtrage simple sur titre (optionnel)
  const filter = req.query.search || '';
  const filterSql = filter ? `AND title LIKE ?` : '';
  
  const sql = `
    SELECT * FROM todos
    WHERE user_id = ?
    ${filterSql}
    ORDER BY ${sortBy} ${order}
    LIMIT ? OFFSET ?
  `;
  const params = filter ? [userId, `%${filter}%`, limit, offset] : [userId, limit, offset];

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Erreur BDD' });
    db.get(
      `SELECT COUNT(*) as total FROM todos WHERE user_id = ? ${filter ? 'AND title LIKE ?' : ''}`, 
      filter ? [userId, `%${filter}%`] : [userId], 
      (err, countRes) => {
        if (err) return res.status(500).json({ message: 'Erreur BDD' });
        res.json({
          data: rows,
          page,
          limit,
          total: countRes.total
        });
      }
    );
  });
});

router.put('/todos/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const todoId = req.params.id;
  const { title, description } = req.body;

  db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, todo) => {
    if (err) return res.status(500).json({ message: 'Erreur BDD' });
    if (!todo) return res.status(403).json({ message: 'Interdit (pas propriétaire)' });

    db.run(
      'UPDATE todos SET title = ?, description = ? WHERE id = ?',
      [title ?? todo.title, description ?? todo.description, todoId],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erreur BDD' });
        res.json({ id: todoId, title: title ?? todo.title, description: description ?? todo.description });
      }
    );
  });
});
router.delete('/todos/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const todoId = req.params.id;

  db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, todo) => {
    if (err) return res.status(500).json({ message: 'Erreur BDD' });
    if (!todo) return res.status(403).json({ message: 'Interdit (pas propriétaire)' });

    db.run('DELETE FROM todos WHERE id = ?', [todoId], function (err) {
      if (err) return res.status(500).json({ message: 'Erreur BDD' });
      res.status(204).send(); // 204 = succès, aucune donnée renvoyée
    });
  });
});
router.put('/todos/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const todoId = req.params.id;
  const { title, description } = req.body;

  // On vérifie que le todo appartient bien à l'utilisateur
  db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, todo) => {
    if (err) return res.status(500).json({ message: 'Erreur BDD' });
    if (!todo) return res.status(403).json({ message: 'Forbidden' });

    db.run(
      'UPDATE todos SET title = ?, description = ? WHERE id = ?',
      [title, description, todoId],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erreur BDD' });
        res.json({ id: todoId, title, description });
      }
    );
  });
});
router.delete('/todos/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const todoId = req.params.id;

  db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, todo) => {
    if (err) return res.status(500).json({ message: 'Erreur BDD' });
    if (!todo) return res.status(403).json({ message: 'Forbidden' });

    db.run('DELETE FROM todos WHERE id = ?', [todoId], function (err) {
      if (err) return res.status(500).json({ message: 'Erreur BDD' });
      res.status(204).send();
    });
  });
});

module.exports = router;
