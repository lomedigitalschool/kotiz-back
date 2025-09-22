import db from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import jwt from 'jsonwebtoken';

const { User, Pull, Contribution, Transaction } = db;

const getAll = async (req, res) => {
  const users = await User.findAll();
  res.json(users);
};

const getStats = async (req, res) => {
  try {
    const total = await User.count();
    const active = await User.count({ where: { isBlocked: false } });
    const verified = await User.count({ where: { isVerified: true } });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: currentMonth
        }
      }
    });

    // Retourner des valeurs sûres (pas de NaN)
    res.json({
      total: total || 0,
      active: active || 0,
      verified: verified || 0,
      newThisMonth: newThisMonth || 0
    });
  } catch (error) {
    console.error('Erreur stats utilisateurs:', error);
    res.status(500).json({
      total: 0,
      active: 0,
      verified: 0,
      newThisMonth: 0,
      error: error.message
    });
  }
};

const getOne = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
  res.json(user);
};

const update = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  await user.update(req.body);
  res.json({ message: "Utilisateur mis à jour", user });
};

const remove = async (req, res) => {
  await User.destroy({ where: { id: req.params.id } });
  res.json({ message: "Utilisateur supprimé" });
};

// Récupérer l'utilisateur actuel
const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isPhoneVerified: user.isPhoneVerified,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Erreur récupération utilisateur actuel:', err);
    res.status(500).json({ error: err.message });
  }
};

// Upload d'avatar utilisateur
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier uploadé" });
    }

    // L'URL Cloudinary est disponible dans req.file.path
    const avatarUrl = req.file.path;

    // Mettre à jour l'avatar de l'utilisateur
    await user.update({ avatarUrl });

    res.json({
      message: "Avatar uploadé avec succès",
      avatarUrl: avatarUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: avatarUrl
      }
    });

  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ error: error.message });
  }
};

// Dashboard utilisateur
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📊 DASHBOARD - Requête pour user ID:', userId, req.user.name);

    // Mes cagnottes
    const myPulls = await Pull.findAll({
      where: { userId }
    });

    // Nombre de cagnottes actives
    const activePullsCount = await Pull.count({
      where: { userId, status: 'active' }
    });

    // Montant total collecté (somme des contributions complétées à mes cagnottes)
    // Utilisation d'une requête SQL brute pour éviter les problèmes Sequelize
    const { QueryTypes } = await import('sequelize');
    const { default: sequelize } = await import('../config/database.js');

    const [totalResult] = await sequelize.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = $1 AND "pullId" IN (SELECT id FROM pulls WHERE "userId" = $2)',
      {
        bind: ['completed', userId],
        type: QueryTypes.SELECT
      }
    );

    const totalCollected = parseFloat(totalResult.total) || 0;

    // Nombre de contributeurs (utilisateurs uniques qui ont contribué à mes cagnottes)
    const [contributorsResult] = await sequelize.query(
      'SELECT COUNT(DISTINCT "userId") as count FROM contributions WHERE status = $1 AND "pullId" IN (SELECT id FROM pulls WHERE "userId" = $2)',
      {
        bind: ['completed', userId],
        type: QueryTypes.SELECT
      }
    );

    const contributorsCount = parseInt(contributorsResult.count) || 0;

    // Mes contributions
    const myContributions = await Contribution.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      totalCollected,
      activePullsCount,
      contributorsCount,
      myPulls,
      myContributions
    });

  } catch (err) {
    console.error('Erreur dashboard utilisateur:', err);
    res.status(500).json({ error: err.message });
  }
};

