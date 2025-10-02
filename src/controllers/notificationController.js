import db from '../models/index.js';
const { Notification } = db;

export const getAll = async (req, res) => {
  const notifications = await Notification.findAll({ where: { userId: req.user.id } });
  res.json(notifications);
};

export const markAsRead = async (req, res) => {
  const notif = await Notification.findByPk(req.params.id);
  if (!notif) return res.status(404).json({ message: "Notification introuvable" });

  notif.status = 'read';
  notif.read = true; // Pour compatibilité
  await notif.save();
  res.json({ message: "Notification lue", notif });
};

export default { getAll, markAsRead };
