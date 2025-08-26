const { Notification } = require('../models');

exports.getAll = async (req, res) => {
  const notifications = await Notification.findAll({ where: { userId: req.user.id } });
  res.json(notifications);
};

exports.markAsRead = async (req, res) => {
  const notif = await Notification.findByPk(req.params.id);
  if (!notif) return res.status(404).json({ message: "Notification introuvable" });

  notif.isRead = true;
  await notif.save();
  res.json({ message: "Notification lue", notif });
};
