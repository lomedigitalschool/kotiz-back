# Documentation des Endpoints Backend Kotiz

Vue d'ensemble
Cette documentation détaille tous les endpoints de l'API Backend Kotiz, incluant :
- Les méthodes HTTP utilisées
- Les chemins d'accès
- Les données reçues du frontend
- Les données renvoyées par le backend
- Les exemples d'appels depuis le frontend

**Base URL :** `http://localhost:5000/api/v1` (en développement)

---

## 1. Authentification (Auth Routes)

Endpoints pour l'inscription, connexion et gestion des sessions utilisateur.

### POST /api/v1/auth/firebase-sync
**Description :** Synchronisation Firebase → PostgreSQL
**Authentification :** Firebase Auth (middleware firebaseAuth)
**Données reçues :**
```json
{
// Aucune donnée requise - l'utilisateur est récupéré depuis le token Firebase
}
```
**Données renvoyées :**
```json
{
  "message": "Utilisateur Firebase synchronisé",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nom Utilisateur",
    // ... autres propriétés utilisateur
  }
}
```
**Exemple frontend :**
```javascript
// Automatique via middleware firebaseAuth
```

### GET /api/v1/auth/me
**Description :** Récupérer le profil utilisateur connecté
**Authentification :** Firebase Auth
**Données reçues :** Aucune (utilisateur depuis token)
**Données renvoyées :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nom Utilisateur",
  "phone": "+221701234567",
  "role": "user",
  "isVerified": true,
  "isPhoneVerified": true,
  "avatarUrl": "url",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/v1/auth/profile
**Description :** Mettre à jour le profil utilisateur
**Authentification :** Firebase Auth
**Données reçues :**
```json
{
  "name": "Nouveau Nom",
  "email": "nouveau@email.com",
  "phone": "+221701234567"
}
```
**Données renvoyées :**
```json
{
  "message": "Profil mis à jour avec succès",
  "user": {
    // Objet utilisateur complet mis à jour
  }
}
```

### GET /api/v1/auth/admin-check
**Description :** Vérifier l'accès administrateur
**Authentification :** Firebase Auth
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "access": true,
  "message": "Accès administrateur autorisé",
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### POST /api/v1/auth/forgot-password
**Description :** Demande de réinitialisation de mot de passe
**Authentification :** Aucune (rate limited)
**Données reçues :**
```json
{
  "email": "user@example.com"
}
```
**Données renvoyées :**
```json
{
  "message": "Si votre adresse email est enregistrée, vous recevrez un email de réinitialisation",
  "info": "Vérifiez votre boîte de réception",
  "email": "user@example.com"
}
```

