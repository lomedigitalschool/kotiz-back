import db from '../models/index.js';
const { Pull, Contribution, User } = db;
import { Op, QueryTypes } from 'sequelize';
import { sendEmail } from '../config/mailer.js';
import emailContent from '../config/emailContent.js';
import sequelize from '../config/database.js';

export const getStats = async (req, res) => {
  try {
    const activeCount = await Pull.count({ where: { status: 'active' } });
    const totalCount = await Pull.count();

    // Top 5 cagnottes par montant collecté
    const [topCagnottesResult] = await sequelize.query(
      'SELECT p.id, p.title, COALESCE(SUM(c.amount), 0) as totalCollected FROM pulls p LEFT JOIN contributions c ON p.id = c."pullId" AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalCollected DESC LIMIT 5',
      { type: QueryTypes.SELECT }
    );
    const topCagnottes = Array.isArray(topCagnottesResult) ? topCagnottesResult : [];

    res.json({
      activeCount: activeCount || 0,
      totalCount: totalCount || 0,
      topCagnottes: topCagnottes || []
    });
  } catch (error) {
    console.error('Erreur stats pulls:', error);
    res.status(500).json({
      activeCount: 0,
      totalCount: 0,
      topCagnottes: [],
      error: error.message
    });
  }
};

// Créer un nouveau Pull
export const create = async (req, res) => {
  try {
    console.log('=== CRÉATION CAGNOTTE ===');
    console.log('Données reçues:', req.body);
    console.log('Fichiers reçus:', req.file);
    console.log('Utilisateur:', req.user);
    console.log('Headers:', req.headers);

    // Validation des données requises
    if (!req.body.title || !req.body.goalAmount) {
      return res.status(400).json({
        error: "Le titre et le montant cible sont requis"
      });
    }

    // Conversion des types de données
    const pullData = {
      title: req.body.title,
      description: req.body.description || null,
      goalAmount: parseFloat(req.body.goalAmount),
      currency: req.body.currency || 'XOF',
      deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      type: req.body.type || 'public',
      participantLimit: req.body.participantLimit ? parseInt(req.body.participantLimit) : null,
      status: 'active', // Les nouvelles cagnottes sont actives par défaut
      userId: req.user.id
    };

    // Gestion de l'image si elle existe
    if (req.file) {
      // Utiliser l'URL Cloudinary directement
      console.log('Fichier uploadé:', req.file);
      pullData.imageUrl = req.file.path || req.file.url; // URL Cloudinary complète
      console.log('URL de l\'image:', pullData.imageUrl);
    }

    console.log('Données à sauvegarder:', pullData);

    const newPull = await Pull.create(pullData);
    res.status(201).json({
      success: true,
      message: "Cagnotte créée avec succès",
      pull: newPull
    });
  } catch (err) {
    console.error('Erreur lors de la création du pull:', err);
    console.error('Stack trace:', err.stack);
    console.error('Type d\'erreur:', typeof err);
    console.error('Propriétés de l\'erreur:', Object.keys(err));

    // Gestion spécifique des erreurs de validation Sequelize
    if (err.name === 'SequelizeValidationError') {
      const validationErrors = err.errors.map(e => `${e.path}: ${e.message}`);
      return res.status(400).json({
        error: "Erreur de validation",
        details: validationErrors.join(', ')
      });
    }

    // Gestion des erreurs de base de données
    if (err.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        error: "Erreur de base de données",
        details: err.message
      });
    }

    // Erreur générique
    res.status(500).json({
      error: "Erreur lors de la création de la cagnotte",
      details: err.message || 'Erreur inconnue',
      type: err.name || 'UnknownError'
    });
  }
};

