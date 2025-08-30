const { Kyc, User } = require('../models');
const path = require('path');
const fs = require('fs');

/**
 * Contrôleur pour la gestion des vérifications KYC
 * 
 * Fonctionnalités :
 * - Soumission de nouveaux documents KYC
 * - Consultation de l'historique des soumissions
 * - Mise à jour du statut par l'admin
 * - Gestion des différents types de soumissions
 */

class KycController {
  
  /**
   * Soumettre une nouvelle vérification KYC
   * POST /api/v1/kyc/submit
   */
  static async submitKyc(req, res) {
    try {
      const userId = req.user.id;
      const {
        typeSubmission = 'PREMIERE_SOUMISSION',
        typePiece,
        numeroPiece,
        dateExpiration
      } = req.body;

      // Vérifier que les fichiers ont été uploadés
      if (!req.files || !req.files.photoRecto || !req.files.photoVerso) {
        return res.status(400).json({
          error: 'Fichiers manquants',
          message: 'Les photos recto et verso sont obligatoires'
        });
      }

      // Désactiver les anciennes soumissions si c'est une nouvelle tentative
      if (typeSubmission !== 'PREMIERE_SOUMISSION') {
        await Kyc.update(
          { isActive: false },
          { where: { userId, isActive: true } }
        );
      }

      // Créer la nouvelle soumission KYC
      const kycSubmission = await Kyc.create({
        userId,
        typeSubmission,
        typePiece,
        numeroPiece,
        dateExpiration,
        photoRecto: req.files.photoRecto[0].path,
        photoVerso: req.files.photoVerso[0].path,
        statutVerification: 'EN_ATTENTE',
        submissionDate: new Date(),
        isActive: true
      });

      res.status(201).json({
        message: 'Soumission KYC créée avec succès',
        data: {
          id: kycSubmission.id,
          typeSubmission: kycSubmission.typeSubmission,
          statutVerification: kycSubmission.statutVerification,
          submissionDate: kycSubmission.submissionDate
        }
      });

    } catch (error) {
      console.error('Erreur lors de la soumission KYC:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de traiter la soumission KYC'
      });
    }
  }

  /**
   * Obtenir l'historique des soumissions KYC d'un utilisateur
   * GET /api/v1/kyc/history
   */
  static async getKycHistory(req, res) {
    try {
      const userId = req.user.id;

      const kycHistory = await Kyc.findAll({
        where: { userId },
        order: [['submissionDate', 'DESC']],
        attributes: [
          'id',
          'typeSubmission',
          'typePiece',
          'numeroPiece',
          'dateExpiration',
          'statutVerification',
          'commentaireAdmin',
          'submissionDate',
          'isActive',
          'createdAt',
          'updatedAt'
        ]
      });

      res.json({
        message: 'Historique KYC récupéré avec succès',
        data: kycHistory
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique KYC:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer l\'historique KYC'
      });
    }
  }

  /**
   * Obtenir le statut KYC actuel d'un utilisateur
   * GET /api/v1/kyc/status
   */
  static async getKycStatus(req, res) {
    try {
      const userId = req.user.id;

      const activeKyc = await Kyc.findOne({
        where: { userId, isActive: true },
        order: [['submissionDate', 'DESC']],
        attributes: [
          'id',
          'typeSubmission',
          'statutVerification',
          'commentaireAdmin',
          'submissionDate'
        ]
      });

      if (!activeKyc) {
        return res.json({
          message: 'Aucune vérification KYC active',
          data: {
            hasActiveKyc: false,
            status: null
          }
        });
      }

      res.json({
        message: 'Statut KYC récupéré avec succès',
        data: {
          hasActiveKyc: true,
          ...activeKyc.toJSON()
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du statut KYC:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer le statut KYC'
      });
    }
  }

  /**
   * Mettre à jour le statut d'une soumission KYC (Admin uniquement)
   * PUT /api/v1/kyc/:id/status
   */
  static async updateKycStatus(req, res) {
    try {
      const { id } = req.params;
      const { statutVerification, commentaireAdmin } = req.body;

      // Vérifier que le statut est valide
      const validStatuses = ['EN_ATTENTE', 'APPROUVE', 'REFUSE'];
      if (!validStatuses.includes(statutVerification)) {
        return res.status(400).json({
          error: 'Statut invalide',
          message: 'Le statut doit être EN_ATTENTE, APPROUVE ou REFUSE'
        });
      }

      const kycSubmission = await Kyc.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });

      if (!kycSubmission) {
        return res.status(404).json({
          error: 'Soumission non trouvée',
          message: 'Aucune soumission KYC trouvée avec cet ID'
        });
      }

      // Mettre à jour le statut
      await kycSubmission.update({
        statutVerification,
        commentaireAdmin: commentaireAdmin || null
      });

      res.json({
        message: 'Statut KYC mis à jour avec succès',
        data: {
          id: kycSubmission.id,
          statutVerification: kycSubmission.statutVerification,
          commentaireAdmin: kycSubmission.commentaireAdmin,
          user: kycSubmission.user
        }
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut KYC:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de mettre à jour le statut KYC'
      });
    }
  }

  /**
   * Obtenir toutes les soumissions KYC (Admin uniquement)
   * GET /api/v1/kyc/admin/all
   */
  static async getAllKycSubmissions(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) {
        whereClause.statutVerification = status;
      }

      const { count, rows } = await Kyc.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }],
        order: [['submissionDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'id',
          'typeSubmission',
          'typePiece',
          'numeroPiece',
          'statutVerification',
          'submissionDate',
          'isActive',
          'createdAt'
        ]
      });

      res.json({
        message: 'Soumissions KYC récupérées avec succès',
        data: {
          submissions: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des soumissions KYC:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de récupérer les soumissions KYC'
      });
    }
  }
}

module.exports = KycController;