const express = require('express');
const cors = require('cors');
const { clientUrl } = require('./config');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.use(cors({ origin: clientUrl }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/readings', require('./routes/readings'));
app.use('/api/reports', require('./routes/reports'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
