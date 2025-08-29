const { Transaction, Contribution, User, Pull } = require('../models');

// Obtenir toutes les transactions (admin)
exports.getAll = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        {
          model: Contribution,
          as: 'contribution',
          include: [
            { model: User, as: 'contributor' },
            { model: Pull, as: 'pull' }
          ]
        }
      ]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir une transaction spécifique
exports.getOne = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        {
          model: Contribution,
          as: 'contribution',
          include: [
            { model: User, as: 'contributor' },
            { model: Pull, as: 'pull' }
          ]
        }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    // Vérifier si l'utilisateur a le droit de voir cette transaction
    if (req.user.role !== 'admin' && 
        transaction.contribution.userId !== req.user.id && 
        transaction.contribution.pull.userId !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour une transaction (admin seulement)
exports.update = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    // Seul l'admin peut mettre à jour une transaction
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    const updatedTransaction = await transaction.update(req.body);
    res.json(updatedTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer une transaction (admin seulement)
exports.remove = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }

    // Seul l'admin peut supprimer une transaction
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Action non autorisée' });
    }

    await transaction.destroy();
    res.json({ message: 'Transaction supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir les transactions de l'utilisateur connecté
exports.getMine = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        {
          model: Contribution,
          as: 'contribution',
          where: { userId: req.user.id },
          include: [
            { model: Pull, as: 'pull' }
          ]
        }
      ]
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
