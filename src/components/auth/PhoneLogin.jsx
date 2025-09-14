/**
 * Composant PhoneLogin - Authentification par numéro de téléphone avec Firebase
 *
 * Fonctionnalités :
 * - Saisie du numéro de téléphone avec validation
 * - Envoi de code OTP par SMS avec reCAPTCHA invisible
 * - Vérification du code reçu
 * - Gestion complète des erreurs Firebase
 * - Réinitialisation automatique du reCAPTCHA en cas d'échec
 *
 * Pour le développement : Ajouter des numéros de test dans Firebase Console
 * Authentication > Sign-in method > Phone > Phone numbers for testing
 * Exemple : +33 123 456 789 avec code 123456
 */

import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebaseClient';
import api from '../../utils/axiosConfig';

const PhoneLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'code'

  useEffect(() => {
    // Configurer reCAPTCHA
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setError('reCAPTCHA expiré. Veuillez réessayer.');
        }
      }, auth);
    }

    // Nettoyage au démontage du composant
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    };
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation basique du numéro de téléphone
    if (!phoneNumber.trim()) {
      setError('Veuillez saisir un numéro de téléphone');
      setLoading(false);
      return;
    }

    // Vérifier le format du numéro
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setError('Format de numéro invalide. Utilisez le format international (+33123456789)');
      setLoading(false);
      return;
    }

    try {
      // Réinitialiser le reCAPTCHA si nécessaire
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      // Recréer le reCAPTCHA
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setError('reCAPTCHA expiré. Veuillez réessayer.');
        }
      }, auth);

      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep('code');
    } catch (err) {
      // Réinitialiser le reCAPTCHA en cas d'erreur
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }

      // Gestion des erreurs spécifiques
      let errorMessage = 'Erreur lors de l\'envoi du code';
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Numéro de téléphone invalide. Utilisez le format international (+33123456789)';
      } else if (err.code === 'auth/missing-phone-number') {
        errorMessage = 'Veuillez saisir un numéro de téléphone';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMessage = 'Quota SMS dépassé. Veuillez réessayer plus tard';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const idToken = await result.user.getIdToken();

      // Envoyer l'idToken au backend
      const response = await api.post('/auth/firebase-sync');

      // Stocker le token dans localStorage
      localStorage.setItem('firebaseToken', idToken);

      console.log('Connexion par téléphone réussie:', response.data);
      // Rediriger vers le dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      // Gestion des erreurs spécifiques pour la vérification du code
      let errorMessage = 'Code de vérification invalide';
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Code de vérification incorrect. Vérifiez le code reçu par SMS.';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'Le code a expiré. Veuillez demander un nouveau code.';
      } else if (err.code === 'auth/invalid-verification-id') {
        errorMessage = 'Session de vérification invalide. Veuillez recommencer.';
      } else if (err.code === 'auth/missing-verification-code') {
        errorMessage = 'Veuillez saisir le code de vérification';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Si le code est expiré ou invalide, permettre de recommencer
      if (err.code === 'auth/code-expired' || err.code === 'auth/invalid-verification-id') {
        setStep('phone');
        setConfirmationResult(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-login-container">
      <h2>Connexion par téléphone</h2>
      {step === 'phone' ? (
        <form onSubmit={handleSendCode}>
          <div>
            <label>Numéro de téléphone (avec indicatif, ex: +33123456789):</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Envoi du code...' : 'Envoyer le code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <div>
            <label>Code de vérification:</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
          <button type="button" onClick={() => setStep('phone')}>
            Retour
          </button>
        </form>
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default PhoneLogin;