import axios from 'axios';
import crypto from 'crypto';

/**
 * Service de paiement pour l'API Semoa/CashPay, gérant l'authentification propriétaire (SHA-256)
 * et les flux d'initialisation de paiement.
 */
class PaymentService {
    constructor() {
        // --- 1. Récupération des variables d'environnement ---
        this.apiUrl = process.env.SEMOA_API_URL?.trim() || '';
        this.apiKey = process.env.SEMOA_API_KEY || ''; 
        this.username = process.env.SEMOA_USERNAME || ''; 
        this.password = process.env.SEMOA_PASSWORD || '';
        
        // 🚨 CONFIGURATION OAUTH/PROPRIÉTAIRE
        this.clientId = process.env.SEMOA_LOGIN_ID || 'cashpay'; 
        this.clientSecret = process.env.SEMOA_CLIENT_SECRET || ''; // Utilise la même clé que l'API key
        
        this.apiUrl = this.apiUrl.replace(/\/+$/, '');

        this.accessToken = null;
        this.tokenExpiry = null;
    }
    
    /**
     * Calcule la signature de sécurité Semoa en Base64 standard (pour ApiSecure).
     */
    _generateBase64Headers(login, salt) {
        const apiRef = this.apiKey; 
        
        // Calcul de l'API Secure : SHA-256(login + apikey + salt) en Base64 STANDARD
        const secureHash = crypto
            .createHash('sha256')
            .update(login + this.apiKey + salt) 
            .digest('base64'); 

        return {
            digest: secureHash, 
            secureHeaders: {
                'Login': login, 
                'ApiReference': apiRef, 
                'Salt': salt, 
                // 🚨 ApiSecure DOIT contenir le hash Base64 STANDARD
                'ApiSecure': secureHash, 
                'Apikey': this.apiKey, 
            }
        };
    }

    /**
     * Récupère le jeton d'accès Semoa (pour l'Authorization Bearer).
     * TENTATIVE N°12: Retour aux champs 'client_id' et 'client_secret' dans le corps POST /auth.
     * @returns {Promise<string>} Le jeton d'accès
     */
    async getAccessToken() {
        if (!this.apiUrl || !this.username || !this.password || !this.clientSecret) {
            console.error('ERREUR DE CONFIGURATION: Les identifiants Semoa sont manquants ou vides.');
            throw new Error('Impossible d\'obtenir le jeton car la configuration Semoa est incomplète.');
        }

        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
            return this.accessToken;
        }

        const authEndpoint = `${this.apiUrl}/auth`; 
        