### POST /api/v1/auth/send-password-changed-email
**Description :** Envoyer email de confirmation changement mot de passe
**Authentification :** Firebase Auth
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "message": "Email de confirmation envoyé"
}
```

### POST /api/v1/auth/logout
**Description :** Déconnexion utilisateur
**Authentification :** Firebase Auth
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

### POST /api/v1/auth/update-phone
**Description :** Mettre à jour le numéro de téléphone après inscription
**Authentification :** Firebase Auth
**Données reçues :**
```json
{
  "phone": "+221701234567"
}
```
**Données renvoyées :**
```json
{
  "message": "Numéro de téléphone mis à jour avec succès",
  "user": {
    "id": "uuid",
    "name": "Nom",
    "email": "email@example.com",
    "phone": "+221701234567",
    "isPhoneVerified": false
  }
}
```

---

## 2. Utilisateurs (User Routes)

Endpoints pour la gestion des profils utilisateurs.

### GET /api/v1/users
**Description :** Récupérer tous les utilisateurs (Admin seulement)
**Authentification :** JWT Admin
**Données reçues :** Query params (page, limit, etc.)
**Données renvoyées :**
```json
[
  {
    "id": "uuid",
    "name": "Nom",
    "email": "email@example.com",
    "role": "user",
    "isBlocked": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/v1/users/stats
**Description :** Statistiques utilisateurs (Admin)
**Authentification :** JWT Admin
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "total": 150,
  "active": 140,
  "verified": 120,
  "newThisMonth": 15
}
```

### GET /api/v1/users/me
**Description :** Profil utilisateur actuel
**Authentification :** JWT
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nom",
  "phone": "+221701234567",
  "role": "user",
  "isVerified": true,
  "isPhoneVerified": true,
  "avatarUrl": "url",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/v1/users/dashboard
**Description :** Dashboard utilisateur
**Authentification :** JWT
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "totalCollected": 50000,
  "activePullsCount": 3,
  "contributorsCount": 25,
  "myPulls": [...],
  "myContributions": [...]
}
```

### GET /api/v1/users/:id
**Description :** Détails d'un utilisateur spécifique
**Authentification :** JWT
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "id": "uuid",
  "name": "Nom",
  "email": "email@example.com",
  // ... autres propriétés
}
```

### PUT /api/v1/users/:id
**Description :** Mettre à jour un utilisateur
**Authentification :** JWT
**Données reçues :**
```json
{
  "name": "Nouveau Nom",
  "email": "nouveau@email.com"
}
```
**Données renvoyées :**
```json
{
  "message": "Utilisateur mis à jour",
  "user": { /* objet utilisateur */ }
}
```

### POST /api/v1/users/avatar
**Description :** Upload d'avatar utilisateur
**Authentification :** JWT
**Données reçues :** FormData avec fichier image
**Données renvoyées :**
```json
{
  "message": "Avatar uploadé avec succès",
  "avatarUrl": "https://cloudinary.com/avatar.jpg",
  "user": { /* objet utilisateur */ }
}
```

---

## 3. Cagnottes (Pull Routes)

Endpoints pour créer et gérer les cagnottes.

### GET /api/v1/pulls/public
**Description :** Liste des cagnottes publiques
**Authentification :** Aucune
**Données reçues :** Query params (page, limit, search, type)
**Données renvoyées :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Titre cagnotte",
      "description": "Description",
      "goalAmount": 100000,
      "currentAmount": 25000,
      "currency": "XOF",
      "progressPercentage": 25,
      "contributionCount": 5,
      "owner": {
        "id": "uuid",
        "name": "Propriétaire"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### GET /api/v1/pulls/public/:id
**Description :** Détails d'une cagnotte publique
**Authentification :** Aucune
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Titre",
    "description": "Description",
    "goalAmount": 100000,
    "currentAmount": 25000,
    "currency": "XOF",
    "imageUrl": "url",
    "status": "active",
    "owner": { "id": "uuid", "name": "Nom" },
    "contributionCount": 5,
    "progressPercentage": 25,
    "recentContributions": [...]
  }
}
```

### GET /api/v1/pulls/all
**Description :** Toutes les cagnottes (publiques + privées selon auth)
**Authentification :** Optionnelle
**Données reçues :** Query params (page, limit, search, type)
**Données renvoyées :** Similaire à /pulls/public mais avec contrôle d'accès

### GET /api/v1/pulls/:id
**Description :** Détails d'une cagnotte spécifique
**Authentification :** Optionnelle
**Données reçues :** Path param id
**Données renvoyées :** Objet cagnotte complet selon droits d'accès

### GET /api/v1/pulls
**Description :** Cagnottes de l'utilisateur connecté
**Authentification :** JWT
**Données reçues :** Aucune
**Données renvoyées :**
```json
[
  {
    "id": "uuid",
    "title": "Ma cagnotte",
    "goalAmount": 50000,
    "currentAmount": 15000,
    "status": "active",
    "contributions": [...]
  }
]
```

### POST /api/v1/pulls
**Description :** Créer une nouvelle cagnotte
**Authentification :** JWT + Email vérifié
**Données reçues :**
```json
{
  "title": "Titre cagnotte",
  "description": "Description",
  "goalAmount": 100000,
  "currency": "XOF",
  "deadline": "2024-12-31",
  "type": "public",
  "participantLimit": 100
}
```
Image en FormData
**Données renvoyées :**
```json
{
  "success": true,
  "message": "Cagnotte créée avec succès",
  "pull": {
    "id": "uuid",
    "title": "Titre",
    // ... autres propriétés
  }
}
```

### PUT /api/v1/pulls/:id
**Description :** Modifier une cagnotte
**Authentification :** JWT + Propriétaire ou Admin
**Données reçues :** Similaire à POST mais partiel
**Données renvoyées :**
```json
{
  "message": "Cagnotte mise à jour avec succès",
  "pull": { /* objet cagnotte */ }
}
```

