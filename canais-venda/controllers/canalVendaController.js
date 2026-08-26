'use strict';
const canalVendaModel = require('../models/canalVendaModel');
const logger = require('../../logger');

function _val(body, res) {
  const { codcanal, canal } = body;
  if (!codcanal || !canal)
    return res.status(400).json({ erro: 'Campos obrigatórios: codcanal, canal.' });
  const percentuais = ['percTrade', 'percRapel', 'percComissao'];
  for (const campo of percentuais) {
    const valor = body[campo];
    if (valor !== undefined && valor !== null && valor !== '' && (isNaN(parseFloat(valor)) || parseFloat(valor) < 0))
      return res.status(400).json({ erro: `${campo} deve ser um número maior ou igual a zero.` });
  }
  return null;
}

function _normalizar(body) {
  const flag = (valor) => (valor === 'S' || valor === true || valor === 1 || valor === '1') ? 'S' : 'N';
  const num = (valor) => (valor !== undefined && valor !== null && valor !== '' ? parseFloat(valor) : null);
  return {
    codcanal: body.codcanal.trim(),
    canal: body.canal.trim(),
    despPromotores: flag(body.despPromotores),
    despCom: flag(body.despCom),
    percTrade: num(body.percTrade),
    percRapel: num(body.percRapel),
    percComissao: num(body.percComissao),
    tpFrete: body.tpFrete ? body.tpFrete.trim() : null,
    seq: body.seq ? body.seq.trim() : null,
  };
}

async function listar(_req, res) {
  try {
    res.json(await canalVendaModel.listar());
  } catch (err) {
    logger.error('Erro ao listar canais de venda: %s', err.message);
    res.status(500).json({ erro: 'Erro ao listar canais de venda.' });
  }
}

async function buscarPorId(req, res) {
  try {
    const registro = await canalVendaModel.buscarPorId(parseInt(req.params.id));
    if (!registro) return res.status(404).json({ erro: 'Canal de venda não encontrado.' });
    res.json(registro);
  } catch (err) {
    logger.error('Erro ao buscar canal de venda: %s', err.message);
    res.status(500).json({ erro: 'Erro ao buscar canal de venda.' });
  }
}

async function criar(req, res) {
  try {
    const erro = _val(req.body, res);
    if (erro) return;
    if (await canalVendaModel.buscarPorCodCanal(req.body.codcanal.trim()))
      return res.status(400).json({ erro: `Já existe canal cadastrado com o código "${req.body.codcanal.trim()}".` });
    const id = await canalVendaModel.criar(_normalizar(req.body));
    res.status(201).json({ id, mensagem: 'Canal de venda criado com sucesso.' });
  } catch (err) {
    logger.error('Erro ao criar canal de venda: %s', err.message);
    res.status(500).json({ erro: 'Erro ao criar canal de venda.' });
  }
}

async function atualizar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const erro = _val(req.body, res);
    if (erro) return;
    if (!await canalVendaModel.buscarPorId(id))
      return res.status(404).json({ erro: 'Canal de venda não encontrado.' });
    const rowsAffected = await canalVendaModel.atualizar(id, _normalizar(req.body));
    if (rowsAffected === 0) return res.status(404).json({ erro: 'Canal de venda não encontrado.' });
    res.json({ mensagem: 'Canal de venda atualizado com sucesso.' });
  } catch (err) {
    logger.error('Erro ao atualizar canal de venda: %s', err.message);
    res.status(500).json({ erro: 'Erro ao atualizar canal de venda.' });
  }
}

async function excluir(req, res) {
  try {
    const id = parseInt(req.params.id);
    const rowsAffected = await canalVendaModel.excluir(id);
    if (rowsAffected === 0) return res.status(404).json({ erro: 'Canal de venda não encontrado.' });
    res.json({ mensagem: 'Canal de venda excluído.' });
  } catch (err) {
    logger.error('Erro ao excluir canal de venda: %s', err.message);
    res.status(500).json({ erro: 'Erro ao excluir canal de venda.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
