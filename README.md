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
Modifier `.env` avec vos paramètres PostgreSQL.

3. **Base de données**
- Créer une base PostgreSQL nommée `kotiz`
- Les migrations s'exécutent **automatiquement** au démarrage

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
├── config/
│   ├── database.js      # Configuration PostgreSQL
│   └── admin.js         # Configuration AdminJS
├── migrations/          # Migrations automatiques (10 fichiers)
├── models/              # 9 modèles Sequelize avec relations
│   ├── User.js          # Utilisateurs (user/admin)
│   ├── pull.js      # pulls avec validation
│   ├── Contribution.js  # Contributions
│   ├── Transaction.js   # Transactions financières
│   ├── PaymentMethod.js # Méthodes de paiement
│   ├── UserPaymentMethod.js # Association users ↔ payments
│   ├── Notification.js  # Notifications système
│   ├── Log.js          # Journalisation
│   ├── Kyc.js          # Vérification d'identité
│   └── index.js        # Relations entre modèles
├── utils/
│   └── migrator.js     # Migrations automatiques
├── scripts/
│   └── create-admin.js # Création admin automatique
└── server.js           # Point d'entrée avec AdminJS
```

## 🌐 API Endpoints

### 🛠️ Utilitaires
- `GET /health` - Santé de l'API et base de données
- `GET /test-models` - Test de création des modèles
- `GET /test-relations` - Test des relations entre modèles

### 👑 Administration (AdminJS)
- `GET /admin` - **Dashboard complet** (admin uniquement)
  - 👤 Gestion des utilisateurs (user/admin)
  - 🎯 Approbation des pulls
  - 💰 Suivi des contributions
  - 💳 Gestion des méthodes de paiement
  - 🔔 Notifications système
  - 📊 Logs d'activité
  - ✅ Validation KYC
  - 💸 Transactions financières

### 🔐 Authentification (À implémenter)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur

### 📱 API Mobile/Web (À implémenter)
- `GET /api/pulls` - pulls publiques
- `POST /api/pulls` - Créer une pull
- `POST /api/contributions` - Faire une contribution
- `GET /api/payment-methods` - Méthodes de paiement disponibles

## 🛡️ Fonctionnalités de Sécurité

### ✅ Validations Implémentées
- **Montants financiers** : Validation > 0 pour contributions/pulls
- **Devises** : Limitées à XOF, EUR, USD (ENUM)
- **Mots de passe** : Hachage bcrypt automatique
- **KYC** : Validation des documents d'identité
- **Authentification AdminJS** : Accès admin uniquement

### 🔗 Relations Testées
- User ↔ pulls (1:N)
- User ↔ Contributions (1:N)
- User ↔ KYC (1:1)
- pull ↔ Contributions (1:N)
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