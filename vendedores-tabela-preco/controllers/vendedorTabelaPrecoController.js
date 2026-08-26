'use strict';
const model = require('../models/vendedorTabelaPrecoModel');
const logger = require('../../logger');

function _val(body, res) {
  const { vend, codtab } = body;
  if (!vend || !codtab)
    return res.status(400).json({ erro: 'Campos obrigatórios: vend, codtab.' });
  return null;
}

function _dataAtualProtheus() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, '0');
  const dd = String(hoje.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function listar(_req, res) {
  try {
    res.json(await model.listar());
  } catch (err) {
    logger.error('Erro ao listar vendedores x tabela de preço: %s', err.message);
    res.status(500).json({ erro: 'Erro ao listar vendedores x tabela de preço.' });
  }
}

async function opcoesVendedores(_req, res) {
  try {
    res.json(await model.listarVendedores());
  } catch (err) {
    logger.error('Erro ao listar vendedores: %s', err.message);
    res.status(500).json({ erro: 'Erro ao listar vendedores.' });
  }
}

async function opcoesTabelas(_req, res) {
  try {
    res.json(await model.listarTabelasPreco());
  } catch (err) {
    logger.error('Erro ao listar tabelas de preço: %s', err.message);
    res.status(500).json({ erro: 'Erro ao listar tabelas de preço.' });
  }
}

async function buscarPorChave(req, res) {
  try {
    const registro = await model.buscarPorChave(req.params.vend, req.params.codtab);
    if (!registro) return res.status(404).json({ erro: 'Associação não encontrada.' });
    res.json(registro);
  } catch (err) {
    logger.error('Erro ao buscar associação vendedor x tabela de preço: %s', err.message);
    res.status(500).json({ erro: 'Erro ao buscar associação.' });
  }
}

async function criar(req, res) {
  try {
    const erro = _val(req.body, res);
    if (erro) return;
    const { vend, codtab } = req.body;
    if (await model.existeAssociacao(vend, codtab))
      return res.status(400).json({ erro: `Vendedor "${vend}" já está associado à tabela "${codtab}".` });
    await model.criar({ vend, codtab, dataalt: _dataAtualProtheus() });
    res.status(201).json({ mensagem: 'Associação criada com sucesso.' });
  } catch (err) {
    logger.error('Erro ao criar associação vendedor x tabela de preço: %s', err.message);
    res.status(500).json({ erro: 'Erro ao criar associação.' });
  }
}

async function atualizar(req, res) {
  try {
    const { vend: vendAtual, codtab: codtabAtual } = req.params;
    const erro = _val(req.body, res);
    if (erro) return;
    const { vend, codtab } = req.body;

    if (!await model.buscarPorChave(vendAtual, codtabAtual))
      return res.status(404).json({ erro: 'Associação não encontrada.' });

    if ((vend !== vendAtual || codtab !== codtabAtual) && await model.existeAssociacao(vend, codtab))
      return res.status(400).json({ erro: `Vendedor "${vend}" já está associado à tabela "${codtab}".` });

    const rowsAffected = await model.atualizar(vendAtual, codtabAtual, { vend, codtab, dataalt: _dataAtualProtheus() });
    if (rowsAffected === 0) return res.status(404).json({ erro: 'Associação não encontrada.' });
    res.json({ mensagem: 'Associação atualizada com sucesso.' });
  } catch (err) {
    logger.error('Erro ao atualizar associação vendedor x tabela de preço: %s', err.message);
    res.status(500).json({ erro: 'Erro ao atualizar associação.' });
  }
}

async function excluir(req, res) {
  try {
    const rowsAffected = await model.excluir(req.params.vend, req.params.codtab);
    if (rowsAffected === 0) return res.status(404).json({ erro: 'Associação não encontrada.' });
    res.json({ mensagem: 'Associação excluída.' });
  } catch (err) {
    logger.error('Erro ao excluir associação vendedor x tabela de preço: %s', err.message);
    res.status(500).json({ erro: 'Erro ao excluir associação.' });
  }
}

module.exports = { listar, opcoesVendedores, opcoesTabelas, buscarPorChave, criar, atualizar, excluir };
