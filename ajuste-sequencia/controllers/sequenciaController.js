'use strict';
const sequenciaModel = require('../models/sequenciaModel');
const logger = require('../../logger');

async function buscarCarga(req, res) {
  try {
    const { carga } = req.query;
    if (!carga) return res.status(400).json({ erro: 'Informe o número da carga.' });
    const dados = await sequenciaModel.buscarCarga(carga.trim());
    if (!dados) return res.status(404).json({ erro: `Carga "${carga}" não encontrada em DAK010.` });
    res.json(dados);
  } catch (err) {
    logger.error('Erro ao buscar carga: %s', err.message);
    res.status(500).json({ erro: 'Erro ao buscar carga.' });
  }
}

async function padronizarSequencia(req, res) {
  try {
    const { carga, seqcar } = req.body;
    if (!carga || !seqcar)
      return res.status(400).json({ erro: 'Campos obrigatórios: carga, seqcar.' });
    const resultado = await sequenciaModel.padronizarSequencia(carga.trim(), seqcar.trim());
    logger.info('Sequência padronizada — carga: %s, seq: %s | DAI:%d SF2:%d SC9:%d',
      carga, seqcar, resultado.dai, resultado.sf2, resultado.sc9);
    res.json({
      mensagem: 'Sequência padronizada com sucesso.',
      atualizados: resultado,
    });
  } catch (err) {
    logger.error('Erro ao padronizar sequência: %s', err.message);
    res.status(500).json({ erro: 'Erro ao padronizar sequência.' });
  }
}

module.exports = { buscarCarga, padronizarSequencia };
