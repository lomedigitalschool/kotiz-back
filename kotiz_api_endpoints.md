# Kotiz API Endpoints Documentation - Frontend

Collection des endpoints API accessibles aux utilisateurs via le frontend Kotiz.

## Base URL
```
{{base_url}}/api/v1
```

---

## 🔐 1. AUTHENTIFICATION

Endpoints pour l'inscription, connexion et gestion des sessions utilisateur.

### Inscription avec OTP (⚠️ OTP TEMPORAIREMENT DÉSACTIVÉ)
- **POST** `/auth/send-registration-otp` - Envoi OTP pour inscription *(non fonctionnel)*
- **POST** `/auth/register` - Finalisation inscription avec OTP *(OTP désactivé)*

### Connexion (⚠️ FLUX OTP TEMPORAIREMENT DÉSACTIVÉ)
- **POST** `/auth/initiate-login` - Initiation connexion avec OTP *(non fonctionnel)*
- **POST** `/auth/login` - Finalisation connexion avec OTP *(non fonctionnel)*
- **POST** `/auth/login-normal` - **Connexion normale sans OTP (RECOMMANDÉ)**
- **POST** `/auth/resend-otp` - Renvoi OTP *(non fonctionnel)*

### Gestion mot de passe
- **POST** `/auth/request-password-reset` - Demande réinitialisation mot de passe
- **POST** `/auth/reset-password` - Réinitialisation mot de passe avec OTP

### Session
- **POST** `/auth/logout` - Déconnexion utilisateur
- **GET** `/auth/me` - Récupération profil utilisateur actuel

---

## 👤 2. GESTION DES UTILISATEURS

Endpoints pour la gestion des profils utilisateurs.

### Profil utilisateur
- **GET** `/users/dashboard` - Dashboard utilisateur
- **GET** `/users/:id` - Récupération profil utilisateur
- **PUT** `/users/:id` - Mise à jour profil utilisateur
- **POST** `/users/avatar` - Upload avatar utilisateur

---

## 🎯 3. GESTION DES CAGNOTTES (PULLS)

Endpoints pour créer et gérer les cagnottes.

### Cagnottes publiques (Accès sans authentification)
- **GET** `/public/pulls` - Liste cagnottes publiques *(nouveau)*
- **GET** `/public/pulls/:id` - Détails cagnotte publique *(nouveau)*

### Gestion cagnottes (Utilisateur authentifié requis)
- **POST** `/pulls` - Création nouvelle cagnotte
- **GET** `/pulls` - Liste **SES PROPRES** cagnottes *(non publiques)*
- **GET** `/pulls/:id` - Détails cagnotte spécifique *(si propriétaire)*
- **PUT** `/pulls/:id` - Mise à jour cagnotte *(si propriétaire)*
- **DELETE** `/pulls/:id` - Suppression cagnotte *(si propriétaire)*
- **POST** `/pulls/:pullId/contribute` - Contribution à une cagnotte

---

## 💰 4. CONTRIBUTIONS

Endpoints pour gérer les contributions aux cagnottes.

### Contributions utilisateurs (Authentification requise)
- **POST** `/contributions` - Créer une contribution avec paiement
- **GET** `/contributions/my` - Mes contributions
- **GET** `/contributions/:id/status` - Statut d'une contribution

### Contributions anonymes (Accès public)
- **POST** `/public/contributions/anonymous/:pullId` - Contribution anonyme *(nouveau)*

---

## 📋 5. VÉRIFICATIONS KYC

Endpoints pour le système de vérification d'identité.

### Utilisateur
- **POST** `/kyc/submit` - Soumission documents KYC
- **GET** `/kyc/history` - Historique soumissions KYC
- **GET** `/kyc/status` - Statut vérification KYC

---

## 🔔 6. NOTIFICATIONS

Endpoints pour la gestion des notifications utilisateur.

- **GET** `/notifications` - Liste notifications utilisateur
- **PUT** `/notifications/:id/read` - Marquer notification comme lue

---

## 🚨 7. SIGNALEMENTS

Endpoints pour le système de signalements.

### Utilisateur
- **POST** `/reports` - Créer un signalement

---

## 💳 8. TRANSACTIONS

Endpoints pour la gestion des transactions financières.

### Utilisateur
- **GET** `/transactions/:id` - Détails transaction
- **PUT** `/transactions/:id` - Mise à jour transaction

---

## 🏥 9. SANTÉ DU SYSTÈME

- **GET** `/health` - Vérification santé serveur

---

## 📋 10. NOUVEAUX ENDPOINTS PUBLICS (VERSION 2.0)

### 🎯 Cagnottes publiques
```javascript
// GET /api/v1/public/pulls
// Récupérer la liste des cagnottes publiques
// Paramètres: ?page=1&limit=20&search=terme&sort=popular
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Voyage à Paris",
      "goalAmount": 500000,
      "currentAmount": 150000,
      "progressPercentage": 30,
      "contributionCount": 5,
      "owner": { "name": "Jean Dupont" }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 45
  }
}

// GET /api/v1/public/pulls/:id
// Détails d'une cagnotte publique spécifique
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Voyage à Paris",
    "description": "Aidez-moi à réaliser mon rêve !",
    "recentContributions": [
      { "contributorName": "Marie", "amount": 25000, "createdAt": "2025-01-15" }
    ]
  }
}
```

### 💰 Contributions anonymes
```javascript
// POST /api/v1/public/contributions/anonymous/:pullId
// Créer une contribution anonyme
{
  "pullId": 1,
  "amount": 50000,
  "contributorName": "Pierre Anonyme",
  "contributorEmail": "pierre@email.com",
  "message": "Bonne chance pour ton voyage !",
  "phoneNumber": "771234567",
  "paymentMethod": "orange_money"
}

// Réponse
{
  "success": true,
  "contribution": {
    "id": 123,
    "amount": 50000,
    "status": "pending",
    "contributorName": "Pierre Anonyme"
  },
  "payment": {
    "transactionId": "TXN-12345",
    "paymentUrl": "https://payment-provider.com/pay/12345",
    "instructions": "Un SMS sera envoyé au 771234567"
  },
  "redirectUrl": "https://payment-provider.com/pay/12345"
}
```

---

## ⚠️ IMPORTANT : STATUT ACTUEL DE L'API

### 🔐 Authentification
- **Les OTP sont TEMPORAIREMENT DÉSACTIVÉS** dans le code (lignes commentées)
- **Utilisez `/auth/login-normal`** pour la connexion (sans OTP)
- L'inscription fonctionne sans vérification OTP

### 🎯 Cagnottes
- **Toutes les routes `/pulls` nécessitent authentification**
- `GET /pulls` retourne uniquement les cagnottes de l'utilisateur connecté
- Pas de liste publique des cagnottes disponible

### 📝 Notes importantes

- **Endpoints publics** : `/public/*` ne nécessitent pas d'authentification
- **Endpoints utilisateurs** : Nécessitent `Authorization: Bearer <token>`
- **Contributions anonymes** : Permettent aux visiteurs de contribuer sans compte
- Utilisez `{{base_url}}` comme variable d'environnement pour l'URL de base
- La pagination est disponible sur les endpoints de liste avec paramètres `?page=1&limit=10`
- Les endpoints admin sont gérés uniquement côté backend
