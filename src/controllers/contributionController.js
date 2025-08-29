// Contrôleur des contributions
const { Contribution, Pull } = require('../models');

exports.create = async (req, res) => {
  try {
    const { pullId, amount, message } = req.body;

    // Vérifier que le pull existe
    const pull = await Pull.findByPk(pullId);
    if (!pull) return res.status(404).json({ message: "Pull introuvable" });

    // Créer la contribution
    const contribution = await Contribution.create({
      userId: req.user.id,
      pullId,
      amount,
      message
    });

    // Mettre à jour le currentAmount du Pull
    pull.currentAmount = parseFloat(pull.currentAmount) + parseFloat(amount);
    await pull.save();

    res.status(201).json(contribution);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
