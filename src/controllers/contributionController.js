// Contrôleur des contributions
import db from '../models/index.js';
const { Contribution, Pull, Transaction } = db;
import { Op, QueryTypes } from 'sequelize';
import paymentService from '../services/paymentService.js';
import sequelize from '../config/database.js';
import { emitRealtimeUpdate } from '../server.js';

export const getStats = async (req, res) => {
  try {

    // Total collecté
    const [totalResult] = await sequelize.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = \'completed\'',
      { type: QueryTypes.SELECT }
    );
    const totalCollected = parseFloat(totalResult.total) || 0;

    // Ce mois
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [monthlyResult] = await sequelize.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = \'completed\' AND "createdAt" >= $1',
      {
        bind: [currentMonth],
        type: QueryTypes.SELECT
      }
    );
    const monthlyAmount = parseFloat(monthlyResult.total) || 0;

    const monthlyCount = await Contribution.count({
      where: {
        status: 'completed',
        createdAt: {
          [Op.gte]: currentMonth
        }
      }
    });

    res.json({
      totalCollected: totalCollected || 0,
      monthlyAmount: monthlyAmount || 0,
      monthlyCount: monthlyCount || 0
    });
  } catch (error) {
    console.error('Erreur stats contributions:', error);
    res.status(500).json({
      totalCollected: 0,
      monthlyAmount: 0,
      monthlyCount: 0,
      error: error.message
    });
  }
};

