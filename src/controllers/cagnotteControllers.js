const { Cagnotte, Contribution } = require('../models');

exports.create = async (req, res) => {
  try {
    const cagnotte = await Cagnotte.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(cagnotte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  const cagnottes = await Cagnotte.findAll({ include: [Contribution] });
  res.json(cagnottes);
};

exports.getOne = async (req, res) => {
  const cagnotte = await Cagnotte.findByPk(req.params.id, { include: [Contribution] });
  if (!cagnotte) return res.status(404).json({ message: "Cagnotte introuvable" });
  res.json(cagnotte);
};

exports.update = async (req, res) => {
  const cagnotte = await Cagnotte.findByPk(req.params.id);
  if (!cagnotte) return res.status(404).json({ message: "Cagnotte introuvable" });

  await cagnotte.update(req.body);
  res.json({ message: "Cagnotte mise à jour", cagnotte });
};

exports.remove = async (req, res) => {
  await Cagnotte.destroy({ where: { id: req.params.id } });
  res.json({ message: "Cagnotte supprimée" });
};
