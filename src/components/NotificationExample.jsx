import React from 'react';
import { NotificationProvider, useNotificationContext } from './NotificationPopup';

// Exemple de composant qui utilise les notifications
const ExampleComponent = () => {
  const { showSuccess, showError } = useNotificationContext();

  const handleSuccess = () => {
    showSuccess(
      'Succès !',
      'Votre compte a été créé avec succès.',
      4000
    );
  };

  const handleError = () => {
    showError(
      'Erreur',
      'Une erreur s\'est produite lors de la création du compte.',
      4000
    );
  };

  const handleCagnotteSuccess = () => {
    showSuccess(
      'Cagnotte créée !',
      'Votre cagnotte a été créée et est maintenant active.',
      5000
    );
  };

  const handleContributionSuccess = () => {
    showSuccess(
      'Contribution réussie !',
      'Votre contribution a été ajoutée à la cagnotte.',
      4000
    );
  };

  // Exemple de connexion avec notification
  const handleLogin = async () => {
    try {
      // Simulation d'appel API de connexion
      // const response = await fetch('/api/v1/auth/login', { ... });

      // Simulation de succès
      showSuccess(
        'Connexion réussie !',
        'Vous êtes maintenant connecté à votre compte.',
        4000
      );
    } catch (error) {
      showError(
        'Erreur de connexion',
        'Identifiants incorrects. Veuillez réessayer.',
        4000
      );
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Exemple d'utilisation des notifications</h1>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
        <button
          onClick={handleSuccess}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Création de compte réussie
        </button>

        <button
          onClick={handleError}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Erreur de création
        </button>

        <button
          onClick={handleCagnotteSuccess}
          style={{
            padding: '10px 20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cagnotte créée
        </button>

        <button
          onClick={handleContributionSuccess}
          style={{
            padding: '10px 20px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Contribution réussie
        </button>

        <button
          onClick={handleLogin}
          style={{
            padding: '10px 20px',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Connexion réussie
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Comment intégrer dans votre application :</h2>
        <ol>
          <li>Enveloppez votre App avec NotificationProvider</li>
          <li>Utilisez useNotificationContext() dans vos composants</li>
          <li>Appelez showSuccess() ou showError() selon le besoin</li>
        </ol>

        <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`import { NotificationProvider, useNotificationContext } from './components/NotificationPopup';

function App() {
  return (
    <NotificationProvider>
      {/* Votre application */}
    </NotificationProvider>
  );
}

function MonComposant() {
  const { showSuccess, showError } = useNotificationContext();

  const creerCompte = async () => {
    try {
      // API call
      showSuccess('Succès !', 'Compte créé avec succès');
    } catch (error) {
      showError('Erreur', 'Impossible de créer le compte');
    }
  };

  return <button onClick={creerCompte}>Créer compte</button>;
}`}
        </pre>
      </div>
    </div>
  );
};

// Composant wrapper pour l'exemple
const NotificationExample = () => {
  return (
    <NotificationProvider>
      <ExampleComponent />
    </NotificationProvider>
  );
};

export default NotificationExample;