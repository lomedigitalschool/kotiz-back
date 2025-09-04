// src/services/semoaService.js
const axios = require('axios');

const BASE_URL = "https://api.semoa-payments.ovh/sandbox";

// Identifiants SEMOA (à mettre aussi dans .env)
const CLIENT_ID = process.env.SEMOA_CLIENT_ID || "cashpay";
const CLIENT_SECRET = process.env.SEMOA_CLIENT_SECRET || "HpuNOm3sDOkAvd8v3UCIxiBu68634BBs";
const API_KEY = process.env.SEMOA_API_KEY || "dBirFPoKa5XyQZLB4j8MA7AzPrbxBLuAQ54h";

async function initPayment(amount, phone, method) {
  try {
    const response = await axios.post(`${BASE_URL}/transactions/init`, {
      amount,
      phone,
      method
    }, {
      headers: {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "apikey": API_KEY,
        "Content-Type": "application/json"
      }
    });

    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erreur init paiement SEMOA");
  }
}

async function confirmPayment(transactionId, otp) {
  try {
    const response = await axios.post(`${BASE_URL}/transactions/confirm`, {
      transactionId,
      otp
    }, {
      headers: {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "apikey": API_KEY,
        "Content-Type": "application/json"
      }
    });

    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Erreur confirmation OTP SEMOA");
  }
}

module.exports = { initPayment, confirmPayment };