### DELETE /api/v1/pulls/:id
**Description :** Supprimer une cagnotte
**Authentification :** JWT + Propriétaire
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "message": "Cagnotte supprimée"
}
```

### POST /api/v1/pulls/:pullId/contribute
**Description :** Contribuer à une cagnotte
**Authentification :** JWT + Email vérifié
**Données reçues :**
```json
{
  "amount": 5000,
  "message": "Message optionnel",
  "isAnonymous": false
}
```
**Données renvoyées :**
```json
{
  "success": true,
  "message": "Contribution effectuée avec succès",
  "contribution": {
    "id": "uuid",
    "amount": 5000,
    "status": "completed"
  },
  "payment": {
    "transactionId": "tx_123",
    "paymentUrl": "https://payment.url",
    "status": "pending"
  }
}
```

### GET /api/v1/pulls/:id/contributions
**Description :** Liste des contributions d'une cagnotte
**Authentification :** Optionnelle (contrôle d'accès selon visibilité)
**Données reçues :** Path param id, Query params (page, limit)
**Données renvoyées :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 5000,
      "message": "Message de soutien",
      "anonymous": false,
      "contributor": {
        "name": "Nom Contributeur"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### POST /api/v1/pulls/:id/withdraw
**Description :** Retirer les fonds d'une cagnotte
**Authentification :** JWT + Email vérifié + KYC approuvé
**Données reçues :**
```json
{
  "amount": 25000,
  "reason": "Raison du retrait"
}
```
**Données renvoyées :**
```json
{
  "success": true,
  "message": "Retrait effectué avec succès",
  "withdrawal": {
    "id": "uuid",
    "amount": 25000,
    "transactionReference": "WD-123456"
  }
}
```

---

## 4. Contributions (Contribution Routes)

Endpoints pour gérer les contributions aux cagnottes.

### GET /api/v1/contributions/stats
**Description :** Statistiques des contributions (Admin)
**Authentification :** JWT Admin
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "totalCollected": 2500000,
  "monthlyAmount": 150000,
  "monthlyCount": 30
}
```

### POST /api/v1/contributions
**Description :** Créer une contribution avec paiement
**Authentification :** JWT
**Données reçues :**
```json
{
  "pullId": "uuid",
  "amount": 10000,
  "phoneNumber": "+221701234567",
  "paymentMethod": "orange_money",
  "message": "Message optionnel",
  "isAnonymous": false
}
```
**Données renvoyées :**
```json
{
  "success": true,
  "contribution": {
    "id": "uuid",
    "amount": 10000,
    "status": "pending",
    "reference": "KOTIZ-123456"
  },
  "payment": {
    "transactionId": "tx_123",
    "paymentUrl": "https://payment.url",
    "status": "pending",
    "instructions": "SMS envoyé au +221701234567"
  }
}
```

