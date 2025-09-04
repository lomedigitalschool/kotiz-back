# Kotiz Backend API

API backend pour l'application Kotiz développée par Lome Digital School avec système KYC multi-soumissions et **endpoints publics pour l'accès anonyme aux cagnottes** (v2.0).

## 🚀 Fonctionnalités

### Système d'authentification
- Inscription et connexion utilisateur
- Authentification JWT
- Gestion des profils utilisateur

### Système KYC Multi-Soumissions
- **Première soumission** : Vérification initiale
- **Nouvelle tentative** : Après un refus
- **Renouvellement** : Après expiration
- **Correction** : Modification d'informations
- Upload de documents (recto/verso)
- Historique complet des soumissions
- Interface d'administration pour validation

### Gestion des Cagnottes
- Création de cagnottes publiques/privées
- Contributions avec messages
- Suivi des objectifs
- Upload d'images
- **Accès public aux cagnottes** (nouveau)
- **Contributions anonymes** (nouveau)

### Administration
- Interface AdminJS intégrée
- Gestion des utilisateurs et KYC
- Statistiques et rapports

### Nouvelles fonctionnalités (v2.0)
- **Endpoints publics** : Accès aux cagnottes sans authentification
- **Contributions anonymes** : Possibilité de contribuer sans créer de compte
- **API optimisée** : Pagination et recherche avancées

## 📋 Installation

### Prérequis
- Node.js (v16+)
- PostgreSQL
- npm ou yarn

### Configuration

1. **Cloner le repository**
```bash
git clone https://github.com/lomedigitalschool/kotiz-back.git
cd kotiz-back
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de la base de données**
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables dans .env
DB_NAME=kotiz_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

4. **Lancer l'application**
```bash
# Développement
npm run dev

