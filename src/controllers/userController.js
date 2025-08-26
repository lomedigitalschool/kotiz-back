const { User } = require('../models');

exports.getAll = async (req, res) => {
  const users = await User.findAll();
  res.json(users);
};

exports.getOne = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
  res.json(user);
};

exports.update = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  await user.update(req.body);
  res.json({ message: "Utilisateur mis à jour", user });
};

exports.remove = async (req, res) => {
  await User.destroy({ where: { id: req.params.id } });
  res.json({ message: "Utilisateur supprimé" });
};
