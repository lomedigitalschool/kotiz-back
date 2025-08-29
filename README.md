# 🚀 Kotiz Backend

Backend API pour l'application Kotiz développée par Lome Digital School.

## ⚡ Installation Rapide

1. **Cloner le repository**
```bash
git clone https://github.com/lomedigitalschool/kotiz-back.git
cd kotiz-back
npm install
```

2. **Configuration**
```bash
cp .env.example .env
```
Modifier `.env` avec vos paramètres PostgreSQL et les configurations suivantes :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `JWT_SECRET` : Clé secrète pour les tokens JWT
- `UPLOAD_DIR` : Dossier pour les uploads KYC

3. **Base de données**
- Créer une base PostgreSQL nommée `kotiz`
- Les migrations s'exécutent **automatiquement** au démarrage
- Les méthodes de paiement sont automatiquement créées

4. **Démarrage**
```bash
npm start
```

5. **Dashboard Admin** (créé automatiquement)
   - URL: `http://localhost:3000/admin`
   - Email: `admin@kotiz.com`
   - Mot de passe: `admin123`

## 📁 Structure du projet

```
src/
├── config/             # Configurations
│   ├── database.js     # Configuration PostgreSQL
│   ├── admin.js        # Configuration AdminJS
│   └── migration.js    # Configuration des migrations
├── controllers/        # Logique métier
│   ├── authController.js
│   ├── userController.js
│   ├── cagnotteController.js
│   ├── contributionController.js
│   ├── kycController.js
│   ├── transactionController.js
│   └── notificationController.js
├── middleware/         # Middlewares
│   ├── auth.js         # Authentification JWT
│   ├── validation.js   # Validation des données
│   └── errorHandler.js # Gestion des erreurs
├── migrations/         # Migrations automatiques
├── models/            # Modèles Sequelize
│   ├── User.js
│   ├── Cagnotte.js
│   ├── Contribution.js
│   ├── Transaction.js
│   ├── PaymentMethod.js
│   ├── UserPaymentMethod.js
│   ├── Notification.js
│   ├── Log.js
│   ├── Kyc.js
│   └── index.js
├── routes/            # Routes API
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── cagnotteRoutes.js
│   ├── contributionRoutes.js
│   ├── transactionRoutes.js
│   └── notificationRoutes.js
├── utils/
│   └── migrator.js    # Migrations automatiques
└── server.js          # Point d'entrée avec AdminJS
```

## 🌐 API Endpoints

### � Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/profile` - Profil utilisateur authentifié
- `PUT /api/auth/profile` - Mise à jour du profil

### 👤 Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails d'un utilisateur
- `PUT /api/users/:id` - Mise à jour d'un utilisateur
- `DELETE /api/users/:id` - Suppression d'un utilisateur

### � Cagnottes
- `GET /api/cagnottes` - Liste des cagnottes
- `POST /api/cagnottes` - Créer une cagnotte
- `GET /api/cagnottes/:id` - Détails d'une cagnotte
- `PUT /api/cagnottes/:id` - Modifier une cagnotte
- `DELETE /api/cagnottes/:id` - Supprimer une cagnotte

### 💸 Contributions
- `POST /api/contributions` - Faire une contribution
- `GET /api/contributions` - Liste des contributions
- `GET /api/contributions/:id` - Détails d'une contribution

### ✅ KYC (Know Your Customer)
- `POST /api/kyc/submit` - Soumettre des documents KYC
- `GET /api/kyc/status` - Vérifier le statut KYC
- `PUT /api/kyc/:id/review` - Réviser un dossier KYC (admin)

### � Transactions
- `GET /api/transactions` - Liste des transactions
- `GET /api/transactions/:id` - Détails d'une transaction
- `POST /api/transactions` - Créer une transaction
- `PUT /api/transactions/:id` - Mettre à jour une transaction

### � Notifications
- `GET /api/notifications` - Liste des notifications
- `PUT /api/notifications/:id` - Marquer comme lue
- `DELETE /api/notifications/:id` - Supprimer une notification

### 👑 Administration (AdminJS)
- `GET /admin` - **Dashboard complet** (admin uniquement)
  - 👤 Gestion des utilisateurs
  - 💰 Gestion des cagnottes
  - 💸 Suivi des transactions
  - ✅ Validation KYC
  - � Logs d'activité
  - 🔔 Gestion des notifications

## 🛡️ Sécurité & Validation

### ✅ Sécurité Implémentée
- **JWT** : Authentification par tokens
- **Bcrypt** : Hachage sécurisé des mots de passe
- **CSP** : Content Security Policy pour AdminJS
- **Validation** : Middleware de validation des données
- **KYC** : Vérification d'identité avec upload de documents

### 🔒 Validation des Données
- Montants financiers > 0
- Devises : XOF, EUR, USD uniquement
- Formats d'emails valides
- Validation des fichiers uploadés
- Vérification des permissions

## 📊 Tests & Documentation

### 🧪 Tests API
- Collection Postman complète fournie
- Tests d'intégration automatisés
- Validation des endpoints
- Scénarios de test pour chaque route

### 📖 Documentation
- Documentation API complète
- Exemples de requêtes et réponses
- Guide d'utilisation du dashboard admin
- Instructions de déploiement

## � Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request
- User ↔ KYC (1:1)
- Cagnotte ↔ Contributions (1:N)
- Contribution ↔ Transaction (1:1)
- Transaction ↔ PaymentMethod (N:1)

## 🧪 Tests Automatisés

```bash
# Test de santé
curl http://localhost:3000/health

# Test des modèles
curl http://localhost:3000/test-models

# Test des relations
curl http://localhost:3000/test-relations
```

## 💻 Technologies

- **Backend** : Node.js, Express.js
- **Base de données** : PostgreSQL + Sequelize ORM
- **Admin** : AdminJS avec authentification
- **Sécurité** : bcryptjs, express-session
- **Migrations** : Système automatique au démarrage
- **Validation** : Sequelize validators + ENUM types

## 🚀 Déploiement

### Variables d'environnement requises :
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kotiz
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@kotiz.com
ADMIN_PASSWORD=admin123
SESSION_SECRET=your_session_secret
```

### Production :
- Migrations automatiques au démarrage
- Admin créé automatiquement si inexistant
- Dashboard AdminJS sécurisé
- Validation des données financières


## 📄 Licence

MIT