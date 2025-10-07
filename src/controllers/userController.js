import db from '../models/index.js';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import jwt from 'jsonwebtoken';
import admin from '../config/firebase.js';

const { User, Pull, Contribution, Transaction } = db;

// Helper pour récupérer emitRealtimeUpdate de façon dynamique (évite circular imports)
const getEmitRealtimeUpdate = async () => {
  try {
    if (typeof global !== 'undefined' && global.__EMIT_MOCK__) return global.__EMIT_MOCK__;
    const mod = await import('../server.js');
    return mod.emitRealtimeUpdate;
  } catch (err) {
    // Pas fatal en tests sans socket
    return () => {};
  }
};

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

    // Mes cagnottes avec enrichissement des données
    const myPullsRaw = await Pull.findAll({
      where: { userId },
      include: [
        {
          model: Contribution,
          as: 'contributions',
          attributes: ['id', 'amount', 'contributorName', 'createdAt'],
          where: { status: 'completed' },
          required: false,
          include: [{
            model: User,
            as: 'contributor',
            attributes: ['id', 'name', 'email']
          }]
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Enrichir les données des cagnottes comme dans getAllCagnottes
    const myPulls = myPullsRaw.map(pull => {
      const totalCollected = pull.contributions?.reduce((sum, contrib) => {
        return sum + parseFloat(contrib.amount || 0);
      }, 0) || 0;

      return {
        id: pull.id,
        title: pull.title,
        description: pull.description,
        goalAmount: parseFloat(pull.goalAmount),
        currentAmount: totalCollected,
        currency: pull.currency,
        deadline: pull.deadline,
        type: pull.type,
        imageUrl: pull.imageUrl,
        status: pull.status,
        createdAt: pull.createdAt,
        userId: pull.userId,
        owner: pull.owner,
        contributionCount: pull.contributions?.length || 0,
        progressPercentage: pull.goalAmount > 0 ?
          Math.round((totalCollected / parseFloat(pull.goalAmount)) * 100) : 0,
        recentContributions: pull.contributions?.slice(-5) || []
      };
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
        amount: parseFloat(result.total) || 0 // Garder en FCFA
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
      value: parseFloat(item.total) || 0
    })) : [];

    // Top 5 cagnottes par montant collecté
    const [topCagnottes] = await sequelize.query(
      'SELECT p.title, COALESCE(SUM(CAST(c.amount AS DECIMAL(10,2))), 0) as totalcollected FROM pulls p LEFT JOIN contributions c ON p.id = c.pullId AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalcollected DESC LIMIT 5',
      {
        type: QueryTypes.SELECT
      }
    );

    const topCagnottesData = Array.isArray(topCagnottes) ? topCagnottes.map(item => ({
      title: item.title || 'Sans titre',
      amount: parseFloat(item.totalcollected) || 0
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

    // Récupérer les top contributeurs
    const topContributors = await Contribution.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', '*'), 'contributionCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { status: 'completed' },
      include: [{ 
        model: User, 
        as: 'contributor',
        attributes: ['name', 'email'] 
      }],
      group: ['userId', 'contributor.id', 'contributor.name', 'contributor.email'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
      limit: 5
    });

    res.json({
      total: total || 0,
      active: active || 0,
      verified: verified || 0,
      newThisMonth: newThisMonth || 0,
      topContributors: topContributors.map(c => ({
        name: c.User?.name || 'Anonyme',
        count: parseInt(c.getDataValue('contributionCount')),
        amount: parseFloat(c.getDataValue('totalAmount'))
      })) || []
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
        amount: parseFloat(result.total) || 0 // Garder en FCFA
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
      value: parseFloat(item.total) || 0
    })) : [];

    // Top 5 cagnottes par montant collecté
    const [topCagnottes] = await sequelize.query(
      'SELECT p.title, COALESCE(SUM(CAST(c.amount AS DECIMAL(10,2))), 0) as totalcollected FROM pulls p LEFT JOIN contributions c ON p.id = c.pullId AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalcollected DESC LIMIT 5',
      {
        type: QueryTypes.SELECT
      }
    );

    const topCagnottesData = Array.isArray(topCagnottes) ? topCagnottes.map(item => ({
      title: item.title || 'Sans titre',
      amount: parseFloat(item.totalcollected) || 0
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

/**
 * Fusionner manuellement deux comptes Firebase (email et téléphone)
 * Endpoint sécurisé côté serveur utilisant Firebase Admin SDK
 */
const mergeAccounts = async (req, res) => {
  try {
    const currentUser = req.user; // Utilisateur connecté (authentifié via middleware)
    const { email, phone } = req.body;

    console.log(`🔗 Tentative de fusion manuelle pour user ${currentUser.id} (${currentUser.firebaseUid})`);

    // Validation des paramètres
    if (!email && !phone) {
      return res.status(400).json({
        error: 'Paramètres manquants',
        message: 'Vous devez fournir soit un email soit un numéro de téléphone à fusionner'
      });
    }

    // Vérifier que Firebase est configuré
    if (!admin) {
      return res.status(503).json({
        error: 'Service Firebase non disponible',
        message: 'Le service Firebase n\'est pas configuré'
      });
    }

    const currentFirebaseUid = currentUser.firebaseUid;
    if (!currentFirebaseUid) {
      return res.status(400).json({
        error: 'Utilisateur non lié à Firebase',
        message: 'Votre compte n\'est pas lié à Firebase'
      });
    }

    // Récupérer l'utilisateur Firebase actuel
    let currentFirebaseUser;
    try {
      currentFirebaseUser = await admin.auth().getUser(currentFirebaseUid);
    } catch (error) {
      console.error('❌ Erreur récupération utilisateur Firebase actuel:', error);
      return res.status(404).json({
        error: 'Utilisateur Firebase introuvable',
        message: 'Votre compte Firebase n\'existe pas'
      });
    }

    // Chercher le compte à fusionner
    let targetFirebaseUser = null;
    let targetUid = null;
    let searchCriteria = [];

    if (email) {
      searchCriteria.push({ type: 'email', value: email });
    }
    if (phone) {
      // Normaliser le numéro de téléphone
      const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      searchCriteria.push({ type: 'phoneNumber', value: normalizedPhone });
    }

    // Chercher les utilisateurs Firebase correspondants
    for (const criteria of searchCriteria) {
      try {
        console.log(`🔍 Recherche par ${criteria.type}: ${criteria.value}`);

        // Construire l'identifiant selon le type
        let identifier;
        if (criteria.type === 'email') {
          identifier = { email: criteria.value };
        } else if (criteria.type === 'phoneNumber') {
          identifier = { phoneNumber: criteria.value };
        } else {
          console.warn(`⚠️ Type de critère non supporté: ${criteria.type}`);
          continue;
        }

        const usersResult = await admin.auth().getUsers([identifier]);

        for (const user of usersResult.users) {
          if (user.uid !== currentFirebaseUid) {
            targetFirebaseUser = user;
            targetUid = user.uid;
            console.log(`✅ Compte trouvé: ${targetUid} (${criteria.type}: ${criteria.value})`);
            break;
          }
        }

        if (targetFirebaseUser) break;
      } catch (error) {
        console.warn(`⚠️ Erreur recherche par ${criteria.type}:`, error.message);
      }
    }

    if (!targetFirebaseUser) {
      return res.status(404).json({
        error: 'Aucun compte trouvé',
        message: `Aucun compte Firebase trouvé avec ${email || phone}`
      });
    }

    // Vérifier que les comptes ne sont pas déjà liés
    const currentProviders = currentFirebaseUser.providerData || [];
    const targetProviders = targetFirebaseUser.providerData || [];

    console.log(`🔍 Vérification liens existants:`);
    console.log(`   Current providers: ${currentProviders.map(p => p.providerId).join(', ') || 'aucun'}`);
    console.log(`   Target providers: ${targetProviders.map(p => p.providerId).join(', ') || 'aucun'}`);

    // Vérifier si l'un des comptes a déjà les deux providers (vraiment fusionné)
    const currentHasBoth = currentProviders.some(p => p.providerId === 'password') &&
                          currentProviders.some(p => p.providerId === 'phone');
    const targetHasBoth = targetProviders.some(p => p.providerId === 'password') &&
                         targetProviders.some(p => p.providerId === 'phone');

    console.log(`   Current has both providers: ${currentHasBoth}`);
    console.log(`   Target has both providers: ${targetHasBoth}`);

    if (currentHasBoth || targetHasBoth) {
      console.log(`🚫 Au moins un compte a déjà les deux providers - blocage de la fusion`);
      return res.status(400).json({
        error: 'Comptes déjà fusionnés',
        message: 'Au moins un de ces comptes a déjà les deux providers (email + téléphone)'
      });
    }

    console.log(`✅ Comptes pas encore fusionnés - poursuite du processus`);

    console.log(`🔄 Fusion des comptes: ${currentFirebaseUid} <- ${targetUid}`);
    console.log(`📊 Current providers: ${currentProviders.map(p => p.providerId).join(', ')}`);
    console.log(`📊 Target providers: ${targetProviders.map(p => p.providerId).join(', ')}`);

    // Déterminer quel compte garder (celui avec le plus de providers ou le plus récent)
    const currentProviderCount = currentProviders.length;
    const targetProviderCount = targetProviders.length;
    const currentCreatedAt = new Date(currentFirebaseUser.metadata.creationTime);
    const targetCreatedAt = new Date(targetFirebaseUser.metadata.creationTime);

    let keepCurrent = true;

    if (targetProviderCount > currentProviderCount) {
      keepCurrent = false;
    } else if (targetProviderCount === currentProviderCount) {
      keepCurrent = currentCreatedAt >= targetCreatedAt;
    }

    const primaryUid = keepCurrent ? currentFirebaseUid : targetUid;
    const secondaryUid = keepCurrent ? targetUid : currentFirebaseUid;
    const primaryFirebaseUser = keepCurrent ? currentFirebaseUser : targetFirebaseUser;

    console.log(`🎯 Compte principal gardé: ${primaryUid}, secondaire supprimé: ${secondaryUid}`);
    console.log(`📊 Providers - Principal: ${primaryFirebaseUser.providerData?.length || 0}, Secondaire: ${currentProviders.length + targetProviders.length - (primaryFirebaseUser.providerData?.length || 0)}`);

    console.log(`🔄 Démarrage de la fusion avec transaction...`);

    // Utiliser une transaction pour la cohérence
    const transaction = await sequelize.transaction();

    try {
      console.log(`🔄 Étape 1: Recherche d'utilisateurs DB secondaires...`);

      // 1. Mettre à jour la DB si elle pointe vers le compte secondaire
      const dbUserToUpdate = await User.findOne({
        where: { firebaseUid: secondaryUid },
        transaction
      });

      if (dbUserToUpdate) {
        console.log(`📝 Mise à jour DB: user ${dbUserToUpdate.id} firebaseUid ${secondaryUid} -> ${primaryUid}`);
        await dbUserToUpdate.update({
          firebaseUid: primaryUid
        }, { transaction });
        console.log(`✅ DB mise à jour réussie`);
      } else {
        console.log(`ℹ️ Aucun utilisateur DB trouvé avec firebaseUid ${secondaryUid}`);
      }

      console.log(`🔄 Étape 2: Suppression du compte Firebase secondaire...`);

      // 2. Supprimer le compte Firebase secondaire
      try {
        await admin.auth().deleteUser(secondaryUid);
        console.log(`🗑️ Compte Firebase supprimé: ${secondaryUid}`);
      } catch (deleteError) {
        console.error(`❌ Erreur suppression Firebase ${secondaryUid}:`, deleteError.message);
        // Ne pas échouer pour autant, continuer
      }

      console.log(`🔄 Étape 3: Commit de la transaction...`);

      // 3. Commit de la transaction
      await transaction.commit();
      console.log(`✅ Transaction committée avec succès`);

      // 4. Rafraîchir le token de l'utilisateur actuel si nécessaire
      if (!keepCurrent) {
        console.log(`🔄 Étape 4: Mise à jour utilisateur actuel...`);
        await currentUser.update({ firebaseUid: primaryUid });
        console.log(`📝 Utilisateur actuel mis à jour: firebaseUid ${currentFirebaseUid} -> ${primaryUid}`);
      }

      console.log(`🎉 Fusion terminée avec succès!`);

      res.json({
        success: true,
        message: 'Comptes fusionnés avec succès',
        data: {
          primaryUid,
          deletedUid: secondaryUid,
          providers: primaryFirebaseUser.providerData?.map(p => p.providerId) || []
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors de la fusion:', error);
      await transaction.rollback();
      console.log(`🔄 Transaction rollback effectuée`);
      throw error;
    }

  } catch (error) {
    console.error('❌ Erreur fusion comptes:', error);
    res.status(500).json({
      error: 'Erreur lors de la fusion',
      message: error.message
    });
  }
};

export default { getAll, getStats, getOne, update, remove, uploadAvatar, getMe, getDashboard, getChartData, getAdminStats, getAdminChartData, adminLogin, mergeAccounts };