// Données pour les graphiques AdminJS
const getChartData = async (req, res) => {
  try {

    // Données d'évolution des contributions par mois (6 derniers mois)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const [result] = await sequelize.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = $1 AND createdAt >= $2 AND createdAt < $3',
        {
          bind: ['completed', date, nextMonth],
          type: QueryTypes.SELECT
        }
      );

      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyData.push({
        month: monthName,
        amount: parseFloat(result.total) / 100 // Convertir en euros/FCFA
      });
    }

    // Répartition par méthode de paiement
    const [paymentMethods] = await sequelize.query(
      'SELECT paymentMethod, COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = $1 GROUP BY paymentMethod',
      {
        bind: ['completed'],
        type: QueryTypes.SELECT
      }
    );

    const paymentData = Array.isArray(paymentMethods) ? paymentMethods.map(item => ({
      name: item.paymentmethod || 'Non spécifié',
      value: parseFloat(item.total) / 100
    })) : [];

    // Top 5 cagnottes par montant collecté
    const [topCagnottes] = await sequelize.query(
      'SELECT p.title, COALESCE(SUM(c.amount), 0) as totalCollected FROM pulls p LEFT JOIN contributions c ON p.id = c.pullId AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalCollected DESC LIMIT 5',
      {
        type: QueryTypes.SELECT
      }
    );

    const topCagnottesData = Array.isArray(topCagnottes) ? topCagnottes.map(item => ({
      title: item.title || 'Sans titre',
      amount: parseFloat(item.totalcollected) / 100
    })) : [];

    res.json({
      monthlyEvolution: monthlyData,
      paymentMethods: paymentData,
      topCagnottes: topCagnottesData
    });

  } catch (error) {
    console.error('Erreur données graphiques:', error);
    res.status(500).json({ error: error.message });
  }
};

// Méthodes spéciales pour AdminJS (sans authentification JWT)
const getAdminStats = async (req, res) => {
  console.log('🔍 getAdminStats appelée depuis:', req.url);
  try {
    const total = await User.count();
    const active = await User.count({ where: { isBlocked: false } });
    const verified = await User.count({ where: { isVerified: true } });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: currentMonth
        }
      }
    });

    // Retourner des valeurs sûres (pas de NaN)
    res.json({
      total: total || 0,
      active: active || 0,
      verified: verified || 0,
      newThisMonth: newThisMonth || 0
    });
  } catch (error) {
    console.error('Erreur admin stats utilisateurs:', error);
    res.status(500).json({
      total: 0,
      active: 0,
      verified: 0,
      newThisMonth: 0,
      error: error.message
    });
  }
};

const getAdminChartData = async (req, res) => {
  try {

    // Données d'évolution des contributions par mois (6 derniers mois)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const [result] = await sequelize.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = $1 AND createdAt >= $2 AND createdAt < $3',
        {
          bind: ['completed', date, nextMonth],
          type: QueryTypes.SELECT
        }
      );

      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyData.push({
        month: monthName,
        amount: parseFloat(result.total) / 100 // Convertir en euros/FCFA
      });
    }

    // Répartition par méthode de paiement
    const [paymentMethods] = await sequelize.query(
      'SELECT paymentMethod, COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = $1 GROUP BY paymentMethod',
      {
        bind: ['completed'],
        type: QueryTypes.SELECT
      }
    );

    const paymentData = Array.isArray(paymentMethods) ? paymentMethods.map(item => ({
      name: item.paymentmethod || 'Non spécifié',
      value: parseFloat(item.total) / 100
    })) : [];

    // Top 5 cagnottes par montant collecté
    const [topCagnottes] = await sequelize.query(
      'SELECT p.title, COALESCE(SUM(c.amount), 0) as totalCollected FROM pulls p LEFT JOIN contributions c ON p.id = c.pullId AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalCollected DESC LIMIT 5',
      {
        type: QueryTypes.SELECT
      }
    );

    const topCagnottesData = Array.isArray(topCagnottes) ? topCagnottes.map(item => ({
      title: item.title || 'Sans titre',
      amount: parseFloat(item.totalcollected) / 100
    })) : [];

    res.json({
      monthlyEvolution: monthlyData,
      paymentMethods: paymentData,
      topCagnottes: topCagnottesData
    });

  } catch (error) {
    console.error('Erreur admin données graphiques:', error);
    res.status(500).json({ error: error.message });
  }
};

// Connexion spéciale pour l'admin local (génère token JWT)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier les credentials admin
    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Credentials invalides' });
    }

    // Trouver ou créer l'admin en base
    let adminUser = await User.findOne({ where: { email: process.env.ADMIN_EMAIL } });

    if (!adminUser) {
      adminUser = await User.create({
        email: process.env.ADMIN_EMAIL,
        name: 'Administrateur',
        role: 'admin',
        isVerified: true,
        isBlocked: false
      });
    }

    // Générer token JWT
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🔐 Admin connecté avec succès:', adminUser.email);

    res.json({
      success: true,
      message: 'Connexion admin réussie',
      token: token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Erreur connexion admin:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion admin' });
  }
};

export default { getAll, getStats, getOne, update, remove, uploadAvatar, getMe, getDashboard, getChartData, getAdminStats, getAdminChartData, adminLogin };
