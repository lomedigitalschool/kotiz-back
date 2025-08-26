// Contrôleur des contributions
const { Contribution, pull } = require('../models');

exports.create = async (req, res) => {
  try {
    const { pullId, amount, message } = req.body;

    const pull = await pull.findByPk(pullId);
    if (!pull) return res.status(404).json({ message: "pull introuvable" });

    const contribution = await Contribution.create({
      userId: req.user.id,
      pullId,
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
