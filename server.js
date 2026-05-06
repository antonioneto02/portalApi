'use strict';
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./logger');

const politicasRoutes      = require('./politicas-desconto/routes');
const limparCargaRoutes    = require('./limpar-carga/routes');
const ajusteSequenciaRoutes = require('./ajuste-sequencia/routes');

const app = express();
const PORT = process.env.PORT || 3014;

app.use(compression());
app.use(cors({
  origin: [
    'http://localhost:3000',  'https://localhost:3000',
    'http://192.168.0.88:3000', 'https://192.168.0.88:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'portal-api', port: PORT })
);

app.use('/api', politicasRoutes);
app.use('/api', limparCargaRoutes);
app.use('/api', ajusteSequenciaRoutes);

app.use((err, _req, res, _next) => {
  logger.error('Erro não tratado: %s', err.stack || err.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  logger.info(`Portal API rodando em http://localhost:${PORT}`);
});