// 💳 POINT D'INTÉGRATION PRINCIPAL - CRÉER UNE CONTRIBUTION AVEC PAIEMENT
export const create = async (req, res) => {
  try {
    const {
      pullId,
      amount,
      message,
      phoneNumber,
      paymentMethod = 'orange_money',
      isAnonymous = false
    } = req.body;

    // Validation des données
    if (!pullId || !amount || !phoneNumber) {
      return res.status(400).json({
        error: "Pull ID, montant et numéro de téléphone requis"
      });
    }

    // Vérifier que le pull existe
    const pull = await Pull.findByPk(pullId);
    if (!pull) {
      return res.status(404).json({ message: "Cagnotte introuvable" });
    }

    // Vérifier que la cagnotte est active
    if (pull.status !== 'active') {
      return res.status(400).json({
        message: "Cette cagnotte n'accepte plus de contributions"
      });
    }

    // Générer une référence unique pour la transaction
    const transactionRef = `KOTIZ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 🔧 POINT D'INTÉGRATION API PAIEMENT
    // Préparer les données de paiement
    const paymentData = {
      amount: Math.round(parseFloat(amount) * 100), // Convertir en centimes
      currency: pull.currency || 'XOF',
      phoneNumber: phoneNumber,
      paymentMethod: paymentMethod,
      reference: transactionRef,
      description: `Contribution à la cagnotte: ${pull.title}`,
      callbackUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/webhooks/payment`,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cagnotte/${pullId}`
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
      userId: req.user.id,
      pullId,
      amount: parseFloat(amount),
      message: message || '',
      isAnonymous: isAnonymous,
      status: 'pending', // En attente de confirmation de paiement
      paymentReference: transactionRef,
      phoneNumber: phoneNumber,
      paymentMethod: paymentMethod
    });

    // Créer l'enregistrement de transaction
    const transaction = await Transaction.create({
      contributionId: contribution.id,
      userId: req.user.id,
      amount: parseFloat(amount),
      currency: pull.currency || 'XOF',
      status: 'pending',
      paymentMethod: paymentMethod,
      phoneNumber: phoneNumber,
      reference: transactionRef,
      providerTransactionId: paymentResult.transactionId,
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
      message: "Contribution initiée. Veuillez finaliser le paiement via votre téléphone."
    });

  } catch (err) {
    console.error('❌ Erreur lors de la création de contribution:', err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: err.message
    });
  }
};

// 🔄 WEBHOOK POUR TRAITER LES NOTIFICATIONS DE PAIEMENT
export const handlePaymentWebhook = async (req, res) => {
  try {
    console.log('📨 Webhook de paiement reçu:', req.body);

    // Traiter le webhook via le service de paiement
    const webhookResult = await paymentService.processWebhook(req.body);

    if (!webhookResult.success) {
      return res.status(400).json({ error: 'Webhook invalide' });
    }

    // Trouver la contribution correspondante
    const contribution = await Contribution.findOne({
      where: { paymentReference: webhookResult.reference },
      include: [{ model: Pull, as: 'Pull' }]
    });

    if (!contribution) {
      console.error('❌ Contribution non trouvée pour la référence:', webhookResult.reference);
      return res.status(404).json({ error: 'Contribution non trouvée' });
    }

    // Mettre à jour le statut selon le résultat du paiement
    if (webhookResult.status === 'completed' || webhookResult.status === 'success') {
      // Paiement réussi
      contribution.status = 'completed';
      await contribution.save();

      // Mettre à jour le montant de la cagnotte
      const pull = contribution.Pull;
      pull.currentAmount = parseFloat(pull.currentAmount) + parseFloat(contribution.amount);
      await pull.save();

      // Mettre à jour la transaction
      await Transaction.update(
        {
          status: 'completed',
          completedAt: new Date(),
          providerResponse: JSON.stringify(req.body)
        },
        { where: { contributionId: contribution.id } }
      );

      // Émettre un événement temps réel
      emitRealtimeUpdate('contribution-completed', {
        contributionId: contribution.id,
        pullId: pull.id,
        amount: contribution.amount,
        contributorName: contribution.contributorName || 'Anonyme',
        pullTitle: pull.title,
        timestamp: new Date()
      });

      console.log('✅ Contribution confirmée:', contribution.id);

    } else if (webhookResult.status === 'failed' || webhookResult.status === 'cancelled') {
      // Paiement échoué
      contribution.status = 'failed';
      await contribution.save();

      // Mettre à jour la transaction
      await Transaction.update(
        {
          status: 'failed',
          failedAt: new Date(),
          providerResponse: JSON.stringify(req.body)
        },
        { where: { contributionId: contribution.id } }
      );

      console.log('❌ Contribution échouée:', contribution.id);
    }

    res.status(200).json({ success: true, processed: true });

  } catch (error) {
    console.error('❌ Erreur lors du traitement du webhook:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du webhook' });
  }
};

// 🔍 VÉRIFIER LE STATUT D'UNE CONTRIBUTION
export const checkContributionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const contribution = await Contribution.findOne({
      where: { id, userId: req.user.id },
      include: [
        { model: Pull, as: 'Pull' },
        { model: Transaction, as: 'Transaction' }
      ]
    });

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution non trouvée' });
    }

    // Si la contribution est en attente, vérifier le statut auprès du fournisseur
    if (contribution.status === 'pending' && contribution.Transaction) {
      const statusResult = await paymentService.checkPaymentStatus(
        contribution.Transaction.providerTransactionId
      );

      if (statusResult.success && statusResult.status !== contribution.status) {
        // Mettre à jour le statut si nécessaire
        // (La logique complète serait dans le webhook, ceci est juste pour info)
        console.log('ℹ️ Statut mis à jour depuis le fournisseur:', statusResult.status);
      }
    }

    res.json({
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        status: contribution.status,
        reference: contribution.paymentReference,
        createdAt: contribution.createdAt
      },
      cagnotte: {
        id: contribution.Pull.id,
        title: contribution.Pull.title
      },
      transaction: contribution.Transaction ? {
        status: contribution.Transaction.status,
        paymentMethod: contribution.Transaction.paymentMethod
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
};

export const getMyContributions = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentification requise',
        message: 'Vous devez être connecté pour accéder à vos contributions'
      });
    }

    const contributions = await Contribution.findAll({
      where: { userId: req.user.id },
      include: [{ model: Pull, as: 'Pull' }] // Pour renvoyer aussi le pull lié
    });
    res.json(contributions);
  } catch (err) {
    console.error('Erreur getMyContributions:', err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: err.message
    });
  }
};

// ====================
// 🎭 CRÉER UNE CONTRIBUTION ANONYME (SANS COMPTE)
// ====================
export const createAnonymous = async (req, res) => {
  try {
    const { pullId } = req.params; // Récupérer pullId depuis l'URL
    const {
      amount,
      contributorName,
      contributorEmail,
      message,
      phoneNumber,
      paymentMethod = 'orange_money'
    } = req.body;

    console.log('🎭 DEBUG - req.params:', req.params);
    console.log('🎭 DEBUG - req.body:', req.body);
    console.log('🎭 Contribution anonyme initiée:', { pullId, amount, contributorName, phoneNumber });

    // Validation des données
    if (!pullId || !amount || !phoneNumber) {
      console.log('❌ Validation échouée:', { pullId, amount, phoneNumber });
      return res.status(400).json({
        success: false,
        error: "ID de cagnotte, montant et numéro de téléphone requis",
        debug: { pullId, amount, phoneNumber }
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Le montant doit être supérieur à 0"
      });
    }

    // Vérifier que la cagnotte existe et est publique/active
    const pull = await Pull.findOne({
      where: {
        id: pullId,
        status: 'active',
        type: 'public'
      }
    });

    if (!pull) {
      return res.status(404).json({
        success: false,
        error: "Cagnotte non trouvée ou non accessible"
      });
    }

    // Générer une référence unique pour la transaction
    const transactionRef = `KOTIZ-ANON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 🔧 POINT D'INTÉGRATION API PAIEMENT
    // Préparer les données de paiement
    const paymentData = {
      amount: Math.round(parseFloat(amount) * 100), // Convertir en centimes
      currency: pull.currency || 'XOF',
      phoneNumber: phoneNumber,
      paymentMethod: paymentMethod,
      reference: transactionRef,
      description: `Contribution anonyme à: ${pull.title}`,
      callbackUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/v1/webhooks/payment`,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cagnotte/${pullId}?contribution=success`
    };

    console.log('🚀 Initiation du paiement anonyme:', paymentData);

    // Initier le paiement via l'API externe
    const paymentResult = await paymentService.initiatePayment(paymentData);

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Erreur lors de l\'initiation du paiement',
        details: paymentResult.error,
        code: 'PAYMENT_INITIATION_FAILED'
      });
    }

    // Créer la contribution anonyme avec statut "pending"
    const contribution = await Contribution.create({
      userId: null, // Contribution anonyme
      pullId,
      amount: parseFloat(amount),
      currency: pull.currency || 'XOF',
      status: 'pending', // En attente de confirmation de paiement
      paymentReference: transactionRef,
      contributorName: contributorName || 'Anonyme',
      contributorEmail: contributorEmail || null,
      message: message || null,
      phoneNumber: phoneNumber,
      paymentMethod: paymentMethod
    });

    // Créer l'enregistrement de transaction (sans userId pour les anonymes)
    const transaction = await Transaction.create({
      contributionId: contribution.id,
      userId: null, // Transaction anonyme
      amount: parseFloat(amount),
      currency: pull.currency || 'XOF',
      status: 'pending',
      paymentMethod: paymentMethod,
      phoneNumber: phoneNumber,
      reference: transactionRef,
      providerTransactionId: paymentResult.transactionId,
      providerResponse: JSON.stringify(paymentResult.providerResponse)
    });

    console.log('✅ Contribution anonyme créée avec succès:', contribution.id);

    // Réponse avec les informations de paiement
    res.status(201).json({
      success: true,
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        currency: pull.currency,
        status: contribution.status,
        reference: transactionRef,
        contributorName: contribution.contributorName,
        createdAt: contribution.createdAt
      },
      payment: {
        transactionId: paymentResult.transactionId,
        paymentUrl: paymentResult.paymentUrl,
        status: paymentResult.status,
        reference: paymentResult.reference,
        instructions: `Un SMS de confirmation va être envoyé au ${phoneNumber}. Suivez les instructions pour finaliser le paiement.`
      },
      message: "Contribution anonyme initiée. Veuillez finaliser le paiement via votre téléphone.",
      redirectUrl: paymentResult.paymentUrl
    });

  } catch (err) {
    console.error('❌ Erreur lors de la création de contribution anonyme:', err);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: err.message
    });
  }
};

export default { getStats, create, handlePaymentWebhook, checkContributionStatus, getMyContributions, createAnonymous };
