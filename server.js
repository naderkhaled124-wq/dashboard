const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
  index: 'dashboard.html',
  setHeaders: function(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/api', apiRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'خطأ داخلي في الخادم' });
});

app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, url: `http://localhost:${PORT}` });
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
