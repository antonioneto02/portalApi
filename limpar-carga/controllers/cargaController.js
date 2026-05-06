'use strict';
const cargaModel = require('../models/cargaModel');
const logger = require('../../logger');

async function buscarItens(req, res) {
  try {
    const { filial, pedido, carga } = req.query;
    let itens;
    if (carga) {
      itens = await cargaModel.buscarItensPorCarga(carga.trim());
    } else if (pedido) {
      itens = await cargaModel.buscarItensPorPedido(filial ? filial.trim() : null, pedido.trim());
    } else {
      // Nenhum pedido nem carga informado: retornar registros de hoje com C9_NFISCAL vazio
      itens = await cargaModel.buscarItensHojeSemNfiscal();
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
