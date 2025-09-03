const { Report, User, Pull, Contribution } = require('../models');

// Créer un signalement
exports.createReport = async (req, res) => {
  try {
    const { type, targetId, reason, description } = req.body;
    const reporterId = req.user.id;

    let reportData = {
      reporterId,
      type,
      reason,
      description,
      status: 'pending'
    };

    if (type === 'pull') {
      reportData.pullId = targetId;
    } else if (type === 'contribution') {
      reportData.contributionId = targetId;
    }

    const report = await Report.create(reportData);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les signalements (admin)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
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

// Traiter un signalement (admin)
exports.handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminResponse } = req.body;

    const report = await Report.findByPk(id);
    if (!report) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    if (action === 'resolve') {
      report.status = 'resolved';
      report.adminResponse = adminResponse;
      report.resolvedAt = new Date();
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
      report.adminResponse = adminResponse;
      report.resolvedAt = new Date();
    }

    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bloquer un utilisateur signalé
exports.blockReportedUser = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id, {
      include: [
        { model: Pull, as: 'pull', include: [{ model: User, as: 'owner' }] },
        { model: Contribution, as: 'contribution', include: [{ model: User, as: 'user' }] }
      ]
    });

    if (!report) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    let userToBlock;
    if (report.type === 'pull' && report.pull) {
      userToBlock = report.pull.owner;
    } else if (report.type === 'contribution' && report.contribution) {
      userToBlock = report.contribution.user;
    }

    if (userToBlock) {
      userToBlock.isBlocked = true;
      await userToBlock.save();

      report.status = 'resolved';
      report.adminResponse = 'Utilisateur bloqué suite au signalement';
      report.resolvedAt = new Date();
      await report.save();

      res.json({ message: 'Utilisateur bloqué', user: userToBlock });
    } else {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};