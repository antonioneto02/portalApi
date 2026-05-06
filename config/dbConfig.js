'use strict';
require('dotenv').config();
const sql = require('mssql');
const logger = require('../logger');

const baseOptions = {
  options: { encrypt: true, trustServerCertificate: true, useUTC: false },
  requestTimeout: 60000,
  connectionTimeout: 30000,
};

const configs = {
  politicas: {
    user: process.env.DB_USER_ERP,   password: process.env.DB_PASSWORD_ERP,
    server: process.env.DB_SERVER_ERP, database: process.env.DB_DATABASE_POL,
    ...baseOptions,
  },
  dw: {
    user: process.env.DB_USER_ERP,   password: process.env.DB_PASSWORD_ERP,
    server: process.env.DB_SERVER_ERP, database: process.env.DB_DATABASE_DW,
    ...baseOptions,
  },
  bonificacao: {
    user: process.env.DB_USER_ERP,   password: process.env.DB_PASSWORD_ERP,
    server: process.env.DB_SERVER_ERP, database: process.env.DB_DATABASE_BONI,
    ...baseOptions,
  },
  politicaDesconto: {
    user: process.env.DB_USER_ERP,   password: process.env.DB_PASSWORD_ERP,
    server: process.env.DB_SERVER_ERP, database: process.env.DB_DATABASE_POLDESC,
    ...baseOptions,
  },
  erp: {
    user: process.env.DB_USER_PROT,  password: process.env.DB_PASSWORD_PROT,
    server: process.env.DB_SERVER_PROT, database: process.env.DB_DATABASE_PROT,
    ...baseOptions,
  },
};

const pools = {};

async function getPool(name) {
  if (pools[name] && pools[name].connected) return pools[name];
  try {
    const pool = new sql.ConnectionPool(configs[name]);
    pools[name] = await pool.connect();
    pools[name].on('error', (err) => {
      logger.error(`Pool '${name}' erro: ${err.message}`);
      pools[name] = null;
    });
    logger.info(`Pool '${name}' conectado (db: ${configs[name].database}).`);
    return pools[name];
  } catch (err) {
    logger.error(`Falha ao conectar pool '${name}' (db: ${configs[name]?.database}): ${err.message}`);
    throw err;
  }
}

const getPoolPoliticas       = () => getPool('politicas');
const getPoolDw              = () => getPool('dw');
const getPoolBonificacao     = () => getPool('bonificacao');
const getPoolPoliticaDesconto = () => getPool('politicaDesconto');
const getPoolERP             = () => getPool('erp');

module.exports = { getPoolPoliticas, getPoolDw, getPoolBonificacao, getPoolPoliticaDesconto, getPoolERP, sql };
