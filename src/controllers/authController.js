const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Génération d'un token JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },         // payload
    process.env.JWT_SECRET,                   // clé secrète (à définir dans .env)
    { expiresIn: '1h' }                       // durée de vie du token
  );
}

// ====================
// 📝 Inscription
// ====================
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si email déjà utilisé
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email déjà utilisé" });

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l’utilisateur
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user' // par défaut
    });

    // Générer un token JWT
    const token = generateToken(user);

    res.status(201).json({ message: "Utilisateur créé", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 🔑 Connexion
// ====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Mot de passe incorrect" });

    // Générer un token
    const token = generateToken(user);

    res.json({ message: "Connexion réussie", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 👤 Profil utilisateur
// ====================
exports.me = async (req, res) => {
  try {
    // req.user est ajouté par le middleware authenticate
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
