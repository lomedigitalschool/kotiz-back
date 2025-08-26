const { pull, Contribution } = require('../models');

exports.create = async (req, res) => {
  try {
    const pull = await pull.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(pull);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const pulls = await pull.findAll({ include: [Contribution] });
  res.json(pulls);
};

exports.getOne = async (req, res) => {
  const pull = await pull.findByPk(req.params.id, { include: [Contribution] });
  if (!pull) return res.status(404).json({ message: "pull introuvable" });
  res.json(pull);
};

exports.update = async (req, res) => {
  const pull = await pull.findByPk(req.params.id);
  if (!pull) return res.status(404).json({ message: "pull introuvable" });

  await pull.update(req.body);
  res.json({ message: "pull mise à jour", pull });
};

exports.remove = async (req, res) => {
  await pull.destroy({ where: { id: req.params.id } });
  res.json({ message: "pull supprimée" });
};
