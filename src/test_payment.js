// test_payment.js

import dotenv from 'dotenv';
import path from 'path';

// Charge les variables d'environnement à partir du fichier .env
// Assurez-vous que votre fichier .env est dans le répertoire racine
dotenv.config(); 

// CORRECTION DU CHEMIN D'IMPORTATION : 
// Le chemin correct est maintenant './services/payment.service.js' car le script est dans 'src/'
import PaymentService from './services/payment.service.js';

// --- CONFIGURATION DE TEST ---
const TEST_DATA = {
    amount: 1000, // 1000 XOF (Le service le convertit en centimes automatiquement)
    phoneNumber: "22890909090", // Numéro de téléphone de test Semoa (à vérifier dans la doc)
    reference: `TEST-KOTIZ-${Date.now()}`,
    description: "Test d'initialisation de cagnotte",
    // Ces URLs doivent être valides, même si elles ne sont pas accessibles
    callbackUrl: `${process.env.BASE_URL}/api/v1/webhooks/payment`,
    returnUrl: `${process.env.FRONTEND_URL}/test-callback` 
};

/**
 * Fonction principale pour tester l'initialisation du paiement
 */
async function runPaymentTest() {
    console.log('----------------------------------------------------');
    console.log('🚀 Démarrage du test d\'initialisation Semoa (Sandbox)');
    console.log('----------------------------------------------------');
    
    // Vérification des variables d'environnement (pour le débogage)
    if (!process.env.SEMOA_API_KEY || !process.env.SEMOA_USERNAME) {
        console.error("❌ ERREUR : Les variables d'environnement SEMOA ne sont pas chargées.");
        return;
    }

    console.log(`Clé API: ${process.env.SEMOA_API_KEY.substring(0, 5)}...`);
    console.log(`URL de base: ${process.env.SEMOA_API_URL}`);
    console.log(`Référence de test: ${TEST_DATA.reference}`);

    const paymentResult = await PaymentService.initiatePayment(TEST_DATA);

    console.log('\n--- RÉSULTAT DE L\'API SEMOA ---');
    if (paymentResult.success) {
        console.log('✅ SUCCÈS: Paiement initié avec succès !');
        console.log(`  Transaction ID (Semoa): ${paymentResult.transactionId}`);
        console.log(`  URL de Redirection: ${paymentResult.paymentUrl}`);
        console.log('  Instruction: Redirigez l\'utilisateur vers cette URL pour finaliser.');
    } else {
        console.log('❌ ÉCHEC: Erreur d\'initialisation du paiement.');
        console.log(`  Erreur: ${paymentResult.error}`);
        console.log(`  Détails: ${JSON.stringify(paymentResult.details, null, 2)}`);
        console.log('\nNOTE: Si l\'erreur est une "Authentication failed", vérifiez vos identifiants SEMOA dans le fichier .env.');
    }
    console.log('----------------------------------------------------');
}

runPaymentTest();
