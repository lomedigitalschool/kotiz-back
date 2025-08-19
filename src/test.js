const express = require('express');
const app = express();
const PORT = 3000;

app.get('/health', (req, res) => {
  console.log('/health appelé');
  res.json({ status: 'ok' });
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
