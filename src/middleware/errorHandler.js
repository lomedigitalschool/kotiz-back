// Middleware de gestion d'erreurs
/**
 * 🌐 Middleware global de gestion des erreurs
 * - Centralise toutes les erreurs Express
 * - Formate la réponse JSON
 * - Gère les cas Sequelize, Joi, Firebase, etc.
 */
function errorHandler(err, req, res, next) {
  console.error("❌ Erreur capturée par errorHandler:", err);

  // Déterminer le code HTTP
  const statusCode = err.status || err.statusCode || 500;

  // Construire la réponse standardisée
  const errorResponse = {
    success: false,
    status: statusCode,
    message: err.message || "Erreur serveur interne",
  };

  // Ajouter des détails utiles en mode développement
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;

    // Sequelize (erreurs de validation ou de contrainte unique)
    if (err.name === "SequelizeValidationError") {
      errorResponse.errors = err.errors.map(e => e.message);
    }
    if (err.name === "SequelizeUniqueConstraintError") {
      errorResponse.errors = err.errors.map(e => e.message);
    }

    // Erreurs Firebase
    if (err.code && err.code.startsWith("auth/")) {
      errorResponse.firebaseCode = err.code;
    }
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;