# Production
npm start
```

## 🏗️ Architecture

### Structure des dossiers
```
src/
├── config/          # Configuration (DB, AdminJS)
├── controllers/     # Logique métier
├── middleware/      # Middlewares (auth, multer, validation)
├── migrations/      # Migrations de base de données
├── models/          # Modèles Sequelize
├── routes/          # Routes API
├── scripts/         # Scripts utilitaires
└── utils/           # Fonctions utilitaires
```

### Modèles de données

#### User (Utilisateur)
```javascript
{
  id: INTEGER (PK),
  name: STRING,
  email: STRING (unique),
  phone: STRING (unique),
  passwordHash: STRING,
  role: ENUM('user', 'admin'),
  avatarUrl: STRING,
  isVerified: BOOLEAN,
  lastLogin: DATE
}
```

#### KYC (Vérification d'identité)
```javascript
{
  id: UUID (PK),
  userId: INTEGER (FK),
  typeSubmission: ENUM('PREMIERE_SOUMISSION', 'NOUVELLE_TENTATIVE', 'RENOUVELLEMENT', 'CORRECTION'),
  typePiece: ENUM('CNI', 'PASSPORT', 'PERMIS_CONDUIRE'),
  numeroPiece: STRING,
  dateExpiration: DATE,
  photoRecto: STRING,
  photoVerso: STRING,
  statutVerification: ENUM('EN_ATTENTE', 'APPROUVE', 'REFUSE'),
  commentaireAdmin: TEXT,
  submissionDate: DATE,
  isActive: BOOLEAN
}
```

#### Pull (Cagnotte)
```javascript
{
  id: UUID (PK),
  userId: INTEGER (FK),
  title: STRING,
  description: TEXT,
  goalAmount: DECIMAL,
  currentAmount: DECIMAL,
  currency: STRING,
  deadline: DATE,
  type: ENUM('public', 'private'),
  status: ENUM('active', 'completed', 'cancelled'),
  imageUrl: STRING
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/login-normal` - Connexion sans OTP
- `GET /api/v1/auth/me` - Profil utilisateur

### Public Endpoints (No Authentication Required)
- `GET /api/v1/public/pulls` - Liste cagnottes publiques *(nouveau)*
- `GET /api/v1/public/pulls/:id` - Détails cagnotte publique *(nouveau)*
- `POST /api/v1/public/contributions/anonymous/:pullId` - Contribution anonyme *(nouveau)*

### KYC Management
- `POST /api/v1/kyc/submit` - Soumettre documents KYC
- `GET /api/v1/kyc/history` - Historique des soumissions
- `GET /api/v1/kyc/status` - Statut KYC actuel
- `PUT /api/v1/kyc/:id/status` - Mettre à jour statut (Admin)
- `GET /api/v1/kyc/admin/all` - Toutes les soumissions (Admin)

### Cagnottes (Authentification requise)
- `POST /api/v1/pulls` - Créer une cagnotte
- `GET /api/v1/pulls` - Lister ses propres cagnottes
- `GET /api/v1/pulls/:id` - Détails d'une cagnotte
- `PUT /api/v1/pulls/:id` - Modifier une cagnotte
- `DELETE /api/v1/pulls/:id` - Supprimer une cagnotte
- `POST /api/v1/pulls/:pullId/contribute` - Contribuer à une cagnotte

### Contributions (Authentification requise)
- `POST /api/v1/contributions` - Faire une contribution
- `GET /api/v1/contributions/my` - Mes contributions
- `GET /api/v1/contributions/:id/status` - Statut d'une contribution

### Users (Authentification requise)
- `GET /api/v1/users/dashboard` - Dashboard utilisateur
- `GET /api/v1/users/:id` - Profil utilisateur
- `PUT /api/v1/users/:id` - Mettre à jour le profil
- `POST /api/v1/users/avatar` - Upload avatar

### Utilisation des endpoints publics

#### Découverte des cagnottes (sans compte)
```bash
# Lister toutes les cagnottes publiques
GET /api/v1/public/pulls?page=1&limit=10&search=voyage

# Voir les détails d'une cagnotte
GET /api/v1/public/pulls/123
```

#### Contribution anonyme
```bash
# Contribuer sans créer de compte
POST /api/v1/public/contributions/anonymous/123
{
  "amount": 50000,
  "contributorName": "Pierre Anonyme",
  "phoneNumber": "771234567",
  "paymentMethod": "orange_money"
}
```

## 📁 Upload de fichiers

### Configuration Multer
- **Dossier de stockage** : `uploads/kyc/{userId}/{timestamp}/`
- **Types acceptés** : JPG, PNG, PDF
- **Taille maximale** : 5MB par fichier
- **Fichiers par soumission** : 2 (recto + verso)

### Structure des uploads
```
uploads/
└── kyc/
    └── {userId}/
        └── {timestamp}/
            ├── photoRecto-{unique}.jpg
            └── photoVerso-{unique}.jpg
```

## 🔐 Sécurité

### Authentification
- JWT avec expiration
- Middleware d'authentification sur routes protégées
- Vérification des rôles (user/admin)

### Upload de fichiers
- Validation des types MIME
- Limitation de taille
- Noms de fichiers sécurisés
- Stockage organisé par utilisateur

### Base de données
- Hachage des mots de passe (bcrypt)
- Validation des données d'entrée
- Protection contre l'injection SQL (Sequelize ORM)

## 🛠️ Développement

### Scripts disponibles
```bash
npm run dev          # Développement avec nodemon
npm start           # Production
npm test            # Tests unitaires
npm run create-admin # Créer un administrateur
```

### Variables d'environnement
```env
# Base de données
DB_NAME=kotiz_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Serveur
PORT=3000
NODE_ENV=development

# AdminJS
ADMIN_EMAIL=admin@kotiz.com
ADMIN_PASSWORD=admin123
```

## 📊 Administration

### Interface AdminJS
- **URL** : `http://localhost:3000/admin`
- **Identifiants par défaut** :
  - Email : `admin@kotiz.com`
  - Mot de passe : `admin123`

### Fonctionnalités admin
- Gestion des utilisateurs
- Validation des soumissions KYC
- Modération des cagnottes
- Statistiques et rapports

## 🧪 Tests

### Collection Postman
Importez le fichier `Kotiz_API_Collection.postman_collection.json` dans Postman pour tester tous les endpoints.

### Variables Postman
- `base_url` : `http://localhost:5000/api/v1`
- `auth_token` : Token JWT obtenu après connexion

### Nouveaux endpoints à tester (v2.0)
- **Endpoints publics** : Testez sans authentification
- **Contributions anonymes** : Testez avec données fictives
- **Pagination** : Testez avec `?page=1&limit=5`

## 🚀 Déploiement

### Production
1. Configurer les variables d'environnement
2. Installer les dépendances : `npm ci`
3. Lancer les migrations : `npm run migrate`
4. Démarrer l'application : `npm start`

### Docker (optionnel)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

Développé par **Lome Digital School**

- 📧 Contact : contact@lomedigitalschool.com
- 🌐 Site web : https://lomedigitalschool.com

---

**Kotiz** - Plateforme de cagnottes collaboratives avec vérification d'identité sécurisée.