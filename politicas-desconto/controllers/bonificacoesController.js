'use strict';
const bonificacoesModel = require('../models/bonificacoesModel');

async function _val(body, res) {
  const { codgrupo, qtd_vendida, qtd_boni, dt_inicio, dt_fim } = body;
  if (!codgrupo || qtd_vendida == null || qtd_boni == null || !dt_inicio || !dt_fim)
    return res.status(400).json({ erro: 'Campos obrigatórios: codgrupo, qtd_vendida, qtd_boni, dt_inicio, dt_fim.' });
  if (parseFloat(qtd_vendida) <= 0 || parseFloat(qtd_boni) <= 0)
    return res.status(400).json({ erro: 'As quantidades devem ser maiores que zero.' });
  if (new Date(dt_inicio) >= new Date(dt_fim))
    return res.status(400).json({ erro: 'A data de início deve ser anterior à data de fim.' });
  return null;
}

async function listar(_req, res) {
  try { res.json(await bonificacoesModel.listar()); }
  catch { res.status(500).json({ erro: 'Erro ao listar bonificações.' }); }
}
async function buscarPorId(req, res) {
  try {
    const id = parseInt(req.params.id);
    const p = await bonificacoesModel.buscarPorId(id);
    if (!p) return res.status(404).json({ erro: 'Política não encontrada.' });
    res.json(p);
  } catch { res.status(500).json({ erro: 'Erro ao buscar bonificação.' }); }
}
async function criar(req, res) {
  try {
    const err = await _val(req.body, res); if (err) return;
    const { codgrupo, qtd_vendida, qtd_boni, dt_inicio, dt_fim } = req.body;
    if (!await bonificacoesModel.buscarGrupoDw(codgrupo.trim()))
      return res.status(404).json({ erro: `Grupo "${codgrupo}" não encontrado.` });
    const id = await bonificacoesModel.criar(codgrupo.trim(), parseFloat(qtd_vendida), parseFloat(qtd_boni), dt_inicio, dt_fim);
    res.status(201).json({ id, mensagem: 'Bonificação criada com sucesso.' });
  } catch { res.status(500).json({ erro: 'Erro ao criar bonificação.' }); }
}
async function atualizar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const valErr = await _val(req.body, res); if (valErr) return;
    const { codgrupo, qtd_vendida, qtd_boni, dt_inicio, dt_fim } = req.body;
    if (!await bonificacoesModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    if (!await bonificacoesModel.buscarGrupoDw(codgrupo.trim()))
      return res.status(404).json({ erro: `Grupo "${codgrupo}" não encontrado.` });
    await bonificacoesModel.atualizar(id, codgrupo.trim(), parseFloat(qtd_vendida), parseFloat(qtd_boni), dt_inicio, dt_fim);
    res.json({ mensagem: 'Bonificação atualizada com sucesso.' });
  } catch { res.status(500).json({ erro: 'Erro ao atualizar bonificação.' }); }
}
async function excluir(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await bonificacoesModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await bonificacoesModel.excluir(id); res.json({ mensagem: 'Bonificação excluída.' });
  } catch { res.status(500).json({ erro: 'Erro ao excluir bonificação.' }); }
}
async function ativar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await bonificacoesModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await bonificacoesModel.ativar(id); res.json({ mensagem: 'Bonificação ativada.' });
  } catch { res.status(500).json({ erro: 'Erro ao ativar bonificação.' }); }
}
async function inativar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await bonificacoesModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await bonificacoesModel.inativar(id); res.json({ mensagem: 'Bonificação inativada.' });
  } catch { res.status(500).json({ erro: 'Erro ao inativar bonificação.' }); }
}
async function replicar(req, res) {
  try {
    const idOrigem = parseInt(req.params.id);
    const valErr = await _val(req.body, res); if (valErr) return;
    const { codgrupo, qtd_vendida, qtd_boni, dt_inicio, dt_fim } = req.body;
    if (!await bonificacoesModel.buscarPorId(idOrigem)) return res.status(404).json({ erro: 'Política de origem não encontrada.' });
    if (!await bonificacoesModel.buscarGrupoDw(codgrupo.trim())) return res.status(404).json({ erro: `Grupo "${codgrupo}" não encontrado.` });
    const id = await bonificacoesModel.criar(codgrupo.trim(), parseFloat(qtd_vendida), parseFloat(qtd_boni), dt_inicio, dt_fim);
    res.status(201).json({ id, mensagem: `Replicada. Novo ID: ${id}.` });
  } catch { res.status(500).json({ erro: 'Erro ao replicar bonificação.' }); }
}
async function buscarGrupo(req, res) {
  try {
    const { codgrupo } = req.query;
    if (!codgrupo) return res.status(400).json({ erro: 'codgrupo é obrigatório.' });
    const g = await bonificacoesModel.buscarGrupoDw(codgrupo.trim());
    if (!g) return res.status(404).json({ erro: `Grupo "${codgrupo}" não encontrado.` });
    res.json(g);
  } catch { res.status(500).json({ erro: 'Erro ao buscar grupo.' }); }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, ativar, inativar, replicar, buscarGrupo };