### GET /api/v1/contributions/:id/status
**Description :** Vérifier le statut d'une contribution
**Authentification :** JWT
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "contribution": {
    "id": "uuid",
    "amount": 10000,
    "status": "completed",
    "reference": "KOTIZ-123456"
  },
  "cagnotte": {
    "id": "uuid",
    "title": "Titre cagnotte"
  },
  "transaction": {
    "status": "completed",
    "paymentMethod": "orange_money"
  }
}
```

### GET /api/v1/contributions/my
**Description :** Mes contributions
**Authentification :** JWT
**Données reçues :** Aucune
**Données renvoyées :**
```json
[
  {
    "id": "uuid",
    "amount": 5000,
    "status": "completed",
    "pullId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/v1/public/contributions/anonymous/:pullId
**Description :** Contribution anonyme (sans compte)
**Authentification :** Aucune
**Données reçues :**
```json
{
  "amount": 5000,
  "contributorName": "Anonyme",
  "contributorEmail": "email@example.com",
  "message": "Message",
  "phoneNumber": "+221701234567",
  "paymentMethod": "orange_money"
}
```
**Données renvoyées :** Similaire à POST /contributions

---

## 5. Transactions (Transaction Routes)

Endpoints pour la gestion des transactions financières.

### GET /api/v1/transactions
**Description :** Liste des transactions (Admin)
**Authentification :** JWT Admin
**Données reçues :** Query params
**Données renvoyées :** Array de transactions

### GET /api/v1/transactions/:id
**Description :** Détails d'une transaction
**Authentification :** JWT
**Données reçues :** Path param id
**Données renvoyées :** Objet transaction

---

## 6. Notifications (Notification Routes)

Endpoints pour la gestion des notifications utilisateur.

### GET /api/v1/notifications
**Description :** Liste des notifications utilisateur
**Authentification :** JWT
**Données reçues :** Aucune
**Données renvoyées :**
```json
[
  {
    "id": "uuid",
    "title": "Nouvelle contribution",
    "message": "Quelqu'un a contribué à votre cagnotte",
    "isRead": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### PUT /api/v1/notifications/:id/read
**Description :** Marquer une notification comme lue
**Authentification :** JWT
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "message": "Notification marquée comme lue"
}
```

---

## 7. Administration (Admin Routes)

Endpoints pour l'administration du système.

### GET /api/v1/admin/dashboard
**Description :** Dashboard administrateur
**Authentification :** JWT Admin
**Données reçues :** Aucune
**Données renvoyées :** Données du dashboard admin

### GET /api/v1/admin/users
**Description :** Liste des utilisateurs (Admin)
**Authentification :** JWT Admin
**Données reçues :** Query params (page, limit, etc.)
**Données renvoyées :** Liste paginée des utilisateurs

### PUT /api/v1/admin/users/:id/block
**Description :** Bloquer un utilisateur
**Authentification :** JWT Admin
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "message": "Utilisateur bloqué"
}
```

### DELETE /api/v1/admin/users/:id
**Description :** Supprimer un utilisateur
**Authentification :** JWT Admin
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "message": "Utilisateur supprimé"
}
```

### GET /api/v1/admin/pulls
**Description :** Liste des cagnottes (Admin)
**Authentification :** JWT Admin
**Données reçues :** Query params
**Données renvoyées :** Liste des cagnottes

### PUT /api/v1/admin/pulls/:id/validate
**Description :** Valider une cagnotte
**Authentification :** JWT Admin
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "message": "Cagnotte validée"
}
```

### GET /api/v1/admin/contributions
**Description :** Liste des contributions (Admin)
**Authentification :** JWT Admin
**Données reçues :** Query params (page, limit, status, etc.)
**Données renvoyées :**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### GET /api/v1/admin/retraits
**Description :** Liste des retraits (Admin)
**Authentification :** JWT Admin
**Données reçues :** Query params
**Données renvoyées :** Liste des demandes de retrait

### POST /api/v1/admin/retraits/:id/process
**Description :** Traiter un retrait
**Authentification :** JWT Admin
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "success": true,
  "message": "Retrait traité avec succès",
  "data": {
    "pullId": "uuid",
    "withdrawalAmount": 75000,
    "processedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/v1/admin/users/:id/reset-password
**Description :** Réinitialiser le mot de passe d'un utilisateur
**Authentification :** JWT Admin
**Données reçues :** Path param id
**Données renvoyées :**
```json
{
  "message": "Mot de passe réinitialisé",
  "resetToken": "token_reset_123",
  "emailSent": true
}
```

### POST /api/v1/admin/check-expired-cagnottes
**Description :** Vérifier et clôturer automatiquement les cagnottes expirées
**Authentification :** JWT Admin
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "message": "Vérification terminée",
  "checked": 25,
  "closed": 3,
  "closedCagnottes": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 8. KYC (KYC Routes)

Endpoints pour le système de vérification d'identité.

### POST /api/v1/kyc/submit
**Description :** Soumettre une vérification KYC
**Authentification :** JWT
**Données reçues :** FormData avec fichiers et données
```json
{
  "typeSubmission": "PREMIERE_SOUMISSION",
  "typePiece": "CNI",
  "numeroPiece": "123456789",
  "dateExpiration": "2025-12-31"
}
```
Files: photoRecto, photoVerso
**Données renvoyées :**
```json
{
  "message": "Soumission KYC créée avec succès",
  "data": {
    "id": "uuid",
    "typeSubmission": "PREMIERE_SOUMISSION",
    "statutVerification": "EN_ATTENTE"
  }
}
```

### GET /api/v1/kyc/history
**Description :** Historique des soumissions KYC
**Authentification :** JWT
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "message": "Historique KYC récupéré avec succès",
  "data": [...]
}
```

