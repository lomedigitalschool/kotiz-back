/**
 * Composant AuthTest - Test du système d'authentification Firebase
 *
 * Ce composant permet de tester :
 * - État de connexion/déconnexion
 * - Accès aux routes protégées
 * - Vérification d'email
 * - Rafraîchissement du token
 * - Gestion des erreurs
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';

const AuthTest = () => {
  const {
    user,
    loading,
    token,
    error,
    logout,
    updateToken,
    resendVerificationEmail,
    canAccessProtectedRoutes,
    clearError
  } = useAuth();

  const [testResults, setTestResults] = useState([]);
  const [backendTest, setBackendTest] = useState(null);

  // Fonction pour ajouter un résultat de test
  const addTestResult = (testName, success, message) => {
    const result = {
      id: Date.now(),
      testName,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  // Test 1: Vérifier l'état de connexion
  const testAuthState = () => {
    if (loading) {
      addTestResult('État de connexion', true, 'Vérification en cours...');
    } else if (user) {
      addTestResult('État de connexion', true, `Connecté en tant que ${user.email}`);
    } else {
      addTestResult('État de connexion', true, 'Utilisateur non connecté');
    }
  };

  // Test 2: Vérifier l'accès aux routes protégées
  const testProtectedRoutes = () => {
    const canAccess = canAccessProtectedRoutes();
    if (!user) {
      addTestResult('Routes protégées', true, 'Bloqué - Utilisateur non connecté');
    } else if (!user.emailVerified) {
      addTestResult('Routes protégées', true, 'Bloqué - Email non vérifié');
    } else {
      addTestResult('Routes protégées', true, 'Accès autorisé');
    }
  };

  // Test 3: Tester le rafraîchissement du token
  const testTokenRefresh = async () => {
    try {
      const newToken = await updateToken(true);
      if (newToken) {
        addTestResult('Rafraîchissement token', true, 'Token rafraîchi avec succès');
      } else {
        addTestResult('Rafraîchissement token', false, 'Échec du rafraîchissement');
      }
    } catch (err) {
      addTestResult('Rafraîchissement token', false, `Erreur: ${err.message}`);
    }
  };

  // Test 4: Tester la connexion backend
  const testBackendConnection = async () => {
    try {
      const response = await api.get('/auth/me');
      setBackendTest(response.data);
      addTestResult('Connexion backend', true, 'Requête backend réussie');
    } catch (err) {
      setBackendTest(null);
      if (err.response?.status === 401) {
        addTestResult('Connexion backend', false, 'Token expiré/invalide (401)');
      } else {
        addTestResult('Connexion backend', false, `Erreur backend: ${err.message}`);
      }
    }
  };

  // Test 5: Tester l'envoi d'email de vérification
  const testEmailVerification = async () => {
    if (!user) {
      addTestResult('Vérification email', false, 'Aucun utilisateur connecté');
      return;
    }

    const result = await resendVerificationEmail();
    if (result.success) {
      addTestResult('Vérification email', true, result.message);
    } else {
      addTestResult('Vérification email', false, result.message);
    }
  };

  // Test 6: Tester la déconnexion
  const testLogout = async () => {
    try {
      await logout();
      addTestResult('Déconnexion', true, 'Déconnexion réussie');
    } catch (err) {
      addTestResult('Déconnexion', false, `Erreur déconnexion: ${err.message}`);
    }
  };

  // Effet pour surveiller les erreurs
  useEffect(() => {
    if (error) {
      addTestResult('Erreur système', false, error);
      // Effacer l'erreur après l'avoir affichée
      setTimeout(() => clearError(), 3000);
    }
  }, [error, clearError]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Test du système d'authentification Firebase</h1>

      {/* État actuel */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>📊 État actuel</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div><strong>Loading:</strong> {loading ? '⏳ Oui' : '✅ Non'}</div>
          <div><strong>User:</strong> {user ? `✅ ${user.email}` : '❌ Non connecté'}</div>
          <div><strong>Token:</strong> {token ? `✅ Présent (${token.substring(0, 20)}...)` : '❌ Absent'}</div>
          <div><strong>Email vérifié:</strong> {user?.emailVerified ? '✅ Oui' : '❌ Non'}</div>
        </div>
        {error && (
          <div style={{ marginTop: '10px', color: 'red', fontWeight: 'bold' }}>
            ⚠️ Erreur: {error}
          </div>
        )}
      </div>

      {/* Tests disponibles */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>🧪 Tests disponibles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button onClick={testAuthState} style={buttonStyle}>État de connexion</button>
          <button onClick={testProtectedRoutes} style={buttonStyle}>Routes protégées</button>
          <button onClick={testTokenRefresh} style={buttonStyle} disabled={!user}>Rafraîchir token</button>
          <button onClick={testBackendConnection} style={buttonStyle} disabled={!user}>Test backend</button>
          <button onClick={testEmailVerification} style={buttonStyle} disabled={!user}>Email vérification</button>
          <button onClick={testLogout} style={buttonStyle} disabled={!user}>Déconnexion</button>
        </div>
      </div>

      {/* Résultats des tests */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>📋 Résultats des tests</h2>
        {testResults.length === 0 ? (
          <p>Aucun test effectué</p>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {testResults.map(result => (
              <div key={result.id} style={{
                padding: '10px',
                marginBottom: '5px',
                borderRadius: '4px',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {result.success ? '✅' : '❌'} {result.testName}
                  </span>
                  <span style={{ fontSize: '0.8em', color: '#666' }}>{result.timestamp}</span>
                </div>
                <div style={{ marginTop: '5px', fontSize: '0.9em' }}>{result.message}</div>
              </div>
            ))}
          </div>
        )}
        {testResults.length > 0 && (
          <button
            onClick={() => setTestResults([])}
            style={{ ...buttonStyle, backgroundColor: '#6c757d', marginTop: '10px' }}
          >
            Effacer les résultats
          </button>
        )}
      </div>

      {/* Test backend détaillé */}
      {backendTest && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>🔗 Réponse backend</h2>
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.9em'
          }}>
            {JSON.stringify(backendTest, null, 2)}
          </pre>
        </div>
      )}

      {/* Informations système */}
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
        <h2>ℹ️ Informations système</h2>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>AuthProvider:</strong> {user ? '✅ Actif' : '⚠️ Inactif'}</li>
          <li><strong>Token localStorage:</strong> {localStorage.getItem('firebaseToken') ? '✅ Présent' : '❌ Absent'}</li>
          <li><strong>Firebase User:</strong> {user ? `✅ ${user.uid.substring(0, 8)}...` : '❌ Null'}</li>
          <li><strong>Routes protégées:</strong> {canAccessProtectedRoutes() ? '✅ Accessibles' : '❌ Bloquées'}</li>
        </ul>
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 15px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'background-color 0.2s'
};

export default AuthTest;