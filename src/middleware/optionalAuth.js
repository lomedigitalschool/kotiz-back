import firebaseAuth from './firebaseAuth.js';

// Middleware d'authentification optionnelle
// Tente d'authentifier l'utilisateur mais n'échoue pas si pas de token
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    // Vérifier s'il y a un token Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, continuer sans authentification
      console.log('🔓 Pas de token d\'authentification - accès public autorisé');
      req.user = null;
      return next();
    }

    // Il y a un token, essayer de l'authentifier
    console.log('🔐 Token détecté - tentative d\'authentification');
    return firebaseAuth(req, res, next);
    
  } catch (error) {
    // En cas d'erreur d'authentification, continuer sans authentification
    console.log('⚠️ Erreur d\'authentification - accès public autorisé:', error.message);
    req.user = null;
    return next();
  }
};

export default optionalFirebaseAuth;