### GET /api/v1/kyc/status
**Description :** Statut KYC actuel
**Authentification :** JWT
**Données reçues :** Aucune
**Données renvoyées :**
```json
{
  "message": "Statut KYC récupéré avec succès",
  "data": {
    "hasActiveKyc": true,
    "id": "uuid",
    "statutVerification": "APPROUVE"
  }
}
```

### PUT /api/v1/kyc/:id/status
**Description :** Mettre à jour le statut KYC (Admin)
**Authentification :** JWT Admin
**Données reçues :**
```json
{
  "statutVerification": "APPROUVE",
  "commentaireAdmin": "Documents validés"
}
```
**Données renvoyées :**
```json
{
  "message": "Statut KYC mis à jour avec succès",
  "data": { /* données KYC */ }
}
```

---

## 9. OTP (OTP Routes)

Endpoints pour la gestion des codes OTP.

### POST /api/v1/otp/send
**Description :** Envoyer un code OTP
**Authentification :** Aucune (rate limited)
**Données reçues :**
```json
{
  "phoneNumber": "+221701234567",
  "purpose": "verification"
}
```
**Données renvoyées :**
```json
{
  "success": true,
  "message": "Code OTP envoyé",
  "phoneNumber": "+221701234567",
  "expiresIn": 300
}
```

### POST /api/v1/otp/verify
**Description :** Vérifier un code OTP
**Authentification :** Aucune (rate limited)
**Données reçues :**
```json
{
  "phoneNumber": "+221701234567",
  "code": "123456",
  "purpose": "verification"
}
```
**Données renvoyées :**
```json
{
  "success": true,
  "message": "Code vérifié avec succès"
}
```

### POST /api/v1/otp/resend
**Description :** Renvoyer un code OTP
**Authentification :** Aucune (rate limited)
**Données reçues :** Similaire à /otp/send
**Données renvoyées :** Similaire à /otp/send

---

## 10. Public (Public Routes)

Endpoints accessibles sans authentification.

### GET /api/v1/public/pulls
**Description :** Liste des cagnottes publiques
**Authentification :** Aucune
**Données reçues :** Query params (page, limit, search)
**Données renvoyées :** Similaire à GET /pulls/public

### GET /api/v1/public/pulls/:id
**Description :** Détails d'une cagnotte publique
**Authentification :** Aucune
**Données reçues :** Path param id
**Données renvoyées :** Objet cagnotte publique

### POST /api/v1/public/contributions/anonymous/:pullId
**Description :** Contribution anonyme
**Authentification :** Aucune
**Données reçues :** Similaire à POST /contributions mais anonyme
**Données renvoyées :** Similaire à POST /contributions

---

## 11. Webhooks (Webhook Routes)

Endpoints pour les notifications externes.

### POST /api/v1/webhooks/payment
**Description :** Webhook pour les notifications de paiement
**Authentification :** Validation signature (optionnel)
**Données reçues :** Données du fournisseur de paiement
**Données renvoyées :**
```json
{
  "success": true,
  "processed": true
}
```

### POST /api/v1/webhooks/sms
**Description :** Webhook pour les notifications SMS
**Authentification :** Aucune
**Données reçues :** Données du fournisseur SMS
**Données renvoyées :**
```json
{
  "success": true,
  "received": true
}
```

---

## Codes d'erreur courants

- **400** : Données invalides
- **401** : Non authentifié
- **403** : Accès refusé
- **404** : Ressource non trouvée
- **429** : Rate limit dépassé
- **500** : Erreur serveur

## Authentification

L'API utilise plusieurs types d'authentification :
1. **Firebase Auth** : Pour les utilisateurs réguliers (token Bearer)
2. **JWT Admin** : Pour les administrateurs (token Bearer)
3. **Session AdminJS** : Pour l'interface d'administration
4. **Aucune** : Pour les routes publiques

## Pagination

Les endpoints de liste supportent la pagination :
- `page` : numéro de page (défaut: 1)
- `limit` : éléments par page (défaut: 20)
- `search` : terme de recherche
- `status` : filtre par statut

## Rate Limiting

Certains endpoints sont protégés par rate limiting :
- Envoi OTP : 5 par numéro toutes les 15 minutes
- Vérification OTP : 10 par numéro toutes les 5 minutes
- Mot de passe oublié : 5 par email toutes les 15 minutes

---

**Documentation mise à jour le 30 septembre 2025 à partir du code source du backend Kotiz**
