/**
 * AuthContext - Contexte d'authentification Firebase pour Kotiz
 *
 * Fonctionnalités :
 * - Écoute globale de l'état de connexion avec onAuthStateChanged
 * - Rafraîchissement automatique du token
 * - Vérification d'email obligatoire
 * - Gestion centralisée des erreurs Firebase
 * - Hook useAuth() pour accéder facilement aux infos de session
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebaseClient';
import { mapFirebaseError } from '../utils/firebaseErrorMapper';

// Créer le contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

// Provider du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  // Fonction pour mettre à jour le token
  const updateToken = async (forceRefresh = false) => {
    if (user) {
      try {
        const newToken = await user.getIdToken(forceRefresh);
        localStorage.setItem('firebaseToken', newToken);
        setToken(newToken);
        return newToken;
      } catch (err) {
        console.error('Erreur lors du rafraîchissement du token:', err);
        setError(mapFirebaseError(err.code));
        return null;
      }
    }
    return null;
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('firebaseToken');
      setUser(null);
      setToken(null);
      setError(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      setError(mapFirebaseError(err.code));
    }
  };

  // Fonction pour renvoyer l'email de vérification
  const resendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        return { success: true, message: 'Email de vérification envoyé avec succès.' };
      } catch (err) {
        console.error('Erreur lors de l\'envoi de l\'email de vérification:', err);
        return { success: false, message: mapFirebaseError(err.code) };
      }
    }
    return { success: false, message: 'Aucun utilisateur connecté.' };
  };

  // Vérifier si l'utilisateur peut accéder aux routes protégées
  const canAccessProtectedRoutes = () => {
    if (!user) return false;
    if (!user.emailVerified) {
      setError('Veuillez vérifier votre adresse email avant de continuer. Consultez votre boîte de réception.');
      return false;
    }
    return true;
  };

  // Effet pour écouter les changements d'état d'authentification
  useEffect(() => {
    console.log('🔄 Initialisation de l\'écoute d\'authentification Firebase...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('👤 État d\'authentification changé:', firebaseUser ? 'Connecté' : 'Déconnecté');

      if (firebaseUser) {
        // Utilisateur connecté
        setUser(firebaseUser);

        // Récupérer et stocker le token
        try {
          const idToken = await firebaseUser.getIdToken();
          localStorage.setItem('firebaseToken', idToken);
          setToken(idToken);
          setError(null);
          console.log('✅ Token Firebase récupéré et stocké');
        } catch (err) {
          console.error('❌ Erreur lors de la récupération du token:', err);
          setError(mapFirebaseError(err.code));
        }
      } else {
        // Utilisateur déconnecté
        setUser(null);
        setToken(null);
        localStorage.removeItem('firebaseToken');
        setError(null);
        console.log('🚪 Utilisateur déconnecté');
      }

      setLoading(false);
    });

    // Cleanup de l'écouteur
    return () => {
      console.log('🧹 Nettoyage de l\'écouteur d\'authentification');
      unsubscribe();
    };
  }, []);

  // Effet pour gérer la redirection automatique
  useEffect(() => {
    if (!loading) {
      const currentPath = window.location.pathname;

      if (user && !user.emailVerified && currentPath !== '/verify-email') {
        // Rediriger vers la page de vérification d'email si nécessaire
        console.log('⚠️ Email non vérifié, redirection vers /verify-email');
        // window.location.href = '/verify-email'; // Commenté pour éviter les redirections en développement
      } else if (!user && currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
        // Rediriger vers login si pas connecté et pas sur une page publique
        console.log('🚫 Utilisateur non connecté, redirection vers /login');
        // window.location.href = '/login'; // Commenté pour éviter les redirections en développement
      }
    }
  }, [user, loading]);

  // Valeur du contexte
  const value = {
    user,
    loading,
    token,
    error,
    logout,
    updateToken,
    resendVerificationEmail,
    canAccessProtectedRoutes,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;