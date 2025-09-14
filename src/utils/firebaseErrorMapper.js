/**
 * Mapper les erreurs Firebase Authentication vers des messages en français
 * @param {string} errorCode - Code d'erreur Firebase (ex: 'auth/user-not-found')
 * @returns {string} Message d'erreur en français
 */
export const mapFirebaseError = (errorCode) => {
  const errorMessages = {
    // Erreurs d'authentification
    'auth/user-not-found': 'Aucun utilisateur trouvé avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-disabled': 'Ce compte utilisateur a été désactivé.',
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/weak-password': 'Le mot de passe est trop faible.',
    'auth/operation-not-allowed': 'Cette méthode d\'authentification n\'est pas activée.',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec une autre méthode de connexion.',

    // Erreurs de téléphone
    'auth/invalid-phone-number': 'Numéro de téléphone invalide. Utilisez le format international (+33123456789).',
    'auth/missing-phone-number': 'Veuillez saisir un numéro de téléphone.',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'auth/invalid-verification-code': 'Code de vérification incorrect.',
    'auth/code-expired': 'Le code de vérification a expiré.',
    'auth/invalid-verification-id': 'Session de vérification invalide.',
    'auth/missing-verification-code': 'Veuillez saisir le code de vérification.',
    'auth/quota-exceeded': 'Quota SMS dépassé. Veuillez réessayer plus tard.',

    // Erreurs de réinitialisation de mot de passe
    'auth/expired-action-code': 'Le lien de réinitialisation a expiré.',
    'auth/invalid-action-code': 'Le lien de réinitialisation est invalide.',
    'auth/user-token-expired': 'Le token utilisateur a expiré.',
    'auth/user-token-revoked': 'Le token utilisateur a été révoqué.',

    // Erreurs générales
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet.',
    'auth/timeout': 'Délai d\'attente dépassé. Veuillez réessayer.',
    'auth/cancelled-popup-request': 'La fenêtre popup a été fermée avant la fin de l\'authentification.',
    'auth/popup-blocked': 'La fenêtre popup a été bloquée par votre navigateur.',
    'auth/popup-closed-by-user': 'La fenêtre popup a été fermée par l\'utilisateur.',

    // Erreurs de vérification d'email
    'auth/requires-recent-login': 'Cette action nécessite une reconnexion récente.',
  };

  return errorMessages[errorCode] || 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
};

/**
 * Obtenir un message d'erreur générique pour les erreurs non Firebase
 * @param {Error} error - Objet d'erreur
 * @returns {string} Message d'erreur en français
 */
export const getGenericErrorMessage = (error) => {
  if (error?.message) {
    return error.message;
  }
  return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
};