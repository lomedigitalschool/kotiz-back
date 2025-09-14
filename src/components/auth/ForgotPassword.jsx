import React, { useState } from 'react';
import api from '../../utils/axiosConfig';
import { mapFirebaseError } from '../../utils/firebaseErrorMapper';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      console.log('Email de réinitialisation envoyé:', response.data);
    } catch (err) {
      console.error('Erreur forgot password:', err);

      // Gérer les erreurs spécifiques
      if (err.response?.data?.error) {
        setError(err.response.data.message || err.response.data.error);
      } else if (err.response?.status === 404) {
        setError('Utilisateur non trouvé avec cette adresse email');
      } else if (err.response?.status === 400) {
        setError('Adresse email invalide');
      } else {
        setError('Erreur lors de l\'envoi de l\'email de réinitialisation');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Mot de passe oublié</h2>
      {success ? (
        <div>
          <p>Un email de réinitialisation a été envoyé à {email}.</p>
          <p>Vérifiez votre boîte de réception et suivez les instructions.</p>
          <button onClick={() => window.location.href = '/login'}>Retour à la connexion</button>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer l\'email de réinitialisation'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;