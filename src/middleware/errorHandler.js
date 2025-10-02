// src/middleware/errorHandler.js

/**
 * 🌐 Middleware global de gestion des erreurs
 * - Centralise toutes les erreurs Express
 * - Formate la réponse JSON
 * - Gère les cas Sequelize, Joi, Firebase, etc.
 * * NOTE: Cette fonction doit accepter quatre arguments (err, req, res, next) 
 * pour qu'Express la reconnaisse comme gestionnaire d'erreurs.
 */
function errorHandler(err, req, res, next) {
    console.error("❌ Erreur capturée par errorHandler:", err);

    // Déterminer le code HTTP. On utilise res.statusCode pour préserver un statut 
    // déjà défini par un autre middleware (ex: 404), sinon on utilise l'erreur (ou 500).
    const initialStatusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let statusCode = err.status || err.statusCode || initialStatusCode;
    
    // S'assurer que le statut n'est pas 200 si une erreur est survenue
    res.status(statusCode);

    // Construire la réponse standardisée
    const errorResponse = {
        success: false,
        status: statusCode,
        message: err.message || "Erreur serveur interne",
    };

    // --- Gestion des Erreurs Spécifiques (Développement) ---
    if (process.env.NODE_ENV === "development") {
        errorResponse.stack = err.stack;
        
        // Sequelize (erreurs de validation ou de contrainte unique)
        if (err.name === "SequelizeValidationError" && err.errors) {
            errorResponse.errors = err.errors.map(e => e.message);
            // 400 Bad Request pour les erreurs de validation
            statusCode = 400;
            errorResponse.status = 400;
            res.status(400); 
        } else if (err.name === "SequelizeUniqueConstraintError" && err.errors) {
            errorResponse.errors = err.errors.map(e => e.message);
             // 409 Conflict pour les erreurs de contrainte unique
            statusCode = 409;
            errorResponse.status = 409;
            res.status(409);
        }

        // Erreurs Firebase (exemple d'erreur d'authentification)
        if (err.code && typeof err.code === 'string' && err.code.startsWith("auth/")) {
            errorResponse.firebaseCode = err.code;
            // 401 Unauthorized pour les erreurs d'authentification
            statusCode = 401;
            errorResponse.status = 401;
            res.status(401);
        }
    }

    res.json(errorResponse);
}


export default errorHandler;
