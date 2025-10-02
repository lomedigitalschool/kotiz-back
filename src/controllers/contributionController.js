// Contrôleur des contributions
import db from '../models/index.js';
const { Contribution, Pull, Transaction, User } = db;
import { Op, QueryTypes } from 'sequelize';
import paymentService from '../services/paymentService.js';
import notificationService from '../services/notificationService.js';
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
      mobileOption,
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

    // Déterminer la méthode de paiement finale
    let finalPaymentMethod = paymentMethod;
    if (paymentMethod === "mobile_money") {
      finalPaymentMethod = mobileOption || "moov_money";
    }

    // 🔧 POINT D'INTÉGRATION API PAIEMENT
    // Préparer les données de paiement
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
      userId: req.user.id,
      pullId,
      amount: parseFloat(amount),
      message: message || '',
      anonymous: isAnonymous,
      status: 'pending' // En attente de confirmation de paiement
    });

    // Créer l'enregistrement de transaction (sans utiliser le modèle pour éviter le cache)
    const transactionData = {
      contributionId: contribution.id,
      amount: parseFloat(amount),
      currency: pull.currency || 'XOF',
      status: 'pending',
      transactionReference: transactionRef,
      providerReference: paymentResult.transactionId,
      providerResponse: JSON.stringify(paymentResult.providerResponse),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [transaction] = await sequelize.query(
      `INSERT INTO transactions (contributionId, amount, currency, status, transactionReference, providerReference, providerResponse, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, contributionId, paymentMethodId, transactionReference, amount, currency, status, providerReference, providerResponse, metadata, "createdAt", "updatedAt"`,
      {
        bind: [
          transactionData.contributionId,
          transactionData.amount,
          transactionData.currency,
          transactionData.status,
          transactionData.transactionReference,
          transactionData.providerReference,
          transactionData.providerResponse,
          transactionData.createdAt,
          transactionData.updatedAt
        ]
      }
    );

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

// 🔄 WEBHOOK POUR TRAITER LES NOTIFICATIONS DE PAIEMENT
export const handlePaymentWebhook = async (req, res) => {
  try {
    console.log('📨 Webhook SEOMA reçu:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Valider la signature du webhook (si configurée)
    const signature = req.headers['x-seoma-signature'] || req.headers['signature'];
    if (signature && !paymentService.validateWebhookSignature(req.body, signature)) {
      console.error('❌ Signature webhook invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    // Traiter le webhook via le service de paiement
    const webhookResult = await paymentService.processWebhook(req.body);

    if (!webhookResult.success) {
      console.error('❌ Webhook invalide:', webhookResult.error);
      return res.status(400).json({ error: 'Webhook invalide' });
    }

    console.log('🔍 Recherche de la transaction:', webhookResult.reference);

    // Trouver la contribution correspondante via la transaction
    const transaction = await Transaction.findOne({
      where: { 
        [Op.or]: [
          { transactionReference: webhookResult.reference },
          { providerReference: webhookResult.transactionId }
        ]
      },
      include: [{ 
        model: Contribution, 
        as: 'contribution',
        include: [{ model: Pull, as: 'Pull' }]
      }]
    });
    
    const contribution = transaction?.contribution;

    if (!contribution) {
      console.error('❌ Contribution non trouvée pour:', {
        reference: webhookResult.reference,
        transactionId: webhookResult.transactionId
      });
      return res.status(404).json({ error: 'Contribution non trouvée' });
    }

    console.log('✅ Contribution trouvée:', contribution.id, 'Statut actuel:', contribution.status);

    // Éviter le double traitement
    if (contribution.status === 'completed') {
      console.log('⚠️ Contribution déjà traitée, ignoré');
      return res.status(200).json({ success: true, message: 'Déjà traité' });
    }

    // Mettre à jour le statut selon le résultat du paiement
    if (webhookResult.status === 'completed') {
      // Paiement réussi
      contribution.status = 'completed';
      await contribution.save();

      // Mettre à jour le montant de la cagnotte
      const pull = contribution.Pull;
      const newAmount = parseFloat(pull.currentAmount) + parseFloat(contribution.amount);
      pull.currentAmount = newAmount;
      await pull.save();

      // Mettre à jour la transaction
      await Transaction.update(
        {
          status: 'completed',
          providerResponse: JSON.stringify(req.body)
        },
        { where: { contributionId: contribution.id } }
      );

      // 🔔 NOTIFICATIONS - Paiement réussi pour le contributeur
      if (contribution.userId) { // Contribution avec compte utilisateur
        await notificationService.sendNotification({
          userId: contribution.userId,
          type: 'paymentResult',
          data: {
            status: 'success',
            amount: contribution.amount,
            currency: pull.currency,
            cagnotteTitle: pull.title,
            receiptLink: `${process.env.FRONTEND_URL}/receipt/${contribution.id}`
          },
          channels: ['database', 'email']
        });
      }

      // 🔔 NOTIFICATIONS - Nouvelle contribution pour le créateur de la cagnotte
      if (pull.userId) {
        await notificationService.sendNotification({
          userId: pull.userId,
          type: 'newContribution',
          data: {
            amount: contribution.amount,
            currency: pull.currency,
            cagnotteTitle: pull.title,
            user: contribution.userId ? null : contribution.contributorName // Anonyme ou nom
          },
          channels: ['database', 'email']
        });
      }

      // Vérifier si l'objectif est atteint
      if (newAmount >= parseFloat(pull.goalAmount)) {
        // Notifier tous les contributeurs de cette cagnotte
        const allContributions = await Contribution.findAll({
          where: { pullId: pull.id, status: 'completed' },
          attributes: ['userId'],
          group: ['userId']
        });

        for (const contrib of allContributions) {
          if (contrib.userId) {
            await notificationService.sendNotification({
              userId: contrib.userId,
              type: 'goalReached',
              data: {
                cagnotteTitle: pull.title,
                goalAmount: pull.goalAmount,
                currency: pull.currency
              },
              channels: ['database', 'email']
            });
          }
        }
      }

      // Émettre un événement temps réel
      emitRealtimeUpdate('contribution-completed', {
        contributionId: contribution.id,
        pullId: pull.id,
        amount: contribution.amount,
        contributorName: contribution.contributorName || (contribution.anonymous ? 'Anonyme' : 'Contributeur'),
        pullTitle: pull.title,
        newTotal: newAmount,
        timestamp: new Date()
      });

      console.log('✅ Contribution confirmée:', contribution.id, 'Nouveau total cagnotte:', newAmount);

    } else if (webhookResult.status === 'failed') {
      // Paiement échoué
      contribution.status = 'failed';
      await contribution.save();

      // Mettre à jour la transaction
      await Transaction.update(
        {
          status: 'failed',
          providerResponse: JSON.stringify(req.body)
        },
        { where: { contributionId: contribution.id } }
      );

      // 🔔 NOTIFICATIONS - Paiement échoué pour le contributeur
      if (contribution.userId) {
        await notificationService.sendNotification({
          userId: contribution.userId,
          type: 'paymentResult',
          data: {
            status: 'failed',
            amount: contribution.amount,
            currency: contribution.Pull.currency,
            cagnotteTitle: contribution.Pull.title,
            retryLink: `${process.env.FRONTEND_URL}/cagnotte/${contribution.pullId}`
          },
          channels: ['database', 'email']
        });
      }

      console.log('❌ Contribution échouée:', contribution.id);
    } else {
      console.log('⏳ Statut intermédiaire:', webhookResult.status, '- Aucune action');
    }

    res.status(200).json({ 
      success: true, 
      processed: true,
      contributionId: contribution.id,
      status: contribution.status
    });

  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du webhook' });
  }
};

// 🔍 VÉRIFIER LE STATUT D'UNE CONTRIBUTION
export const checkContributionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trouver la contribution
    const contribution = await Contribution.findOne({
      where: { id },
      include: [
        { model: Pull, as: 'Pull' },
        { model: Transaction, as: 'transaction' }
      ]
    });

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution non trouvée' });
    }

    // Si la contribution est déjà complétée, retourner le statut
    if (contribution.status === 'completed') {
      return res.json({
        success: true,
        status: 'completed',
        contribution: {
          id: contribution.id,
          amount: contribution.amount,
          status: contribution.status,
          createdAt: contribution.createdAt
        }
      });
    }

    // Si la contribution est en attente, vérifier le statut auprès du fournisseur
    if (contribution.status === 'pending' && contribution.transaction) {
      const paymentStatus = await paymentService.checkPaymentStatus(
        contribution.transaction.providerReference
      );

      if (paymentStatus.success) {
        // Mettre à jour le statut si nécessaire
        if (paymentStatus.status === 'Paid' || paymentStatus.status === 'completed') {
          contribution.status = 'completed';
          await contribution.save();

          // Mettre à jour le montant de la cagnotte
          const pull = contribution.Pull;
          pull.currentAmount = parseFloat(pull.currentAmount) + parseFloat(contribution.amount);
          await pull.save();

          // Mettre à jour la transaction
          await Transaction.update(
            { status: 'completed' },
            { where: { contributionId: contribution.id } }
          );

          // Émettre un événement temps réel
          emitRealtimeUpdate('contribution-completed', {
            contributionId: contribution.id,
            pullId: pull.id,
            amount: contribution.amount,
            timestamp: new Date()
          });
        }
      }
    }

    res.json({
      success: true,
      status: contribution.status,
      contribution: {
        id: contribution.id,
        amount: contribution.amount,
        status: contribution.status,
        createdAt: contribution.createdAt
      },
      transaction: contribution.transaction ? {
        id: contribution.transaction.id,
        status: contribution.transaction.status,
        providerReference: contribution.transaction.providerReference
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
};

// 📋 OBTENIR MES CONTRIBUTIONS
export const getMyContributions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const contributions = await Contribution.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        { 
          model: Pull, 
          as: 'Pull',
          attributes: ['id', 'title', 'currency', 'imageUrl']
        },
        {
          model: Transaction,
          as: 'transaction',
          attributes: ['id', 'status', 'paymentMethodId']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      contributions: contributions.rows,
      pagination: {
        total: contributions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(contributions.count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des contributions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des contributions' });
  }
};

// 🎭 CRÉER UNE CONTRIBUTION ANONYME (SANS COMPTE)
export const createAnonymous = async (req, res) => {
  try {
    const { pullId } = req.params;
    const {
      amount,
      contributorName,
      contributorEmail,
      message,
      phoneNumber,
      paymentMethod = 'orange_money',
      mobileOption
    } = req.body;

    console.log('🎭 Contribution anonyme initiée:', { pullId, amount, contributorName, phoneNumber });

    // Validation des données
    if (!pullId || !amount || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "ID de cagnotte, montant et numéro de téléphone requis"
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

    // Déterminer la méthode de paiement finale
    let finalPaymentMethod = paymentMethod;
    if (paymentMethod === "mobile_money") {
      finalPaymentMethod = mobileOption || "moov_money";
    }

    // 🔧 POINT D'INTÉGRATION API PAIEMENT
    const paymentData = {
      amount: Math.round(parseFloat(amount) * 100),
      currency: pull.currency || 'XOF',
      phoneNumber: phoneNumber,
      paymentMethod: finalPaymentMethod,
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
      status: 'pending',
      contributorName: contributorName || 'Anonyme',
      contributorEmail: contributorEmail || null,
      message: message || null,
      anonymous: true
    });

    // Créer l'enregistrement de transaction (sans utiliser le modèle pour éviter le cache)
    const transactionData = {
      contributionId: contribution.id,
      amount: parseFloat(amount),
      currency: pull.currency || 'XOF',
      status: 'pending',
      transactionReference: transactionRef,
      providerReference: paymentResult.transactionId,
      providerResponse: JSON.stringify(paymentResult.providerResponse),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [transaction] = await sequelize.query(
      `INSERT INTO transactions (contributionId, amount, currency, status, transactionReference, providerReference, providerResponse, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, contributionId, paymentMethodId, transactionReference, amount, currency, status, providerReference, providerResponse, metadata, "createdAt", "updatedAt"`,
      {
        bind: [
          transactionData.contributionId,
          transactionData.amount,
          transactionData.currency,
          transactionData.status,
          transactionData.transactionReference,
          transactionData.providerReference,
          transactionData.providerResponse,
          transactionData.createdAt,
          transactionData.updatedAt
        ]
      }
    );

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