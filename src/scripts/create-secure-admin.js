#!/usr/bin/env node
/**
 * 🔐 Script pour créer un administrateur sécurisé
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import db from '../models/index.js';
import { logAdminAction, ADMIN_ACTIONS } from '../utils/adminLogger.js';

const { User } = db;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

const createSecureAdmin = async () => {
  try {
    console.log('🔐 Création d\'un administrateur sécurisé pour Kotiz\n');

    // Connexion à la base de données
    await db.sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie\n');

    // Demander les informations
    const name = await question('👤 Nom complet de l\'administrateur: ');
    const email = await question('📧 Email de l\'administrateur: ');
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ 
      where: { 
        email,
        role: 'admin'
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Un administrateur avec cet email existe déjà.');
      const update = await question('Voulez-vous mettre à jour son mot de passe ? (y/N): ');
      
      if (update.toLowerCase() !== 'y' && update.toLowerCase() !== 'yes') {
        console.log('❌ Opération annulée.');
        rl.close();
        process.exit(0);
      }
    }

    // Demander le mot de passe
    let password;
    let confirmPassword;
    
    do {
      password = await question('🔑 Mot de passe (min. 8 caractères): ');
      
      if (password.length < 8) {
        console.log('❌ Le mot de passe doit contenir au moins 8 caractères.\n');
        continue;
      }
      
      confirmPassword = await question('🔑 Confirmer le mot de passe: ');
      
      if (password !== confirmPassword) {
        console.log('❌ Les mots de passe ne correspondent pas.\n');
      }
    } while (password !== confirmPassword || password.length < 8);

    // Hacher le mot de passe
    console.log('\n🔄 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 12);

    let admin;
    if (existingAdmin) {
      // Mettre à jour l'admin existant
      await existingAdmin.update({
        name,
        passwordHash: hashedPassword,
        lastLogin: null
      });
      admin = existingAdmin;
      console.log('✅ Administrateur mis à jour avec succès!');
    } else {
      // Créer un nouvel admin
      admin = await User.create({
        name,
        email,
        passwordHash: hashedPassword,
        role: 'admin',
        isVerified: true,
        isBlocked: false
      });
      console.log('✅ Administrateur créé avec succès!');
    }

    // Logger l'action
    await logAdminAction(
      existingAdmin ? ADMIN_ACTIONS.SYSTEM_CONFIG_CHANGED : ADMIN_ACTIONS.ADMIN_LOGIN,
      admin,
      {
        action: existingAdmin ? 'admin_updated' : 'admin_created',
        createdBy: 'script'
      }
    );

    // Afficher les informations de connexion
    console.log('\n📋 Informations de connexion AdminJS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Mot de passe: [SÉCURISÉ]`);
    console.log(`🌐 URL AdminJS: http://localhost:${process.env.PORT || 5000}/admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Vérifier la force du mot de passe
    const passwordStrength = checkPasswordStrength(password);
    console.log(`🔒 Force du mot de passe: ${passwordStrength.level}`);
    if (passwordStrength.suggestions.length > 0) {
      console.log('💡 Suggestions pour améliorer la sécurité:');
      passwordStrength.suggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`);
      });
    }

    console.log('\n🎉 Configuration terminée! Vous pouvez maintenant vous connecter à AdminJS.');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
  } finally {
    rl.close();
    await db.sequelize.close();
    process.exit(0);
  }
};

const checkPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  const suggestions = [];

  if (!checks.length) suggestions.push('Utilisez au moins 12 caractères');
  if (!checks.uppercase) suggestions.push('Ajoutez des lettres majuscules');
  if (!checks.lowercase) suggestions.push('Ajoutez des lettres minuscules');
  if (!checks.numbers) suggestions.push('Ajoutez des chiffres');
  if (!checks.symbols) suggestions.push('Ajoutez des symboles (!@#$%^&*)');

  let level;
  if (score >= 5) level = '🟢 TRÈS FORTE';
  else if (score >= 4) level = '🟡 FORTE';
  else if (score >= 3) level = '🟠 MOYENNE';
  else level = '🔴 FAIBLE';

  return { level, suggestions };
};

// Gestion des signaux pour fermer proprement
process.on('SIGINT', () => {
  console.log('\n\n❌ Opération interrompue par l\'utilisateur.');
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n❌ Opération terminée.');
  rl.close();
  process.exit(0);
});

// Lancer le script
createSecureAdmin().catch(console.error);