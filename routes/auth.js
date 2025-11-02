const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'jwt_secret'; // mis aussi dans la variable environnement

// route POST
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  // email existe -il
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur' });
    if (user) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Hashage du mdp
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: 'Erreur serveur' });

      // insert a user
      db.run(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        function (err) {
          if (err) return res.status(500).json({ message: 'Erreur base données' });

          // génère token JWT 
          const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: '1h' });

          return res.status(201).json({ token });
        }
      );
    });
  });
});
router.post('/login', (req, res) => {
  console.log(req.body); // si besoin de debugger
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  //  cherche utilisateur
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur' });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    //  compare le mot de passe hashé
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Erreur serveur' });
      if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });

      // create  token JWT
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
      return res.status(200).json({ token });
    });
  });
});

module.exports = router;
