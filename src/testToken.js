const { getCashPayToken } = require('./services/cashpayService');

(async () => {
  const token = await getCashPayToken();
})();
