const jwt = require('jsonwebtoken');
const JWT_SECRET = 'ton_secret_pour_jwt';

function authenticateToken(req, res, next) {
  // Récupère le token du header Authorization
  const authHeader = req.headers['authorization'];
  console.log("Authorization header:", req.headers['authorization']);
  const token = authHeader && authHeader.split(' ')[1]; // Format attendu : "Bearer eyJhb..."

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user; // Ajoute l'id utilisateur dans req.user
    next();
  });
}

module.exports = authenticateToken;
