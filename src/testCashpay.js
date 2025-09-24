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

async function getAccessToken() {
    if (accessToken && tokenExpiry > Date.now()) {
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
        return accessToken;

    } catch (error) {
        console.error('Erreur lors de la récupération du token Semoa:', error.response?.data || error.message);
        throw new Error('Impossible d\'authentifier auprès de Semoa.');
    }
}

module.exports = { getAccessToken };