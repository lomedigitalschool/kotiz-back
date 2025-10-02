import db from '../models/index.js';
const { Pull, Contribution, User, Transaction } = db;
import { Op, QueryTypes } from 'sequelize';
import { sendEmail } from '../config/mailer.js';
import emailContent from '../config/emailContent.js';
import sequelize from '../config/database.js';

export const getStats = async (req, res) => {
  try {
    const activeCount = await Pull.count({ where: { status: 'active' } });
    const totalCount = await Pull.count();

    // Top 5 cagnottes par montant collecté
    const topCagnottesResult = await sequelize.query(
      'SELECT p.id, p.title, COALESCE(SUM(CAST(c.amount AS DECIMAL(10,2))), 0) as totalcollected FROM pulls p LEFT JOIN contributions c ON p.id = c."pullId" AND c.status = \'completed\' GROUP BY p.id, p.title ORDER BY totalcollected DESC LIMIT 5',
      { type: QueryTypes.SELECT }
    );
    const topCagnottes = Array.isArray(topCagnottesResult) ? topCagnottesResult.map(row => ({
      id: row.id,
      title: row.title,
      totalCollected: parseFloat(row.totalcollected || 0)
    })) : [];

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

    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentification requise',
        message: 'Vous devez être connecté pour accéder à vos cagnottes'
      });
    }

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
    console.error('Erreur getAll pulls:', err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: err.message
    });
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
    const {
      amount,
      message,
      phoneNumber,
      paymentMethod = 'orange_money',
      mobileOption,
      isAnonymous = false
    } = req.body;
    const userId = req.user.id;

    // Validation des données
    if (!amount || !phoneNumber) {
      return res.status(400).json({
        error: "Montant et numéro de téléphone requis"
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: "Le montant doit être supérieur à 0"
      });
    }

    // Vérifier que la cagnotte existe
    const pull = await Pull.findByPk(pullId);
    if (!pull) {
      return res.status(404).json({ error: "Cagnotte non trouvée" });
    }

    // Vérifier que la cagnotte est active
    if (pull.status !== 'active') {
      return res.status(400).json({
        error: "Cette cagnotte n'accepte plus de contributions"
      });
    }

    // Générer une référence unique pour la transaction
    const transactionRef = `KOTIZ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Déterminer la méthode de paiement finale
    let finalPaymentMethod = paymentMethod;
    if (paymentMethod === "mobile_money") {
      finalPaymentMethod = mobileOption || "moov_money";
    }

    // 🔧 POINT D'INTÉGRATION API PAIEMENT
    const paymentService = (await import('../services/paymentService.js')).default;
    const paymentData = {
      amount: Math.round(parseFloat(amount) * 100), // Convertir en centimes
      currency: pull.currency || 'XOF',
      phoneNumber: phoneNumber,
      paymentMethod: finalPaymentMethod,
      reference: transactionRef,
      description: `Contribution à la cagnotte: ${pull.title}`,
      callbackUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/v1/webhooks/payment`,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-status/${transactionRef}`
    };

    console.log('🚀 Initiation du paiement pour la contribution:', paymentData);

    // Initier le paiement via l'API externe
    const paymentResult = await paymentService.initiatePayment(paymentData);

    if (!paymentResult.success) {
      return res.status(400).json({
        error: 'Erreur lors de l\'initiation du paiement',
        details: paymentResult.error,
        code: 'PAYMENT_INITIATION_FAILED'
      });
    }

    // Créer la contribution avec statut "pending"
    const contribution = await Contribution.create({
      userId: userId,
      pullId,
      amount: parseFloat(amount),
      message: message || '',
      anonymous: isAnonymous,
      status: 'pending' // En attente de confirmation de paiement
    });

    // Créer l'enregistrement de transaction
    const Transaction = (await import('../models/Transaction.js')).default;
    const transaction = await Transaction.create({
      contributionId: contribution.id,
      amount: parseFloat(amount),
      currency: pull.currency || 'XOF',
      status: 'pending',
      transactionReference: transactionRef,
      providerReference: paymentResult.transactionId,
      providerResponse: JSON.stringify(paymentResult.providerResponse)
    });

    console.log('✅ Contribution créée avec succès:', contribution.id);

    // Réponse avec les informations de paiement
    res.status(201).json({
      success: true,
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        currency: pull.currency,
        status: contribution.status,
        reference: transactionRef,
        createdAt: contribution.createdAt
      },
      payment: {
        transactionId: paymentResult.transactionId,
        paymentUrl: paymentResult.paymentUrl,
        status: paymentResult.status,
        reference: paymentResult.reference,
        instructions: `Un SMS de confirmation va être envoyé au ${phoneNumber}. Suivez les instructions pour finaliser le paiement.`
      },
      // URL de redirection après paiement
      statusUrl: paymentResult.paymentUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-status/${transactionRef}`,
      message: "Contribution initiée. Redirection vers le suivi du paiement..."
    });

  } catch (err) {
    console.error('❌ Erreur lors de la création de contribution:', err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: err.message
    });
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

    // Récupérer la cagnotte sans restriction pour vérifier la propriété d'abord
    const pull = await Pull.findOne({
      where: { id: parseInt(id) },
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

    // Vérifier si l'utilisateur est propriétaire
    const isAuthenticated = !!req.user;
    const isOwner = isAuthenticated && req.user.id === pull.userId;

    // Nouvelle logique d'accès simplifiée :
    // - Propriétaire : accès complet à toutes ses cagnottes
    // - Non-propriétaire : accès à toutes les cagnottes avec masquage selon le type
    // - Seule exception : cagnottes publiques fermées sont bloquées pour les non-propriétaires
    
    if (isOwner) {
      console.log(`✅ Accès propriétaire complet pour la cagnotte ${id} (${pull.type}, ${pull.status})`);
    } else if (pull.type === 'private' && pull.status !== 'active') {
      // Bloquer uniquement les cagnottes privées fermées pour les non-propriétaires
      console.log(`❌ Accès refusé à la cagnotte privée fermée ${id}`);
      return res.status(404).json({
        success: false,
        error: "Cagnotte non trouvée"
      });
    } else {
      // Autoriser l'accès à toutes les autres cagnottes (publiques actives + publiques fermées + privées actives)
      console.log(`✅ Accès ${pull.type === 'private' ? 'limité' : 'complet'} autorisé pour la cagnotte ${pull.type} ${id}`);
    }

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
    if (pull.type === 'private' && !isOwner) {
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
// 💰 RETRAIT DES FONDS D'UNE CAGNOTTE
// ====================
export const withdrawFunds = async (req, res) => {
 try {
   const { id } = req.params;
   const { amount, paymentMethodId, reason } = req.body;
   const userId = req.user.id;

   console.log(`=== RETRAIT CAGNOTTE ${id} ===`);
   console.log('Utilisateur:', userId, 'Montant:', amount);

   // Validation
   if (!amount || amount <= 0) {
     return res.status(400).json({
       success: false,
       error: "Montant de retrait invalide"
     });
   }

   // Vérifier que la cagnotte existe et appartient à l'utilisateur
   const pull = await Pull.findOne({
     where: {
       id: parseInt(id),
       userId: userId
     },
     include: [{
       model: Contribution,
       as: 'contributions',
       where: { status: 'completed' },
       required: false
     }]
   });

   if (!pull) {
     return res.status(404).json({
       success: false,
       error: "Cagnotte non trouvée ou accès non autorisé"
     });
   }

   // VÉRIFICATION KYC : L'utilisateur doit avoir une vérification KYC approuvée
   const { Kyc } = db;
   const approvedKyc = await Kyc.findOne({
     where: {
       userId: userId,
       isActive: true,
       statutVerification: 'APPROUVE'
     }
   });

   if (!approvedKyc) {
     return res.status(403).json({
       success: false,
       error: "Vérification d'identité requise",
       message: "Vous devez soumettre et faire valider vos documents d'identité (KYC) avant de pouvoir retirer des fonds.",
       kycRequired: true
     });
   }

   // Vérifier les conditions de retrait
   const totalCollected = pull.contributions?.reduce((sum, contrib) => {
     return sum + parseFloat(contrib.amount || 0);
   }, 0) || 0;

   const isGoalReached = totalCollected >= parseFloat(pull.goalAmount);
   const isDeadlinePassed = pull.deadline && new Date() > new Date(pull.deadline);
   const isClosed = pull.status === 'closed';

   if (!isClosed && !isGoalReached && !isDeadlinePassed) {
     return res.status(400).json({
       success: false,
       error: "Conditions de retrait non remplies. La cagnotte doit être fermée, l'objectif atteint ou la date limite dépassée."
     });
   }

   // Calculer le montant disponible (total collecté - retraits précédents)
   // Pour simplifier, on considère que currentAmount représente le solde disponible
   const availableAmount = parseFloat(pull.currentAmount || 0);

   if (parseFloat(amount) > availableAmount) {
     return res.status(400).json({
       success: false,
       error: `Montant demandé (${amount}) supérieur au solde disponible (${availableAmount})`
     });
   }

   // Créer la transaction de retrait
   const withdrawalTransaction = await Transaction.create({
     contributionId: null, // Pas lié à une contribution spécifique
     paymentMethodId: null, // Les retraits ne sont pas liés à une méthode de paiement spécifique
     transactionReference: `WD-${Date.now()}-${id}`,
     amount: parseFloat(amount),
     currency: pull.currency,
     status: 'completed', // Retrait immédiat
     providerReference: `withdrawal-${id}-${Date.now()}`,
     providerResponse: {
       type: 'withdrawal',
       pullId: id,
       reason: reason || 'Retrait par le propriétaire'
     },
     metadata: {
       pullId: id,
       withdrawal: true,
       reason: reason
     }
   });

   // Mettre à jour le solde de la cagnotte
   pull.currentAmount = availableAmount - parseFloat(amount);
   await pull.save();

   // Créer une notification pour l'utilisateur
   const owner = await User.findByPk(userId);
   if (owner && owner.email) {
     try {
       const subject = emailContent.subjects.withdrawalConfirmation.replace('{{pullTitle}}', pull.title);
       const template = emailContent.templates.withdrawalConfirmation;
       const variables = {
         ownerName: owner.name,
         amount: amount,
         pullTitle: pull.title,
         transactionId: withdrawalTransaction.transactionReference
       };
       await sendEmail(owner.email, subject, template, variables);
     } catch (emailError) {
       console.error('Error sending withdrawal confirmation email:', emailError);
     }
   }

   console.log(`✅ Retrait de ${amount} ${pull.currency} effectué pour la cagnotte ${id}`);

   res.json({
     success: true,
     message: "Retrait effectué avec succès",
     withdrawal: {
       id: withdrawalTransaction.id,
       amount: withdrawalTransaction.amount,
       currency: withdrawalTransaction.currency,
       transactionReference: withdrawalTransaction.transactionReference,
       createdAt: withdrawalTransaction.createdAt
     },
     remainingBalance: pull.currentAmount
   });

 } catch (err) {
   console.error(`❌ Erreur lors du retrait de la cagnotte ${req.params.id}:`, err);
   res.status(500).json({
     success: false,
     error: "Erreur lors du retrait",
     details: err.message
   });
 }
};

// ====================
// 📋 RÉCUPÉRER LES RETRAITS D'UNE CAGNOTTE
// ====================
export const getWithdrawalsByPullId = async (req, res) => {
 try {
   const { id } = req.params;
   const userId = req.user.id;

   console.log(`=== RÉCUPÉRATION RETRAITS CAGNOTTE ${id} ===`);

   // Vérifier que la cagnotte appartient à l'utilisateur
   const pull = await Pull.findOne({
     where: {
       id: parseInt(id),
       userId: userId
     }
   });

   if (!pull) {
     return res.status(404).json({
       success: false,
       error: "Cagnotte non trouvée ou accès non autorisé"
     });
   }

   // Récupérer les transactions de retrait
   const withdrawals = await Transaction.findAll({
     where: {
       // Filtrer par metadata.withdrawal = true et pullId
       [Op.and]: [
         sequelize.literal(`JSON_EXTRACT(metadata, '$.withdrawal') = true`),
         sequelize.literal(`JSON_EXTRACT(metadata, '$.pullId') = ${id}`)
       ]
     },
     order: [['createdAt', 'DESC']]
   });

   console.log(`✅ ${withdrawals.length} retraits récupérés pour la cagnotte ${id}`);

   res.json({
     success: true,
     data: withdrawals,
     message: `${withdrawals.length} retraits trouvés`
   });

 } catch (err) {
   console.error(`❌ Erreur lors de la récupération des retraits de la cagnotte ${req.params.id}:`, err);
   res.status(500).json({
     success: false,
     error: "Erreur lors de la récupération des retraits",
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

    // Vérifier que la cagnotte existe (active ou fermée)
    const pull = await Pull.findOne({
      where: {
        id: parseInt(id)
      }
    });

    if (!pull) {
      return res.status(404).json({
        success: false,
        error: "Cagnotte non trouvée"
      });
    }

    // Vérifier les droits d'accès
    const isAuthenticated = !!req.user;
    const isOwner = isAuthenticated && req.user.id === pull.userId;
    const isPrivate = pull.type === 'private';
    const isClosed = pull.status === 'closed';

    // Pour les cagnottes privées, seuls les propriétaires peuvent voir les contributions
    if (isPrivate && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé - Cette cagnotte est privée"
      });
    }

    // Pour les cagnottes privées, seuls les propriétaires peuvent voir les contributions
    if (isPrivate && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "Accès refusé - Cette cagnotte est privée"
      });
    }

    // Les propriétaires peuvent toujours voir les contributions de leurs cagnottes (même fermées)
    // Les cagnottes publiques fermées permettent à tout le monde de voir les contributions finales

    console.log(`✅ Accès autorisé aux contributions de la cagnotte ${pull.type} ${pull.status} ${id}`);

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
