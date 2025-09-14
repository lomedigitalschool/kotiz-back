/**
 * Composant VerifyEmail - Page de vérification d'adresse email
 *
 * Affiché lorsque l'utilisateur n'a pas vérifié son email
 * Permet de renvoyer l'email de vérification
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const { user, resendVerificationEmail, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage('');

    const result = await resendVerificationEmail();

    if (result.success) {
      setMessage(result.message);
    } else {
      setMessage(result.message);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h2>Vérification d'adresse email requise</h2>

        <div className="verify-email-content">
          <p>
            Un email de vérification a été envoyé à <strong>{user?.email}</strong>.
          </p>
          <p>
            Veuillez cliquer sur le lien dans l'email pour vérifier votre adresse et accéder à votre compte.
          </p>

          {message && (
            <div className={`message ${message.includes('succès') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="verify-email-actions">
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Envoi en cours...' : 'Renvoyer l\'email de vérification'}
            </button>

            <button
              onClick={handleLogout}
              className="btn-secondary"
            >
              Se déconnecter
            </button>
          </div>

          <div className="verify-email-help">
            <p>
              N'avez-vous pas reçu l'email ? Vérifiez votre dossier spam ou courrier indésirable.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .verify-email-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f5f5f5;
          padding: 20px;
        }

        .verify-email-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
        }

        .verify-email-content p {
          margin-bottom: 20px;
          color: #666;
          line-height: 1.6;
        }

        .message {
          padding: 12px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: 500;
        }

        .message.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .verify-email-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 30px;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-primary:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: transparent;
          color: #6c757d;
          border: 1px solid #6c757d;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background-color: #6c757d;
          color: white;
        }

        .verify-email-help {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .verify-email-help p {
          font-size: 14px;
          color: #888;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;