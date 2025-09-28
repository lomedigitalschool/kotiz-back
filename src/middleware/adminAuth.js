/**
 * 🔐 Middleware d'authentification sécurisé pour AdminJS
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../models/index.js';

const { User, Log } = db;

// Générer un token JWT pour admin
export const generateAdminToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      type: 'admin'
    },
    process.env.JWT_SECRET || 'kotiz-admin-secret-2024',
    { expiresIn: '8h' }
  );
};

// Authentification AdminJS sécurisée
export const authenticateAdmin = async (email, password) => {
  console.log('🔐 Tentative login AdminJS:', email, password ? '***' : 'NO_PASSWORD');
  
  try {
    // Chercher l'utilisateur admin
    const user = await User.findOne({ 
      where: { 
        email,
        role: 'admin'
      }
    });

    if (!user) {
      console.log('❌ Admin non trouvé:', email);
      return null;
    }

    // Vérifier le mot de passe - UNIQUEMENT hashé pour la sécurité
    let isValidPassword = false;

    if (user.passwordHash) {
      console.log('🔍 Vérification hashé, password fourni:', password ? '***' : 'NO_PASSWORD');
      isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log('🔍 Résultat bcrypt.compare:', isValidPassword);
    } else {
      console.log('❌ ERREUR: Admin sans mot de passe hashé détecté');
      isValidPassword = false;
    }

    if (!isValidPassword) {
      console.log('❌ Mot de passe incorrect pour admin:', email);
      return null;
    }

    // Mettre à jour la dernière connexion
    await user.update({ lastLogin: new Date() });

    const adminUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    console.log('✅ Admin authentifié avec succès:', adminUser);
    return adminUser;
    
  } catch (error) {
    console.error('❌ Erreur authentification admin:', error);
    return null;
  }
};

// Middleware pour vérifier les tokens JWT admin
export const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token admin requis' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kotiz-admin-secret-2024');
    
    if (decoded.type !== 'admin' || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Utilisateur admin non trouvé' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erreur vérification token admin:', error);
    return res.status(401).json({ error: 'Token admin invalide' });
  }
};

// Fonction de validation de mot de passe fort
const validateStrongPassword = (password) => {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// Créer un admin par défaut si inexistant
export const ensureDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('⚠️ Variables ADMIN_EMAIL et ADMIN_PASSWORD non définies - admin par défaut non créé');
      return null;
    }

    // Valider la force du mot de passe
    if (!validateStrongPassword(adminPassword)) {
      console.log('❌ Mot de passe admin trop faible - doit contenir au moins 12 caractères avec majuscules, minuscules, chiffres et caractères spéciaux');
      return null;
    }

    let admin = await User.findOne({
      where: {
        email: adminEmail,
        role: 'admin'
      }
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      admin = await User.create({
        name: 'Administrateur Kotiz',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin',
        isVerified: true,
        isBlocked: false
      });

      console.log('✅ Admin par défaut créé:', adminEmail);
    } else if (!admin.passwordHash) {
      // Mettre à jour avec un mot de passe hashé
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await admin.update({ passwordHash: hashedPassword });
      console.log('✅ Mot de passe admin mis à jour avec hash');
    }

    return admin;
  } catch (error) {
    console.error('❌ Erreur création admin par défaut:', error);
    throw error;
  }
};
