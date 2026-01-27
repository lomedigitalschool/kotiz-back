import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotificationContext } from './NotificationPopup';

// Exemple de composant de navigation avec authentification conditionnelle
const NavigationExample = () => {
  const { user, logout, loading } = useAuth();
  const { showSuccess } = useNotificationContext();

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Déconnexion réussie', 'À bientôt !', 3000);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <nav style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div>Chargement...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav style={{
      padding: '10px',
      background: '#fff',
      borderBottom: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
          KOTIZ
        </div>

        {/* Menu principal */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none', color: '#333', padding: '8px 12px', borderRadius: '4px', transition: 'background 0.2s' }}
             onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
             onMouseOut={(e) => e.target.style.background = 'transparent'}>
            Accueil
          </a>
          <a href="/explorer" style={{ textDecoration: 'none', color: '#333', padding: '8px 12px', borderRadius: '4px', transition: 'background 0.2s' }}
             onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
             onMouseOut={(e) => e.target.style.background = 'transparent'}>
            Explorer
          </a>
          <a href="/cagnottes" style={{ textDecoration: 'none', color: '#333', padding: '8px 12px', borderRadius: '4px', transition: 'background 0.2s' }}
             onMouseOver={(e) => e.target.style.background = '#f5f5f5'}
             onMouseOut={(e) => e.target.style.background = 'transparent'}>
            Mes Cagnottes
          </a>
        </div>

        {/* Boutons d'authentification - CONDITIONNELS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user ? (
            // UTILISATEUR CONNECTÉ : Afficher le profil et déconnexion
            <>
              <span style={{
                color: '#666',
                fontSize: '14px',
                marginRight: '10px'
              }}>
                Bonjour, {user.displayName || user.email?.split('@')[0] || 'Utilisateur'}
              </span>
              <a href="/profil" style={{
                textDecoration: 'none',
                color: '#2196F3',
                padding: '8px 16px',
                border: '1px solid #2196F3',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
                 onMouseOver={(e) => {
                   e.target.style.background = '#2196F3';
                   e.target.style.color = 'white';
                 }}
                 onMouseOut={(e) => {
                   e.target.style.background = 'transparent';
                   e.target.style.color = '#2196F3';
                 }}>
                Mon Profil
              </a>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#d32f2f'}
                onMouseOut={(e) => e.target.style.background = '#f44336'}
              >
                Déconnexion
              </button>
            </>
          ) : (
            // UTILISATEUR NON CONNECTÉ : Afficher connexion/inscription
            <>
              <a href="/login" style={{
                textDecoration: 'none',
                color: '#666',
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
                 onMouseOver={(e) => {
                   e.target.style.background = '#f5f5f5';
                   e.target.style.borderColor = '#2196F3';
                   e.target.style.color = '#2196F3';
                 }}
                 onMouseOut={(e) => {
                   e.target.style.background = 'transparent';
                   e.target.style.borderColor = '#ddd';
                   e.target.style.color = '#666';
                 }}>
                Se connecter
              </a>
              <a href="/register" style={{
                textDecoration: 'none',
                color: 'white',
                padding: '8px 16px',
                background: '#4CAF50',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
                 onMouseOver={(e) => e.target.style.background = '#45a049'}
                 onMouseOut={(e) => e.target.style.background = '#4CAF50'}>
                Créer un compte
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Exemple de composant Header qui utilise la navigation
const HeaderExample = () => {
  return (
    <header>
      <NavigationExample />
      <div style={{
        padding: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <h1 style={{ margin: '0', fontSize: '2.5rem' }}>Bienvenue sur Kotiz</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
          La plateforme de cagnottes collaborative
        </p>
      </div>
    </header>
  );
};

export default HeaderExample;