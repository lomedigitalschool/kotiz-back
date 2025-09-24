// src/services/cashPayService.js
const axios = require("axios");

const CASHPAY_CONFIG = {
  baseUrl: "https://api.semoa-payments.ovh/sandbox", // ✅ URL correcte sandbox
  client_id: "cashpay",
  client_secret: "HpuNOm3sDOkAvd8v3UCIxiBu68634BBs",
  username: "api_cashpay.zedeka",
  password: "yVf95Q8SBT",
  apikey: "dBirFPoKa5XyQZLB4j8MA7AzPrbxBLuAQ54h",
};

/**
 * 🔑 Obtenir un token d'accès OAuth2
 */
async function getAccessToken() {
  console.log("⏳ Envoi de la requête pour obtenir le token...");

  try {
    const response = await axios.post(
      `${CASHPAY_CONFIG.baseUrl}/oauth/token`,
      null,
      {
        auth: {
          username: CASHPAY_CONFIG.username,
          password: CASHPAY_CONFIG.password,
        },
        params: {
          grant_type: "client_credentials",
          client_id: CASHPAY_CONFIG.client_id,
          client_secret: CASHPAY_CONFIG.client_secret,
        },
      }
    );

    const token = response.data.access_token;
    console.log("✅ Token obtenu !");
    return token;
  } catch (error) {
    console.error(
      "❌ Erreur récupération token :",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * 💳 Créer un paiement
 */
async function createPayment(amount, description) {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.error("❌ Pas de token, paiement annulé");
      return null;
    }

    console.log("⏳ Création du paiement...");

    const response = await axios.post(
      `${CASHPAY_CONFIG.baseUrl}/payments`, // ⚠️ À confirmer dans la doc officielle
      {
        amount,
        currency: "XOF",
        description,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": CASHPAY_CONFIG.apikey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Paiement créé :", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Erreur création paiement :",
      error.response?.data || error.message
    );
    return null;
  }
}

module.exports = { getAccessToken, createPayment };
