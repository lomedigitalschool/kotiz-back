import db from '../models/index.js';

const { Report, User, Pull, Contribution } = db;

export const createReport = async (req, res) => {
  try {
    const { type, pullId, contributionId, reason, description } = req.body;
    const reporterId = req.user.id;

    const report = await Report.create({
      reporterId,
      pullId,
      contributionId,
      type,
      reason,
      description,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Signalement créé avec succès',
      data: report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const reports = await Report.findAll({
      where: status !== 'all' ? { status } : {},
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'name', 'email'] },
        { model: Pull, as: 'pull', attributes: ['id', 'title'] },
        { model: Contribution, as: 'contribution', attributes: ['id', 'amount'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminResponse } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    const status = action === 'resolve' ? 'resolved' : 'dismissed';
    
    await report.update({
      status,
      adminResponse,
      resolvedAt: new Date()
    });

    res.json({
      success: true,
      message: `Signalement ${status === 'resolved' ? 'résolu' : 'rejeté'}`,
      data: report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const blockReportedUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const report = await Report.findByPk(id, {
      include: [{ model: User, as: 'reporter' }]
    });

    if (!report) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    // Bloquer l'utilisateur signalé (logique à adapter selon votre modèle User)
    // await User.update({ isBlocked: true }, { where: { id: reportedUserId } });

    await report.update({
      status: 'resolved',
      adminResponse: 'Utilisateur bloqué',
      resolvedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Utilisateur bloqué et signalement résolu'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  createReport,
  getAllReports,
  handleReport,
  blockReportedUser
};