// Contrôleur des contributions
const { Contribution, Pull, Transaction } = require('../models');
const paymentService = require('../services/paymentService');

// 💳 POINT D'INTÉGRATION PRINCIPAL - CRÉER UNE CONTRIBUTION AVEC PAIEMENT
exports.create = async (req, res) => {
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
exports.handlePaymentWebhook = async (req, res) => {
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
exports.checkContributionStatus = async (req, res) => {
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

exports.getMyContributions = async (req, res) => {
  try {
    const contributions = await Contribution.findAll({
      where: { userId: req.user.id },
      include: [{ model: Pull, as: 'Pull' }] // Pour renvoyer aussi le pull lié
    });
    res.json(contributions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
