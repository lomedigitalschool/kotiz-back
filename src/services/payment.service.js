import axios from "axios";

/**
 * ✅ Service de paiement SEMOA/CashPay utilisant OAuth2 (Bearer Token)
 */
class PaymentService {
  constructor() {
    // Chargement des variables d’environnement
    this.apiUrl = process.env.SEMOA_API_URL?.trim().replace(/\/+$/, "") || "";
    this.username = process.env.SEMOA_USERNAME || "";
    this.password = process.env.SEMOA_PASSWORD || "";
    this.clientId = process.env.SEMOA_CLIENT_ID || "cashpay";
    this.clientSecret = process.env.SEMOA_CLIENT_SECRET || "";
    this.apiKey = process.env.SEMOA_API_KEY || "";

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * 🔐 Authentification OAuth2 : Récupération du Bearer Token
   */
  async getAccessToken() {
    if (
      !this.apiUrl ||
      !this.username ||
      !this.password ||
      !this.clientId ||
      !this.clientSecret
    ) {
      throw new Error("❌ Identifiants OAuth2 manquants dans .env");
    }

    // Si le token est encore valide, on le réutilise
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    const authEndpoint = `${this.apiUrl}/auth`;
    const body = {
      username: this.username,
      password: this.password,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    try {
      console.log("🔑 Obtention du Bearer Token depuis /auth...");
      const res = await axios.post(authEndpoint, body, {
        headers: { "Content-Type": "application/json" },
      });

      const data = res.data;
      if (!data.access_token) {
        console.error("❌ 'access_token' manquant:", data);
        throw new Error("Jeton d’accès non trouvé dans la réponse");
      }

      this.accessToken = data.access_token;
      const expiresIn = data.expires_in || 3600;
      this.tokenExpiry = Date.now() + expiresIn * 1000;

      console.log("✅ Token obtenu avec succès !");
      return this.accessToken;
    } catch (err) {
      console.error("❌ Erreur OAuth2:", err.response?.data || err.message);
      throw new Error("Impossible d’obtenir le token OAuth2");
    }
  }

  /**
   * 💳 Initialisation d’un paiement
   */
  async initiatePayment(paymentData) {
    try {
      const token = await this.getAccessToken();
      const endpoint = `${this.apiUrl}/api/v1/initiate`;

      console.log(`🚀 Initialisation paiement vers ${endpoint}`);

      const res = await axios.post(endpoint, paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        data: res.data,
      };
    } catch (err) {
      console.error(
        "❌ Erreur init paiement:",
        err.response?.data || err.message
      );
      return {
        success: false,
        error: err.response?.data || err.message,
      };
    }
  }

  /**
   * 📡 Vérification du statut d’un paiement
   */
  async checkPaymentStatus(transactionId) {
    try {
      const token = await this.getAccessToken();
      const endpoint = `${this.apiUrl}/api/v1/status?transactionId=${transactionId}`;

      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        data: res.data,
      };
    } catch (err) {
      console.error(
        "❌ Erreur vérif statut:",
        err.response?.data || err.message
      );
      return {
        success: false,
        error: err.response?.data || err.message,
      };
    }
  }
}

export default new PaymentService();
