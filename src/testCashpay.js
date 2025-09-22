require('dotenv').config();

const axios = require('axios');
const crypto = require('crypto');

// ⚠️ Variables du .env
const CASH_LOGIN = process.env.CASHPAY_LOGIN;
const CASH_API_REF = process.env.CASHPAY_API_REFERENCE;
const CASH_API_KEY = process.env.CASHPAY_API_SECRET;

console.log('🔍 Variables ENV:', {
  login: CASH_LOGIN,
  apiRef: CASH_API_REF,
  apiKey: CASH_API_KEY
});

// Générateur d’en-têtes d’authentification
function generateHeaders() {
  if (!CASH_LOGIN || !CASH_API_REF || !CASH_API_KEY) {
    throw new Error('❌ Variables CashPay manquantes ! Vérifie ton .env');
  }

  const salt = Date.now().toString();
  const apisecure = crypto
    .createHash('sha256')
    .update(CASH_LOGIN + CASH_API_KEY + salt, 'utf8')
    .digest('base64'); // 🔄 Base64

  console.log('🔑 Headers générés:', {
    login: CASH_LOGIN,
    apireference: CASH_API_REF,
    salt,
    apisecure
  });

  return {
    login: CASH_LOGIN,
    apireference: CASH_API_REF,
    salt,
    apisecure,
    'Content-Type': 'application/json'
  };
}

// Créer une facture
async function createInvoice() {
  try {
    console.log('⏳ Création facture test...');
    const response = await axios.post(
      'https://sandbox.semoa-payments.com/api/invoices/create',
      {
        amount: 25000,
        currency: 'XOF',
        description: 'Contribution Kotiz',
        callback_url: 'https://mon-backend.com/webhook/cashpay'
      },
      { headers: generateHeaders() }
    );

    console.log('✅ Facture créée:', response.data);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

createInvoice();
