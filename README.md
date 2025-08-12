# Kotiz Backend

Backend API pour l'application Kotiz développée par Lome Digital School.

## Installation

1. Cloner le repository
```bash
git clone https://github.com/lomedigitalschool/kotiz-back.git
cd kotiz-back
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```
Modifier le fichier `.env` avec vos propres valeurs.

4. Démarrer PostgreSQL (assurez-vous que PostgreSQL est installé et en cours d'exécution)
   Créer une base de données nommée 'kotiz'

5. Créer un utilisateur administrateur
```bash
npm run create-admin
```

6. Lancer l'application
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

7. Accéder à l'interface d'administration
   - URL: http://localhost:3000/admin
   - Email: admin@kotiz.com (ou celui défini dans .env)
   - Mot de passe: admin123 (ou celui défini dans .env)

## Structure du projet

```
src/
├── config/          # Configuration (base de données, etc.)
├── controllers/     # Contrôleurs de l'API
├── middleware/      # Middleware personnalisés
├── models/          # Modèles Sequelize
├── routes/          # Routes de l'API
└── server.js        # Point d'entrée de l'application
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur (authentifié)

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (admin)
- `GET /api/users/:id` - Utilisateur par ID (admin)
- `PUT /api/users/profile` - Mettre à jour le profil (authentifié)
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)

### Contributions
- `POST /api/contributions` - Créer une contribution (anonyme ou authentifié)
- `GET /api/contributions/approved` - Contributions approuvées (public)
- `GET /api/contributions` - Toutes les contributions (admin)
- `PUT /api/contributions/:id/status` - Modifier le statut (admin)

### Administration
- `GET /admin` - Interface d'administration AdminJS (admin seulement)
  - Gestion des utilisateurs
  - Gestion des contributions
  - Statistiques
  - Configuration

## Technologies utilisées

- Node.js
- Express.js
- PostgreSQL avec Sequelize
- JWT pour l'authentification
- bcryptjs pour le hachage des mots de passe
- express-validator pour la validation
- AdminJS pour l'interface d'administration

## Licence

MIT