        try {
            console.log('🔄 Tentative d\'obtention du jeton via l\'endpoint /auth (POST JSON SANS Headers Propriétaires)...');
            console.log(`[DEBUG] Tentative de connexion à: ${authEndpoint}`);
            
            // 🚨 CHANGEMENT DE NOM DE CHAMP : TENTATIVE N°12 (Retour aux standards OAuth)
            const authBody = {
                username: this.username,
                password: this.password, 
                // CHANGEMENT: Retour à 'client_id'
                client_id: this.clientId, 
                // CHANGEMENT: Retour à 'client_secret'
                client_secret: this.clientSecret,
                // NOTE: Si cela échoue, la prochaine étape sera d'essayer `grant_type: 'password'`
            };
            
            console.log("[DEBUG] Corps /auth utilisé: ", JSON.stringify(authBody));

            const response = await axios.post(
                authEndpoint,
                authBody, 
                {
                    headers: {
                        'Content-Type': 'application/json', 
                    },
                }
            );

            const token = response.data.access_token;
            if (!token) {
                 // La réponse précédente était 'Invalid client credentials'
                 console.error('❌ Échec obtention du jeton: "access_token" est manquant dans la réponse /auth. Données reçues:', response.data); 
                 throw new Error('Jeton d\'accès non trouvé dans la réponse du serveur.');
            }
            
            this.accessToken = token;
            const expiresIn = response.data.expires_in || 3600; 
            this.tokenExpiry = Date.now() + expiresIn * 1000;

            console.log('✅ Jeton Semoa obtenu avec succès via POST /auth.');
            return this.accessToken;

        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            if (error.response) {
                 console.error('❌ Échec obtention du jeton (Status:', error.response.status, '):', error.response.data);
            } else {
                 console.error('❌ Échec obtention du jeton (Réseau):', errorDetails);
            }
            throw new Error('Impossible d’obtenir le jeton Semoa.');
        }
    }

    /**
     * Initialise un paiement via l'API Semoa.
     * @param {object} paymentData Les données de paiement
     * @returns {Promise<object>} Le résultat du paiement
     */
    async initiatePayment(paymentData) {
        try {
            const token = await this.getAccessToken(); 
            
            if (!token) {
                console.error("ERREUR: Le jeton Bearer est vide après l'acquisition.");
                throw new Error("Jeton d'accès vide.");
            }
            
            const salt = Date.now().toString(); 
            const { secureHeaders } = this._generateBase64Headers(this.username, salt);
            
            const paymentEndpoint = `${this.apiUrl}/api/v1/initiate`;
            
            const authorizationHeader = `Bearer ${token}`; 

            console.log(`[DEBUG] Tentative d'initialisation avec Authorization: ${authorizationHeader.substring(0, 30)}... (Bearer Token) ET les 5 Secure Headers (Majuscule).`);
            
            const response = await axios.post(
                paymentEndpoint,
                {
                    amount: paymentData.amount,
                    currency: 'XOF', 
                    description: paymentData.description,
                    paymentMethod: 'mobile_money', 
                    returnUrl: paymentData.returnUrl,
                    notificationUrl: paymentData.callbackUrl, 
                    reference: paymentData.reference,
                    phoneNumber: paymentData.phoneNumber,
                },
                {
                    headers: {
                        'Authorization': authorizationHeader, 
                        'Content-Type': 'application/json',
                        ...secureHeaders, 
                    },
                }
            );

            return {
                success: true,
                paymentUrl: response.data.redirectUrl,
                transactionId: response.data.reference, 
                providerResponse: response.data,
            };

        } catch (error) {
            const errorDetails = error.response?.data || error.message;
            if (error.response) {
                 console.error('❌ ERREUR LORS DE L\'INITIALISATION DU PAIEMENT SEMOA (Status:', error.response.status, '):', error.response.data);
            } else {
                 console.error('❌ ERREUR LORS DE L\'INITIALISATION DU PAIEMENT SEMOA:', errorDetails);
            }
            return {
                success: false,
                error: 'Erreur lors de l\'initialisation du paiement.',
                details: errorDetails
            };
        }
    }
    
    /**
     * Traite le webhook de paiement de Semoa. (Fonction conservée)
     */
    async processWebhook(body, signature) {
        // ... (Pas de changement)
        const reference = body.reference || body.transactionRef;
        const statusText = body.status || body.transactionStatus; 
        
        let status;
        if (statusText && statusText.toUpperCase().includes('SUCCESS')) {
            status = 'completed';
        } else if (statusText && statusText.toUpperCase().includes('FAIL')) {
            status = 'failed';
        } else {
            status = 'pending';
        }

        if (!reference) {
            return { success: false, error: "Référence de transaction manquante dans le webhook." };
        }

        return {
            success: true,
            reference: reference,
            status: status,
            amount: body.amount,
            providerTransactionId: body.transactionId,
        };
    }
    
    /**
     * Vérifie le statut d'un paiement Semoa (GET /api/v1/status)
     * @param {string} providerTransactionId ID de la transaction fourni par Semoa
     * @returns {Promise<object>} Le statut du paiement
     */
    async checkPaymentStatus(providerTransactionId) {
        try {
            const token = await this.getAccessToken();
            
            if (!token) {
                console.error("ERREUR: Le jeton Bearer est vide après l'acquisition.");
                throw new Error("Jeton d'accès vide.");
            }
            
            const salt = Date.now().toString();
            const { secureHeaders } = this._generateBase64Headers(this.username, salt);
            
            const statusEndpoint = `${this.apiUrl}/api/v1/status?transactionId=${providerTransactionId}`;
            
            const authorizationHeader = `Bearer ${token}`;

            const response = await axios.get(
                statusEndpoint,
                {
                    headers: {
                        'Authorization': authorizationHeader,
                        ...secureHeaders, 
                    },
                }
            );
            
            const statusText = response.data.status;
            let status;
            if (statusText && statusText.toUpperCase().includes('SUCCESS')) {
                status = 'completed';
            } else if (statusText && statusText.toUpperCase().includes('FAIL')) {
                status = 'failed';
            } else {
                status = 'pending';
            }

            return {
                success: true,
                status: status,
                details: response.data,
            };
            
        } catch (error) {
            console.error(`❌ ERREUR LORS DE LA VÉRIFICATION DU STATUT (${providerTransactionId}):`, error.message);
            return {
                success: false,
                error: 'Impossible de vérifier le statut auprès du fournisseur.',
                details: error.message
            };
        }
    }
}

// Exportation de l'instance unique
export default new PaymentService();