// Récupérer tous les Pulls de l'utilisateur connecté avec leurs Contributions
export const getAll = async (req, res) => {
  try {
    console.log('=== RÉCUPÉRATION CAGNOTTES UTILISATEUR ===');
    console.log('Utilisateur connecté:', req.user.id, req.user.email);
    
    const pulls = await Pull.findAll({
      where: { userId: req.user.id }, // ✅ Filtrer par utilisateur connecté
      include: [
        { model: Contribution, as: 'contributions' } // ← alias exact défini dans le modèle
      ]
    });
    
    console.log(`Nombre de cagnottes trouvées pour l'utilisateur ${req.user.id}:`, pulls.length);
    pulls.forEach(pull => {
      console.log(`  - Cagnotte ID: ${pull.id} | Titre: ${pull.title} | Propriétaire: ${pull.userId}`);
    });
    
    res.json(pulls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Récupérer un Pull par ID avec ses Contributions (uniquement si l'utilisateur est propriétaire)
export const getOne = async (req, res) => {
  try {
    const singlePull = await Pull.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id // ✅ Vérifier que l'utilisateur est propriétaire
      },
      include: [
        { model: Contribution, as: 'contributions' }
      ]
    });
    if (!singlePull) return res.status(404).json({ message: "Pull introuvable ou accès non autorisé" });
    res.json(singlePull);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une cagnotte (propriétaire ou admin)
export const update = async (req, res) => {
  try {
    console.log('=== MODIFICATION CAGNOTTE ===');
    console.log('Cagnotte ID:', req.params.id);
    console.log('Utilisateur complet:', req.user);
    console.log('Utilisateur ID:', req.user.id, 'Type:', typeof req.user.id);
    console.log('Utilisateur role:', req.user.role);
    console.log('Données reçues:', req.body);
    
    const pull = await Pull.findByPk(req.params.id);
    if (!pull) {
      return res.status(404).json({ error: "Cagnotte non trouvée" });
    }
    
    console.log('Propriétaire cagnotte:', pull.userId, 'Type:', typeof pull.userId);
    
    // Conversion explicite pour éviter les problèmes de type string vs int
    const userId = parseInt(req.user.id);
    const pullUserId = parseInt(pull.userId);
    
    console.log('Comparaison après conversion:');
    console.log('  - userId (converti):', userId, typeof userId);
    console.log('  - pullUserId (converti):', pullUserId, typeof pullUserId);
    
    // Vérification d'autorisation : propriétaire OU admin
    const isOwner = pullUserId === userId;
    const isAdmin = req.user.role === 'admin';
    
    console.log('Résultats vérification:');
    console.log('  - isOwner:', isOwner);
    console.log('  - isAdmin:', isAdmin);
    
    if (!isOwner && !isAdmin) {
      console.log('❌ Accès refusé - Détails:');
      console.log('  - pull.userId:', pull.userId, typeof pull.userId);
      console.log('  - req.user.id:', req.user.id, typeof req.user.id);
      console.log('  - req.user.role:', req.user.role);
      return res.status(403).json({ 
        error: "Vous n'avez pas l'autorisation de modifier cette cagnotte",
        debug: {
          pullUserId: pull.userId,
          currentUserId: req.user.id,
          userRole: req.user.role,
          isOwner,
          isAdmin
        }
      });
    }
    
    console.log('✅ Autorisation accordée:', isOwner ? 'propriétaire' : 'admin');
    
    // Whitelist des champs modifiables avec conversion de types
    const allowedFields = {
      title: (val) => val,
      description: (val) => val,
      goalAmount: (val) => parseFloat(val),
      currency: (val) => val,
      deadline: (val) => val ? new Date(val) : null,
      type: (val) => val,
      status: (val) => val,
      participantLimit: (val) => val ? parseInt(val) : null
    };
    
    // Appliquer les modifications
    let hasChanges = false;
    Object.keys(allowedFields).forEach(field => {
      if (req.body[field] !== undefined) {
        const newValue = allowedFields[field](req.body[field]);
        if (pull[field] !== newValue) {
          console.log(`Modification ${field}: ${pull[field]} → ${newValue}`);
          pull[field] = newValue;
          hasChanges = true;
        }
      }
    });
    
    if (!hasChanges) {
      console.log('⚠️ Aucune modification détectée');
      return res.json({ message: "Aucune modification nécessaire", pull });
    }
    
    // Sauvegarder
    await pull.save();
    
    console.log('✅ Cagnotte modifiée avec succès:', pull.title);
    res.json({ message: "Cagnotte mise à jour avec succès", pull });
    
  } catch (err) {
    console.error('❌ Erreur lors de la modification:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: "Erreur lors de la modification de la cagnotte",
      details: err.message 
    });
  }
};

// Supprimer un Pull (uniquement si l'utilisateur est propriétaire)
export const remove = async (req, res) => {
  try {
    const deleted = await Pull.destroy({
      where: {
        id: req.params.id,
        userId: req.user.id // ✅ Vérifier que l'utilisateur est propriétaire
      }
    });
    if (!deleted) return res.status(404).json({ message: "Pull introuvable ou accès non autorisé" });

    res.json({ message: "Pull supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Contribuer à une cagnotte
export const contribute = async (req, res) => {
  try {
    const { pullId } = req.params;
    const { amount, message } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    // Vérifier que la cagnotte existe
    const pull = await Pull.findByPk(pullId);
    if (!pull) {
      return res.status(404).json({ error: "Cagnotte non trouvée" });
    }

    // Créer la contribution
    const contribution = await Contribution.create({
      amount: parseFloat(amount),
      message: message || null,
      status: 'completed', // Supposons que le paiement est immédiat
      userId,
      pullId
    });

    // Récupérer les informations du contributeur
    const contributor = await User.findByPk(userId);

    // Envoyer un reçu au contributeur
    if (contributor.email) {
      try {
        const subject = emailContent.subjects.contributionReceipt.replace('{{pullTitle}}', pull.title);
        const template = emailContent.templates.contributionReceipt;
        const variables = {
          contributorName: contributor.name,
          amount: amount,
          pullTitle: pull.title,
          transactionId: contribution.id
        };
        await sendEmail(contributor.email, subject, template, variables);
      } catch (emailError) {
        console.error('Error sending receipt email:', emailError);
      }
    }

    // Envoyer une notification au créateur de la cagnotte
    const owner = await User.findByPk(pull.userId);
    if (owner.email) {
      try {
        const subject = emailContent.subjects.contributionNotification;
        const template = emailContent.templates.contributionNotification;
        const variables = {
          contributorName: contributor.name,
          amount: amount,
          pullTitle: pull.title
        };
        await sendEmail(owner.email, subject, template, variables);
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }
    }

    res.json({
      success: true,
      message: "Contribution effectuée avec succès",
      contribution
    });

  } catch (err) {
    console.error('Erreur lors de la contribution:', err);
    res.status(500).json({ error: err.message });
  }
};

// ====================
// 📋 RÉCUPÉRER LES CAGNOTTES PUBLIQUES (SANS AUTHENTIFICATION)
// ====================
export const getPublicCagnottes = async (req, res) => {
  try {
    console.log('=== RÉCUPÉRATION CAGNOTTES PUBLIQUES ===');

    const { page = 1, limit = 20, search = '', type = 'public' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Conditions de base pour les cagnottes publiques actives
    const whereConditions = {
      status: 'active',
      type: type // 'public' par défaut
    };

    // Ajouter la recherche si fournie
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: pulls } = await Pull.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Contribution,
          as: 'contributions',
          attributes: ['id', 'amount', 'contributorName', 'createdAt'],
          where: { status: 'completed' }, // Uniquement les contributions complétées
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
          attributes: ['id', 'name', 'email'] // Informations limitées du propriétaire
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true // Éviter les doublons dus aux includes
    });

    // Calculer le montant total collecté pour chaque cagnotte
    const pullsWithStats = pulls.map(pull => {
      const totalCollected = pull.contributions?.reduce((sum, contrib) => {
        return sum + parseFloat(contrib.amount || 0);
      }, 0) || 0;

      return {
        id: pull.id,
        title: pull.title,
        description: pull.description,
        goalAmount: parseFloat(pull.goalAmount),
        currentAmount: totalCollected, // Montant réel collecté
        currency: pull.currency,
        deadline: pull.deadline,
        type: pull.type,
        imageUrl: pull.imageUrl,
        status: pull.status,
        createdAt: pull.createdAt,
        owner: pull.owner,
        contributionCount: pull.contributions?.length || 0,
        progressPercentage: pull.goalAmount > 0 ?
          Math.round((totalCollected / parseFloat(pull.goalAmount)) * 100) : 0
      };
    });

    console.log(`✅ ${pullsWithStats.length} cagnottes publiques récupérées`);

    res.json({
      success: true,
      data: pullsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      message: `${pullsWithStats.length} cagnottes trouvées`
    });

  } catch (err) {
    console.error('❌ Erreur lors de la récupération des cagnottes publiques:', err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des cagnottes publiques",
      details: err.message
    });
  }
};

// ====================
// 📋 RÉCUPÉRER TOUTES LES CAGNOTTES (PUBLIQUES + PRIVÉES SI AUTHENTIFIÉ)
// ====================
export const getAllCagnottes = async (req, res) => {
  try {
    console.log('=== RÉCUPÉRATION TOUTES LES CAGNOTTES ===');

    const { page = 1, limit = 50, search = '', type = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Conditions de base : TOUTES les cagnottes actives (pas de filtrage par visibilité)
    const whereConditions = {
      status: 'active'
    };

    // Filtrage par type si spécifié
    if (type !== 'all') {
      whereConditions.type = type;
    }

    // Ajouter la recherche si fournie
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: pulls } = await Pull.findAndCountAll({
      where: whereConditions,
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
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    // Calculer le montant total collecté pour chaque cagnotte
    const pullsWithStats = pulls.map(pull => {
      const totalCollected = pull.contributions?.reduce((sum, contrib) => {
        return sum + parseFloat(contrib.amount || 0);
      }, 0) || 0;

      // Vérifier si l'utilisateur est le propriétaire
      const isOwner = req.user && req.user.id === pull.userId;
      const isPrivate = pull.type === 'private';

      // Base data
      const cagnotteData = {
        id: pull.id,
        title: pull.title,
        description: pull.description,
        currency: pull.currency,
        deadline: pull.deadline,
        type: pull.type,
        imageUrl: pull.imageUrl,
        status: pull.status,
        createdAt: pull.createdAt,
        userId: pull.userId,
        owner: pull.owner,
        isOwner: isOwner
      };

      // Pour les cagnottes privées, masquer les détails sensibles si pas propriétaire
      if (isPrivate && !isOwner) {
        return {
          ...cagnotteData,
          // 🔒 Champs sensibles masqués pour les non-propriétaires
          goalAmount: null,
          currentAmount: null,
          contributionCount: null,
          progressPercentage: null,
          contributions: [], // Masquer la liste des contributions
          // Garder seulement les informations publiques
          description: pull.description ? "Description disponible pour les propriétaires uniquement" : null
        };
      } else {
        // Cagnotte publique OU propriétaire : montrer tous les détails
        return {
          ...cagnotteData,
          goalAmount: parseFloat(pull.goalAmount),
          currentAmount: totalCollected,
          contributionCount: pull.contributions?.length || 0,
          progressPercentage: pull.goalAmount > 0 ?
            Math.round((totalCollected / parseFloat(pull.goalAmount)) * 100) : 0,
          recentContributions: pull.contributions?.slice(-5) || []
        };
      }
    });

    console.log(`✅ ${pullsWithStats.length} cagnottes récupérées (${req.user ? 'avec' : 'sans'} authentification)`);

    res.json({
      success: true,
      data: pullsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      },
      message: `${pullsWithStats.length} cagnottes trouvées`
    });

  } catch (err) {
    console.error('❌ Erreur lors de la récupération de toutes les cagnottes:', err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des cagnottes",
      details: err.message
    });
  }
};

// ====================
// 📋 RÉCUPÉRER UNE CAGNOTTE PAR ID (AVEC CONTRÔLE D'ACCÈS)
// ====================
export const getCagnotteById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`=== RÉCUPÉRATION CAGNOTTE ${id} ===`);

    // Validation : s'assurer que l'ID est numérique
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de cagnotte invalide - doit être un nombre"
      });
    }

    const pull = await Pull.findOne({
      where: {
        id: parseInt(id),
        status: 'active'
      },
      include: [
        {
          model: Contribution,
          as: 'contributions',
          attributes: ['id', 'amount', 'contributorName', 'message', 'createdAt'],
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
          attributes: ['id', 'name']
        }
      ]
    });

    if (!pull) {
      return res.status(404).json({
        success: false,
        error: "Cagnotte non trouvée"
      });
    }

    // Vérifier les droits d'accès
    const isOwner = req.user && req.user.id === pull.userId;
    const isPrivate = pull.type === 'private';

    // Pour les cagnottes privées, on autorise l'accès mais on masque les détails sensibles
    // Seuls les propriétaires peuvent voir tous les détails

    // Calculer le montant total collecté
    const totalCollected = pull.contributions?.reduce((sum, contrib) => {
      return sum + parseFloat(contrib.amount || 0);
    }, 0) || 0;

    // Base data commune
    const baseData = {
      id: pull.id,
      title: pull.title,
      currency: pull.currency,
      deadline: pull.deadline,
      type: pull.type,
      imageUrl: pull.imageUrl,
      status: pull.status,
      createdAt: pull.createdAt,
      userId: pull.userId,
      owner: pull.owner,
      isOwner: isOwner
    };

    let cagnotteData;

    // Pour les cagnottes privées, masquer les détails sensibles si pas propriétaire
    if (isPrivate && !isOwner) {
      cagnotteData = {
        ...baseData,
        // 🔒 Champs sensibles masqués pour les non-propriétaires
        description: "Description disponible pour les propriétaires uniquement",
        goalAmount: null,
        currentAmount: null,
        contributionCount: null,
        progressPercentage: null,
        contributions: [], // Masquer toutes les contributions
        recentContributions: []
      };
    } else {
      // Cagnotte publique OU propriétaire : montrer tous les détails
      cagnotteData = {
        ...baseData,
        description: pull.description,
        goalAmount: parseFloat(pull.goalAmount),
        currentAmount: totalCollected,
        contributionCount: pull.contributions?.length || 0,
        progressPercentage: pull.goalAmount > 0 ?
          Math.round((totalCollected / parseFloat(pull.goalAmount)) * 100) : 0,
        recentContributions: pull.contributions?.slice(-5) || []
      };
    }

    console.log(`✅ Cagnotte ${id} récupérée (${pull.type})`);

    res.json({
      success: true,
      data: cagnotteData
    });

  } catch (err) {
    console.error(`❌ Erreur lors de la récupération de la cagnotte ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la cagnotte",
      details: err.message
    });
  }
};

// ====================
// 📋 RÉCUPÉRER LES CONTRIBUTIONS D'UNE CAGNOTTE PAR ID
// ====================
export const getContributionsByPullId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`=== RÉCUPÉRATION CONTRIBUTIONS CAGNOTTE ${id} ===`);

    // Validation : s'assurer que l'ID est numérique
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID de cagnotte invalide - doit être un nombre"
      });
    }

    // Vérifier que la cagnotte existe et est active
    const pull = await Pull.findOne({
      where: {
        id: parseInt(id),
        status: 'active'
      }
    });

    if (!pull) {
      return res.status(404).json({
        success: false,
        error: "Cagnotte non trouvée"
      });
    }

    // Vérifier les droits d'accès
    const isOwner = req.user && req.user.id === pull.userId;
    const isPrivate = pull.type === 'private';

    // Pour les cagnottes privées, seuls les propriétaires peuvent voir les contributions
    if (isPrivate && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé - Cette cagnotte est privée"
      });
    }

    // Récupérer les contributions avec les informations des contributeurs
    const contributions = await Contribution.findAll({
      where: {
        pullId: parseInt(id),
        status: 'completed'
      },
      include: [{
        model: User,
        as: 'contributor',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ ${contributions.length} contributions récupérées pour la cagnotte ${id}`);

    res.json({
      success: true,
      data: contributions,
      message: `${contributions.length} contributions trouvées`
    });

  } catch (err) {
    console.error(`❌ Erreur lors de la récupération des contributions de la cagnotte ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des contributions",
      details: err.message
    });
  }
};

// ====================
// 📋 RÉCUPÉRER UNE CAGNOTTE PUBLIQUE PAR ID
// ====================
export const getPublicCagnotteById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`=== RÉCUPÉRATION CAGNOTTE PUBLIQUE ${id} ===`);

    const pull = await Pull.findOne({
      where: {
        id: id,
        status: 'active',
        type: 'public'
      },
      include: [
        {
          model: Contribution,
          as: 'contributions',
          attributes: ['id', 'amount', 'contributorName', 'message', 'createdAt'],
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
          attributes: ['id', 'name']
        }
      ]
    });

    if (!pull) {
      return res.status(404).json({
        success: false,
        error: "Cagnotte non trouvée ou non publique"
      });
    }

    // Calculer le montant total collecté
    const totalCollected = pull.contributions?.reduce((sum, contrib) => {
      return sum + parseFloat(contrib.amount || 0);
    }, 0) || 0;

    const cagnotteData = {
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
      owner: pull.owner,
      contributionCount: pull.contributions?.length || 0,
      progressPercentage: pull.goalAmount > 0 ?
        Math.round((totalCollected / parseFloat(pull.goalAmount)) * 100) : 0,
      recentContributions: pull.contributions?.slice(-5) || [] // 5 dernières contributions
    };

    console.log(`✅ Cagnotte publique ${id} récupérée`);

    res.json({
      success: true,
      data: cagnotteData
    });

  } catch (err) {
    console.error(`❌ Erreur lors de la récupération de la cagnotte ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de la cagnotte",
      details: err.message
    });
  }
};
