# Configuration Cloudinary pour KOTIZ

## 📋 Vue d'ensemble

Ce document explique comment utiliser Cloudinary pour le stockage d'images dans l'application KOTIZ au lieu du système de fichiers local.

## 🔧 Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=daewsmlb2
CLOUDINARY_API_KEY=353679425799822
CLOUDINARY_API_SECRET=dJ5kFMuAYeZqO_cT_PRf7PiSQ-s
```

### Installation des dépendances

```bash
npm install cloudinary multer-storage-cloudinary
```

## 📁 Structure de stockage

Cloudinary organise automatiquement les fichiers dans ces dossiers :

- **`/kotiz/avatars/`** : Avatars des utilisateurs
- **`/kotiz/cagnottes/`** : Images des cagnottes
- **`/kotiz/kyc/`** : Documents KYC (pièces d'identité)

## 🚀 Utilisation

### 1. Upload d'avatar utilisateur

```javascript
// Route: POST /api/v1/users/avatar
// Middleware: uploadAvatar (depuis multerConfig.js)
// Corps: FormData avec champ 'avatar'
```

**Exemple avec curl :**
```bash
curl -X POST \
  http://localhost:5000/api/v1/users/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/avatar.jpg"
```

### 2. Upload d'image de cagnotte

```javascript
// Route: POST /api/v1/pulls/
// Middleware: uploadCagnotteImage (depuis multerConfig.js)
// Corps: FormData avec champ 'image'
```

**Exemple avec curl :**
```bash
curl -X POST \
  http://localhost:5000/api/v1/pulls/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=Ma cagnotte" \
  -F "goalAmount=50000" \
  -F "image=@/path/to/cagnotte-image.jpg"
```

### 3. Upload de documents KYC

```javascript
// Route: POST /api/v1/kyc/upload
// Middleware: uploadKycDocuments (depuis multerConfig.js)
// Corps: FormData avec champs 'photoRecto' et 'photoVerso'
```

## 🔒 Sécurité et optimisation

### Transformations automatiques

- **Avatars** : Redimensionnement 300x300px, crop facial, optimisation qualité
- **Cagnottes** : Redimensionnement max 800x600px, optimisation qualité
- **KYC** : Stockage sécurisé, pas de transformation publique

### Types de fichiers acceptés

- **Avatars** : JPG, JPEG, PNG, GIF
- **Cagnottes** : JPG, JPEG, PNG, GIF, WEBP
- **KYC** : JPG, JPEG, PNG, PDF

### Limites de taille

- **Avatars** : 5MB maximum
- **Cagnottes** : 10MB maximum
- **KYC** : 15MB maximum par fichier

## 📊 Avantages de Cloudinary

✅ **Performance** : CDN global pour chargement rapide
✅ **Sécurité** : Stockage cloud sécurisé
✅ **Optimisation** : Compression automatique des images
✅ **Transformation** : Redimensionnement et crop automatiques
✅ **Sauvegarde** : Données répliquées automatiquement
✅ **Analytics** : Suivi des usages et performances

## 🛠️ Fonctions utilitaires

### Suppression d'image

```javascript
const { deleteFromCloudinary } = require('./config/cloudinary');

// Supprimer une image par son public_id
await deleteFromCloudinary('kotiz/avatars/avatar_123456');
```

### Upload direct depuis buffer

```javascript
const { uploadFromBuffer } = require('./config/cloudinary');

// Uploader une image depuis un buffer
const result = await uploadFromBuffer(imageBuffer, {
  folder: 'kotiz/custom',
  public_id: 'custom_image'
});
```

## 🔍 Dépannage

### Erreur "NoResourceAdapterError"

Assurez-vous que tous les modèles sont correctement exportés dans `src/models/index.js`.

### Erreur "Type de fichier non supporté"

Vérifiez que le fichier correspond aux types acceptés et que la taille est dans les limites.

### Images non affichées

Vérifiez que l'URL Cloudinary est correctement stockée en base de données et accessible depuis le frontend.

## 📝 Migration depuis le système local

Si vous migrez depuis un système de fichiers local :

1. Sauvegardez vos images existantes
2. Mettez à jour les URLs en base de données
3. Testez les nouvelles fonctionnalités
4. Supprimez l'ancien dossier `uploads/` si nécessaire

---

**Configuration terminée ! 🎉**

Votre application KOTIZ utilise maintenant Cloudinary pour un stockage d'images performant et sécurisé.