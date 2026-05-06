'use strict';
const politicaDescontoModel = require('../models/politicaDescontoModel');
const produtosModel         = require('../models/produtosModel');

function _val(body, res) {
  const { codgrupo, produto, qtd_vendida, perc_desc, dt_inicio, dt_fim } = body;
  if (!codgrupo || !produto || qtd_vendida == null || perc_desc == null || !dt_inicio || !dt_fim)
    return res.status(400).json({ erro: 'Campos obrigatórios: codgrupo, produto, qtd_vendida, perc_desc, dt_inicio, dt_fim.' });
  if (parseFloat(qtd_vendida) <= 0) return res.status(400).json({ erro: 'qtd_vendida deve ser maior que zero.' });
  if (parseFloat(perc_desc) < 0 || parseFloat(perc_desc) > 100) return res.status(400).json({ erro: 'perc_desc deve estar entre 0 e 100.' });
  if (new Date(dt_inicio) >= new Date(dt_fim)) return res.status(400).json({ erro: 'dt_inicio deve ser anterior a dt_fim.' });
  return null;
}

async function listar(_req, res) {
  try { res.json(await politicaDescontoModel.listar()); }
  catch { res.status(500).json({ erro: 'Erro ao listar políticas de desconto.' }); }
}
async function buscarPorId(req, res) {
  try {
    const p = await politicaDescontoModel.buscarPorId(parseInt(req.params.id));
    if (!p) return res.status(404).json({ erro: 'Política não encontrada.' });
    res.json(p);
  } catch { res.status(500).json({ erro: 'Erro ao buscar política.' }); }
}
async function criar(req, res) {
  try {
    const err = _val(req.body, res); if (err) return;
    const { codgrupo, produto, qtd_vendida, perc_desc, dt_inicio, dt_fim } = req.body;
    if (!await politicaDescontoModel.buscarGrupoDw(codgrupo.trim())) return res.status(404).json({ erro: `Grupo "${codgrupo}" não encontrado.` });
    if (!await produtosModel.buscarProdutoDw(produto.trim())) return res.status(404).json({ erro: `Produto "${produto}" não encontrado.` });
    const id = await politicaDescontoModel.criar(codgrupo.trim(), produto.trim(), parseFloat(qtd_vendida), parseFloat(perc_desc), dt_inicio, dt_fim);
    res.status(201).json({ id, mensagem: 'Política criada com sucesso.' });
  } catch { res.status(500).json({ erro: 'Erro ao criar política.' }); }
}
async function atualizar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const valErr = _val(req.body, res); if (valErr) return;
    const { codgrupo, produto, qtd_vendida, perc_desc, dt_inicio, dt_fim } = req.body;
    if (!await politicaDescontoModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    if (!await politicaDescontoModel.buscarGrupoDw(codgrupo.trim())) return res.status(404).json({ erro: `Grupo "${codgrupo}" não encontrado.` });
    if (!await produtosModel.buscarProdutoDw(produto.trim())) return res.status(404).json({ erro: `Produto "${produto}" não encontrado.` });
    await politicaDescontoModel.atualizar(id, codgrupo.trim(), produto.trim(), parseFloat(qtd_vendida), parseFloat(perc_desc), dt_inicio, dt_fim);
    res.json({ mensagem: 'Política atualizada com sucesso.' });
  } catch { res.status(500).json({ erro: 'Erro ao atualizar política.' }); }
}
async function excluir(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await politicaDescontoModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await politicaDescontoModel.excluir(id); res.json({ mensagem: 'Política excluída.' });
  } catch { res.status(500).json({ erro: 'Erro ao excluir política.' }); }
}
async function ativar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await politicaDescontoModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await politicaDescontoModel.ativar(id); res.json({ mensagem: 'Política ativada.' });
  } catch { res.status(500).json({ erro: 'Erro ao ativar política.' }); }
}
async function inativar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await politicaDescontoModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await politicaDescontoModel.inativar(id); res.json({ mensagem: 'Política inativada.' });
  } catch { res.status(500).json({ erro: 'Erro ao inativar política.' }); }
}
async function replicar(req, res) {
  try {
    const idOrigem = parseInt(req.params.id);
    const origem = await politicaDescontoModel.buscarPorId(idOrigem);
    if (!origem) return res.status(404).json({ erro: 'Política de origem não encontrada.' });
    const { codgrupo, qtd_vendida, perc_desc, dt_inicio, dt_fim } = req.body;
    if (!dt_inicio || !dt_fim) return res.status(400).json({ erro: 'dt_inicio e dt_fim são obrigatórios.' });
    if (new Date(dt_inicio) >= new Date(dt_fim)) return res.status(400).json({ erro: 'dt_inicio deve ser anterior a dt_fim.' });
    const novoGrupo = codgrupo ? codgrupo.trim() : origem.CODGRUPO;
    if (!await politicaDescontoModel.buscarGrupoDw(novoGrupo)) return res.status(404).json({ erro: `Grupo "${novoGrupo}" não encontrado.` });
    const id = await politicaDescontoModel.criar(novoGrupo, origem.PRODUTO,
      qtd_vendida != null ? parseFloat(qtd_vendida) : parseFloat(origem.QTD_VENDIDA),
      perc_desc   != null ? parseFloat(perc_desc)   : parseFloat(origem.PERC_DESC),
      dt_inicio, dt_fim);
    res.status(201).json({ id, mensagem: `Replicada. Novo ID: ${id}.` });
  } catch { res.status(500).json({ erro: 'Erro ao replicar política.' }); }
}
async function buscarGrupo(req, res) {
  try {
    const { codgrupo } = req.query;
    if (!codgrupo) return res.status(400).json({ erro: 'codgrupo é obrigatório.' });
    const g = await politicaDescontoModel.buscarGrupoDw(codgrupo.trim());
    if (!g) return res.status(404).json({ erro: `Grupo "${codgrupo}" não encontrado.` });
    res.json(g);
  } catch { res.status(500).json({ erro: 'Erro ao buscar grupo.' }); }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, ativar, inativar, replicar, buscarGrupo };
