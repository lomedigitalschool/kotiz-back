const { Pull, Contribution } = require('../models');

exports.create = async (req, res) => {
  try {
    const newPull = await Pull.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(newPull);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const pulls = await Pull.findAll({ include: [Contribution] });
  res.json(pulls);
};

exports.getOne = async (req, res) => {
  const singlePull = await Pull.findByPk(req.params.id, { include: [Contribution] });
  if (!singlePull) return res.status(404).json({ message: "Pull introuvable" });
  res.json(singlePull);
};

exports.update = async (req, res) => {
  const singlePull = await Pull.findByPk(req.params.id);
  if (!singlePull) return res.status(404).json({ message: "Pull introuvable" });

  await singlePull.update(req.body);
  res.json({ message: "Pull mise à jour", pull: singlePull });
};

exports.remove = async (req, res) => {
  await Pull.destroy({ where: { id: req.params.id } });
  res.json({ message: "Pull supprimée" });
};
