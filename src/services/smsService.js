const axios = require('axios');

class SMSService {
  constructor() {
    // Fournisseur choisi
    this.provider = process.env.SMS_PROVIDER || 'semoa';

    // Config SEMOA
    this.semoa = {
      username: process.env.SEMOA_USERNAME || 'api_cashpay.zedeka',
      password: process.env.SEMOA_PASSWORD || 'yVf95Q8SBT',
      clientId: process.env.SEMOA_CLIENT_ID || 'cashpay',
      clientSecret: process.env.SEMOA_CLIENT_SECRET || 'HpuNOm3sDOkAvd8v3UCIxiBu68634BBs',
      apiKey: process.env.SEMOA_API_KEY || 'dBirFPoKa5XyQZLB4j8MA7AzPrbxBLuAQ54h',
      baseURL: process.env.SEMOA_BASE_URL || 'https://api.semoa-payments.ovh/sandbox'
    };

    this.otpExpiry = 5 * 60 * 1000; // 5 minutes
    this.otpStorage = new Map();

    this.client = axios.create({
      baseURL: this.semoa.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.semoa.apiKey
      }
    });
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phoneNumber, purpose = 'verification') {
    try {
      const otpCode = this.generateOTP();
      const otpKey = `${phoneNumber}_${purpose}`;

      this.otpStorage.set(otpKey, {
        code: otpCode,
        expiresAt: Date.now() + this.otpExpiry,
        attempts: 0,
        verified: false
      });

      const payload = {
        phoneNumber,
        message: `Votre code KOTIZ est : ${otpCode}`,
        purpose
      };

      const response = await this.client.post('/otp/send', payload);

      return {
        success: true,
        otpSent: true,
        phoneNumber,
        purpose,
        expiresIn: this.otpExpiry / 1000,
        providerResponse: response.data
      };
    } catch (error) {
      console.error('❌ Erreur SEMOA sendOTP:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  async verifyOTP(phoneNumber, code, purpose = 'verification') {
    try {
      const otpKey = `${phoneNumber}_${purpose}`;
      const otpData = this.otpStorage.get(otpKey);

      if (!otpData) return { success: false, error: 'OTP introuvable ou expiré' };
      if (Date.now() > otpData.expiresAt) {
        this.otpStorage.delete(otpKey);
        return { success: false, error: 'OTP expiré' };
      }
      if (otpData.attempts >= 3) {
        this.otpStorage.delete(otpKey);
        return { success: false, error: 'Trop de tentatives' };
      }

      if (otpData.code !== code) {
        otpData.attempts++;
        this.otpStorage.set(otpKey, otpData);
        return { success: false, error: 'OTP incorrect', attemptsLeft: 3 - otpData.attempts };
      }

      otpData.verified = true;
      this.otpStorage.set(otpKey, otpData);
      setTimeout(() => this.otpStorage.delete(otpKey), 60000);

      return { success: true, verified: true, phoneNumber, purpose };
    } catch (error) {
      console.error('❌ Erreur SEMOA verifyOTP:', error.message);
      return { success: false, error: error.message };
    }
  }

  async resendOTP(phoneNumber, purpose = 'verification') {
    this.otpStorage.delete(`${phoneNumber}_${purpose}`);
    return await this.sendOTP(phoneNumber, purpose);
  }
}

module.exports = new SMSService();
