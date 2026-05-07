'use strict';
const cargaModel = require('../models/cargaModel');
const logger = require('../../logger');

function getDataHojeBR() {
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const y = fmt.find(p => p.type === 'year').value;
  const m = fmt.find(p => p.type === 'month').value;
  const d = fmt.find(p => p.type === 'day').value;
  return `${y}${m}${d}`; // yyyymmdd
}

async function buscarItens(req, res) {
  try {
    const { carga, filial, pedido, produto, qtdLibMin, qtdLibMax } = req.query;
    let itens;
    if (carga) {
      itens = await cargaModel.buscarItensPorCarga(carga.trim());
    } else {
      const filtros = {
        filial:    filial    ? filial.trim()           : null,
        pedido:    pedido    ? pedido.trim()           : null,
        produto:   produto   ? produto.trim()          : null,
        qtdLibMin: qtdLibMin !== undefined && qtdLibMin !== '' ? parseFloat(qtdLibMin) : null,
        qtdLibMax: qtdLibMax !== undefined && qtdLibMax !== '' ? parseFloat(qtdLibMax) : null,
      };
      itens = await cargaModel.buscarItensHojeSemNfiscal(getDataHojeBR(), filtros);
    }
    res.json(itens);
  } catch (err) {
    logger.error('Erro ao buscar itens SC9: %s', err.message);
    res.status(500).json({ erro: 'Erro ao buscar itens.' });
  }
}

async function limparCarga(req, res) {
  try {
    const recno = Number(req.params.recno);
    if (!recno || isNaN(recno)) return res.status(400).json({ erro: 'Identificador inválido.' });
    const rows = await cargaModel.limparCarga(recno);
    if (rows === 0) return res.status(404).json({ erro: 'Registro não encontrado ou carga já está vazia.' });
    logger.info('Carga limpa — R_E_C_N_O_: %s', recno);
    res.json({ mensagem: 'Carga removida com sucesso.', recno });
  } catch (err) {
    logger.error('Erro ao limpar carga: %s', err.message);
    res.status(500).json({ erro: 'Erro ao limpar carga.' });
  }
}

module.exports = { buscarItens, limparCarga };
