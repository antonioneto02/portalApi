'use strict';
const politicasModel = require('../models/politicasModel');
const produtosModel  = require('../models/produtosModel');

function formatarData(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

async function listar(req, res) {
  try { res.json(await politicasModel.listar()); }
  catch (err) { res.status(500).json({ erro: 'Erro ao listar políticas.' }); }
}

async function buscarPorId(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ erro: 'ID inválido.' });
    const p = await politicasModel.buscarPorId(id);
    if (!p) return res.status(404).json({ erro: 'Política não encontrada.' });
    res.json(p);
  } catch (err) { res.status(500).json({ erro: 'Erro ao buscar política.' }); }
}

async function criar(req, res) {
  try {
    const { descricao, perc_desconto, dt_inicio, dt_fim } = req.body;
    if (!descricao || perc_desconto == null || !dt_inicio || !dt_fim)
      return res.status(400).json({ erro: 'Campos obrigatórios: descricao, perc_desconto, dt_inicio, dt_fim.' });
    if (new Date(dt_inicio) >= new Date(dt_fim))
      return res.status(400).json({ erro: 'A data de início deve ser anterior à data de fim.' });
    const id = await politicasModel.criar(descricao.trim(), parseFloat(perc_desconto), dt_inicio, dt_fim);
    res.status(201).json({ id, mensagem: 'Política criada com sucesso.' });
  } catch (err) { res.status(500).json({ erro: 'Erro ao criar política.' }); }
}

async function atualizar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { descricao, perc_desconto, dt_inicio, dt_fim } = req.body;
    if (!id) return res.status(400).json({ erro: 'ID inválido.' });
    if (!descricao || perc_desconto == null || !dt_inicio || !dt_fim)
      return res.status(400).json({ erro: 'Campos obrigatórios: descricao, perc_desconto, dt_inicio, dt_fim.' });
    if (new Date(dt_inicio) >= new Date(dt_fim))
      return res.status(400).json({ erro: 'A data de início deve ser anterior à data de fim.' });
    const existente = await politicasModel.buscarPorId(id);
    if (!existente) return res.status(404).json({ erro: 'Política não encontrada.' });
    const dtInicioMudou = new Date(existente.DT_INICIO).toISOString() !== new Date(dt_inicio).toISOString();
    const dtFimMudou    = new Date(existente.DT_FIM).toISOString()    !== new Date(dt_fim).toISOString();
    if (dtInicioMudou || dtFimMudou) {
      const codprods = await produtosModel.listarCodprods(id);
      const conflitos = [];
      for (const codprod of codprods) {
        const c = await politicasModel.verificarConflitoProduto(codprod, dt_inicio, dt_fim, id);
        if (c.length > 0) conflitos.push({ codprod, politica: c[0] });
      }
      if (conflitos.length > 0) {
        const lista = conflitos.map(c => `Produto ${c.codprod} → "${c.politica.DESCRICAO}" (${formatarData(c.politica.DT_INICIO)} a ${formatarData(c.politica.DT_FIM)})`).join('; ');
        return res.status(409).json({ conflito: true, mensagem: `Conflito nos produtos: ${lista}.`, conflitos });
      }
    }
    await politicasModel.atualizar(id, descricao.trim(), parseFloat(perc_desconto), dt_inicio, dt_fim);
    res.json({ mensagem: 'Política atualizada com sucesso.' });
  } catch (err) { res.status(500).json({ erro: 'Erro ao atualizar política.' }); }
}

async function excluir(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ erro: 'ID inválido.' });
    if (!await politicasModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await politicasModel.excluir(id);
    res.json({ mensagem: 'Política excluída com sucesso.' });
  } catch (err) { res.status(500).json({ erro: 'Erro ao excluir política.' }); }
}

async function ativar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await politicasModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await politicasModel.ativar(id);
    res.json({ mensagem: 'Política ativada com sucesso.' });
  } catch (err) { res.status(500).json({ erro: 'Erro ao ativar política.' }); }
}

async function inativar(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await politicasModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    await politicasModel.inativar(id);
    res.json({ mensagem: 'Política inativada com sucesso.' });
  } catch (err) { res.status(500).json({ erro: 'Erro ao inativar política.' }); }
}

async function replicar(req, res) {
  try {
    const idOrigem = parseInt(req.params.id);
    const { descricao, dt_inicio, dt_fim } = req.body;
    if (!idOrigem || !descricao || !dt_inicio || !dt_fim)
      return res.status(400).json({ erro: 'Campos obrigatórios: descricao, dt_inicio, dt_fim.' });
    if (new Date(dt_inicio) >= new Date(dt_fim))
      return res.status(400).json({ erro: 'A data de início deve ser anterior à data de fim.' });
    const origem = await politicasModel.buscarPorId(idOrigem);
    if (!origem) return res.status(404).json({ erro: 'Política de origem não encontrada.' });
    const codprods = await produtosModel.listarCodprods(idOrigem);
    const conflitos = [];
    for (const codprod of codprods) {
      const c = await politicasModel.verificarConflitoProduto(codprod, dt_inicio, dt_fim, idOrigem);
      if (c.length > 0) conflitos.push({ codprod, politica: c[0] });
    }
    if (conflitos.length > 0) {
      const lista = conflitos.map(c => `Produto ${c.codprod} → "${c.politica.DESCRICAO}"`).join('; ');
      return res.status(409).json({ conflito: true, mensagem: `Conflito de vigência: ${lista}.`, conflitos });
    }
    const novoId = await politicasModel.criar(descricao.trim(), origem.PERC_DESCONTO, dt_inicio, dt_fim);
    for (const codprod of codprods) await produtosModel.adicionar(novoId, codprod);
    res.status(201).json({ id: novoId, mensagem: `Política replicada. Novo ID: ${novoId}.` });
  } catch (err) { res.status(500).json({ erro: 'Erro ao replicar política.' }); }
}

async function sincronizarPolitica11(_req, res) {
  try {
    const adicionados = await produtosModel.sincronizarProdutosNovos(11);
    res.json({ adicionados, mensagem: `Sincronização concluída. ${adicionados} produto(s) adicionado(s).` });
  } catch (err) { res.status(500).json({ erro: 'Erro ao sincronizar.' }); }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, ativar, inativar, replicar, sincronizarPolitica11 };
