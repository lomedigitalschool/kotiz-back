import React, { useState, useEffect } from 'react';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../config/firebaseClient';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState('');

  useEffect(() => {
    // Récupérer le oobCode de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('oobCode');
    if (code) {
      setOobCode(code);
    } else {
      setError('Code de réinitialisation manquant dans l\'URL');
    }
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Réinitialiser le mot de passe</h2>
      {success ? (
        <div>
          <p>Votre mot de passe a été réinitialisé avec succès.</p>
          <button onClick={() => window.location.href = '/login'}>Aller à la connexion</button>
        </div>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div>
            <label>Nouveau mot de passe:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Confirmer le mot de passe:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading || !oobCode}>
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;