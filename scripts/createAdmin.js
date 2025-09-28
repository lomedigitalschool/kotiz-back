#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import db from '../src/models/index.js';

const { User } = db;

const createAdmin = async () => {
  try {
    console.log('🔧 Création admin par défaut...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kotiz.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Vérifier si admin existe déjà
    let admin = await User.findOne({ 
      where: { 
        email: adminEmail,
        role: 'admin'
      }
    });

    if (admin) {
      console.log('✅ Admin existe déjà:', adminEmail);
      
      // Mettre à jour le mot de passe si nécessaire
      if (!admin.passwordHash) {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        await admin.update({ passwordHash: hashedPassword });
        console.log('✅ Mot de passe admin mis à jour');
      }
    } else {
      // Créer nouvel admin
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      admin = await User.create({
        name: 'Administrateur Kotiz',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin',
        isVerified: true,
        isBlocked: false
      });

      console.log('✅ Admin créé:', adminEmail);
    }

    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', adminPassword);
    console.log('🌐 URL Admin:', 'http://localhost:5000/admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    process.exit(1);
  }
};

createAdmin();