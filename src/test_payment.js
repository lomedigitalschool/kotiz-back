// 🚨 CORRECTION POUR LES MODULES ES (ESM):
// Dans un environnement "type": "module", on utilise l'import pour charger dotenv
// La simple importation de 'dotenv/config' exécute la configuration
import 'dotenv/config'; 

import PaymentService from './services/payment.service.js';

// --- Définition des données de test ---
const paymentService = PaymentService; // Instance unique
const testData = {
  amount: 100, // Montant en unités de la monnaie locale (ex: XOF)
  phoneNumber: '92000000', // Numéro de téléphone de test Mobile Money
  description: 'Test Kotiz',
  reference: `TEST-KOTIZ-${Date.now()}`,
  callbackUrl: 'http://localhost:5000/api/payment/webhook',
  returnUrl: 'http://localhost:5000/api/payment/return',
};

async function runTest() {
    console.log('----------------------------------------------------');
    console.log('🚀 Démarrage du test d\'initialisation Semoa (Sandbox)');
    console.log('----------------------------------------------------');
  

console.log('🌍 SEMOA_API_URL:', process.env.SEMOA_API_URL);
console.log('👤 SEMOA_USERNAME:', process.env.SEMOA_USERNAME);
console.log('🔑 SEMOA_API_KEY:', process.env.SEMOA_API_KEY ? '✅ définie' : '❌ manquante');

    console.log(`Clé API: ${paymentService.apiKey?.substring(0, 5)}...`);
    console.log(`URL de base: ${paymentService.apiUrl}`);
    console.log(`Référence de test: ${testData.reference}`);
    
    // Si l'URL de base est manquante, le service affichera l'erreur.
    if (!paymentService.apiUrl) {
        return; 
    }

    try {
        const result = await paymentService.initiatePayment(testData);

        console.log('\n--- RÉSULTAT DE L\'API SEMOA ---');
        if (result.success) {
            console.log('✅ SUCCÈS: Paiement initié.');
            console.log(`   ID de transaction Semoa: ${result.transactionId}`);
            console.log(`   URL de redirection: ${result.paymentUrl}`);
        } else {
            console.log('❌ ÉCHEC: Erreur d\'initialisation du paiement.');
            console.log(`   Erreur: ${result.error}`);
            console.log(`   Détails: ${result.details}`);
        }
    } catch (e) {
        console.log('❌ ERREUR CATCHÉE DANS LE TEST:', e.message);
    } finally {
        console.log('\nNOTE: Si l\'erreur est une "Authentication failed", vérifiez vos identifiants SEMOA dans le fichier .env.');
        console.log('----------------------------------------------------');
    }
}

runTest();
