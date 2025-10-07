import db from './src/models/index.js';
import bcrypt from 'bcrypt';

async function checkAdminPassword() {
  try {
    const admin = await db.User.findOne({ 
      where: { 
        email: 'admin@kotiz.com',
        role: 'admin'
      },
      raw: true 
    });

    if (admin) {
      console.log('Admin trouvé :', {
        id: admin.id,
        email: admin.email,
        passwordHash: admin.passwordHash
      });

      // Créer un nouveau hash pour comparer
      const testPassword = 'Admin123!';
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('\nTest de comparaison :');
      console.log('Nouveau hash :', newHash);
      
      // Test de comparaison directe
      const isMatch = await bcrypt.compare(testPassword, admin.passwordHash);
      console.log('Comparaison avec bcrypt :', isMatch);
    } else {
      console.log('Admin non trouvé');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur :', error);
    process.exit(1);
  }
}

checkAdminPassword();