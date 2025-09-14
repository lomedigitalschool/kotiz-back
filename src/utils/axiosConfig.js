import axios from 'axios';
import { auth } from '../config/firebaseClient';

// Créer une instance axios configurée
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // URL de base du backend (corrigée pour /api/v1)
});

// Variable pour éviter les rafraîchissements simultanés
let isRefreshing = false;
let failedQueue = [];

// Fonction pour traiter la file d'attente des requêtes échouées
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Intercepteur pour ajouter automatiquement le token Firebase dans les headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification et rafraîchir le token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un rafraîchissement est déjà en cours, ajouter à la file d'attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Essayer de rafraîchir le token
        const user = auth.currentUser;
        if (user) {
          console.log('🔄 Rafraîchissement automatique du token Firebase...');
          const newToken = await user.getIdToken(true); // Force refresh

          // Mettre à jour le token dans localStorage
          localStorage.setItem('firebaseToken', newToken);

          // Traiter la file d'attente des requêtes échouées
          processQueue(null, newToken);

          // Relancer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log('✅ Token rafraîchi avec succès, relance de la requête');
          return api(originalRequest);
        } else {
          // Pas d'utilisateur connecté, rediriger vers login
          throw new Error('No user authenticated');
        }
      } catch (refreshError) {
        console.error('❌ Échec du rafraîchissement du token:', refreshError);

        // Traiter la file d'attente avec l'erreur
        processQueue(refreshError, null);

        // Nettoyer et rediriger
        localStorage.removeItem('firebaseToken');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;