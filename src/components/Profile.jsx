/**
 * Composant Profile - Gestion du profil utilisateur
 *
 * Fonctionnalités :
 * - Affichage des informations utilisateur
 * - Modification de l'email, téléphone, nom
 * - Changement de mot de passe
 * - Avatar avec première lettre du nom
 * - Synchronisation avec Firebase Auth et PostgreSQL
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePassword, updateEmail, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseClient';
import api from '../utils/axiosConfig';
import { mapFirebaseError } from '../utils/firebaseErrorMapper';

const Profile = () => {
  const { user, updateToken } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Charger les données du profil
  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Charger les données depuis le backend PostgreSQL
      const response = await api.get('/auth/me');
      const userData = response.data;

      setProfileData({
        name: userData.name || '',
        email: userData.email || user.email || '',
        phone: userData.phone || user.phoneNumber || '',
        role: userData.role || 'user'
      });
    } catch (err) {
      console.error('Erreur chargement profil:', err);
      setError('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les informations générales
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // Mettre à jour Firebase Auth si nécessaire
      if (profileData.email !== user.email) {
        await updateEmail(user, profileData.email);
      }

      if (profileData.name !== user.displayName) {
        await updateProfile(user, { displayName: profileData.name });
      }

      // Mettre à jour le backend PostgreSQL
      await api.put('/auth/profile', {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone
      });

      // Rafraîchir le token pour refléter les changements
      await updateToken(true);

      setSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      setError(mapFirebaseError(err.code) || 'Erreur lors de la mise à jour du profil');
    } finally {
      setUpdating(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setUpdating(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setUpdating(false);
      return;
    }

    try {
      await updatePassword(user, passwordData.newPassword);

      // Envoyer un email de confirmation
      try {
        await api.post('/auth/send-password-changed-email');
      } catch (emailError) {
        console.warn('Erreur envoi email confirmation:', emailError);
        // Ne pas bloquer si l'email échoue
      }

      setSuccess('Mot de passe changé avec succès ! Un email de confirmation vous a été envoyé.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      setError(mapFirebaseError(err.code) || 'Erreur lors du changement de mot de passe');
    } finally {
      setUpdating(false);
    }
  };

  // Générer l'avatar avec la première lettre
  const getAvatar = () => {
    const firstLetter = profileData.name ? profileData.name.charAt(0).toUpperCase() : '?';
    return (
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        fontWeight: 'bold',
        margin: '0 auto 20px'
      }}>
        {firstLetter}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Mon Profil</h1>

      {/* Avatar */}
      {getAvatar()}

      {/* Messages de succès/erreur */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          {success}
        </div>
      )}

      {/* Informations générales */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Informations générales</h2>

        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nom complet
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Téléphone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Rôle
            </label>
            <input
              type="text"
              value={profileData.role}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                backgroundColor: '#f8f9fa'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: updating ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              width: '100%'
            }}
          >
            {updating ? 'Mise à jour...' : 'Mettre à jour le profil'}
          </button>
        </form>
      </div>

      {/* Changement de mot de passe */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Sécurité</h2>

        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Changer le mot de passe
          </button>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                required
                minLength="6"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={updating}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  flex: 1
                }}
              >
                {updating ? 'Changement...' : 'Changer le mot de passe'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;