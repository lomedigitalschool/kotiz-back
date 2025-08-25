// Contrôleur des contributions
const { Contribution, Cagnotte } = require('../models');

exports.create = async (req, res) => {
  try {
    const { cagnotteId, amount, message } = req.body;

    const cagnotte = await Cagnotte.findByPk(cagnotteId);
    if (!cagnotte) return res.status(404).json({ message: "Cagnotte introuvable" });

    const contribution = await Contribution.create({
      userId: req.user.id,
      cagnotteId,
      amount,
      message
    });

    res.status(201).json(contribution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyContributions = async (req, res) => {
  const contributions = await Contribution.findAll({ where: { userId: req.user.id } });
  res.json(contributions);
};
