const axios = require('axios');
const querystring = require('querystring');

const API_BASE_URL = 'https://api.semoa-payments.ovh/sandbox';
const API_KEY = 'dBirFPoKa5XyQZLB4j8MA7AzPrbxBLuAQ54h';
const CLIENT_ID = 'cashpay';
const CLIENT_SECRET = 'HpuNOm3sDOkAvd8v3UCIxiBu68634BBs';
const USERNAME = 'api_cashpay.zedeka';
const PASSWORD = 'yVf95Q8SBT';

let accessToken = null;
let tokenExpiry = null;

/**
 * Récupère le token d'accès pour l'API Semoa.
 * Met en cache le token pour éviter des requêtes répétées.
 * @returns {Promise<string>} Le token d'accès
 */
async function getAccessToken() {
    if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
        return accessToken;
    }

    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/v1/auth/token`,
            querystring.stringify({
                grant_type: 'password',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                username: USERNAME,
                password: PASSWORD,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Apikey': API_KEY,
                },
            }
        );

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + response.data.expires_in * 1000;
        console.log('✅ Token Semoa récupéré avec succès. Expiration dans', response.data.expires_in, 'secondes.');
        return accessToken;

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du token Semoa:', error.response?.data || error.message);
        throw new Error('Impossible d\'authentifier auprès de Semoa.');
    }
}

/**
 * Initialise un paiement via l'API CashPay.
 * @param {object} paymentData Les données de paiement (amount, currency, etc.)
 * @returns {Promise<object>} Le résultat du paiement
 */
async function initiatePayment(paymentData) {
    try {
        const token = await getAccessToken();

        const response = await axios.post(
            `${API_BASE_URL}/api/v1/initiate`,
            {
                amount: paymentData.amount,
                currency: paymentData.currency,
                description: paymentData.description,
                paymentMethod: paymentData.paymentMethod, // e.g., 'mobile_money'
                returnUrl: paymentData.returnUrl,
                notificationUrl: paymentData.notificationUrl,
                reference: paymentData.reference,
                phoneNumber: paymentData.phoneNumber,
                // Semoa supporte aussi l'email, mais nous n'en avons pas besoin pour le mobile money
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('✅ Paiement initié avec succès. Référence Semoa:', response.data.reference);

        return {
            success: true,
            paymentUrl: response.data.redirectUrl,
            transactionId: response.data.reference, // La référence de Semoa
            status: 'pending',
            providerResponse: response.data
        };

    } catch (error) {
        console.error('❌ Erreur lors de l\'initiation du paiement Semoa:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || { message: 'Erreur inconnue' }
        };
    }
}

/**
 * Traite les données reçues d'un webhook Semoa.
 * @param {object} webhookData Les données brutes du webhook
 * @returns {object} Le résultat traité
 */
function processSemoaWebhook(webhookData) {
    // La documentation de l'API de Semoa ne mentionne pas de signature
    // de webhook, donc nous traitons les données directement.
    // NOTE: Dans un environnement de production, une vérification de la
    // signature serait CRUCIALE pour la sécurité.

    if (webhookData.status && webhookData.reference) {
        return {
            success: true,
            reference: webhookData.reference,
            status: webhookData.status,
            amount: webhookData.amount,
        };
    }
    return {
        success: false,
        error: 'Données de webhook invalides'
    };
}

/**
 * Vérifie le statut d'une transaction via l'API Semoa.
 * @param {string} transactionReference La référence de la transaction
 * @returns {Promise<object>} Le résultat du statut
 */
async function checkPaymentStatus(transactionReference) {
    try {
        const token = await getAccessToken();
        const response = await axios.get(
            `${API_BASE_URL}/api/v1/status/${transactionReference}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        console.log('✅ Statut de transaction Semoa récupéré:', response.data.status);
        return {
            success: true,
            status: response.data.status,
            providerResponse: response.data
        };

    } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut Semoa:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || { message: 'Erreur inconnue' }
        };
    }
}

module.exports = {
    initiatePayment,
    processSemoaWebhook,
    checkPaymentStatus
};
