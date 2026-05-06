'use strict';
const produtosModel  = require('../models/produtosModel');
const politicasModel = require('../models/politicasModel');

function fmt(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}

async function buscarProduto(req, res) {
  try {
    const { codprod } = req.query;
    if (!codprod) return res.status(400).json({ erro: 'codprod é obrigatório.' });
    const p = await produtosModel.buscarProdutoDw(codprod.trim());
    if (!p) return res.status(404).json({ erro: `Produto "${codprod}" não encontrado.` });
    res.json(p);
  } catch (err) { res.status(500).json({ erro: 'Erro ao buscar produto.' }); }
}

async function listarProdutos(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!await politicasModel.buscarPorId(id)) return res.status(404).json({ erro: 'Política não encontrada.' });
    const produtos = await produtosModel.listarPorPolitica(id);
    const enriquecidos = await Promise.all(produtos.map(async p => {
      try { const dw = await produtosModel.buscarProdutoDw(p.CODPROD); return { ...p, FAMILIA: dw?.FAMILIA || '', PRODUTO: dw?.PRODUTO || '' }; }
      catch { return { ...p, FAMILIA: '', PRODUTO: '' }; }
    }));
    res.json(enriquecidos);
  } catch (err) { res.status(500).json({ erro: 'Erro ao listar produtos.' }); }
}

async function adicionarProduto(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { codprod } = req.body;
    if (!codprod) return res.status(400).json({ erro: 'codprod é obrigatório.' });
    const politica = await politicasModel.buscarPorId(id);
    if (!politica) return res.status(404).json({ erro: 'Política não encontrada.' });
    const produto = await produtosModel.buscarProdutoDw(codprod.trim());
    if (!produto) return res.status(404).json({ erro: `Produto "${codprod}" não encontrado.` });
    const conflitos = await politicasModel.verificarConflitoProduto(codprod.trim(), politica.DT_INICIO, politica.DT_FIM, id);
    if (conflitos.length > 0) {
      const c = conflitos[0];
      return res.status(409).json({ conflito: true, mensagem: `Produto "${codprod}" já está na política "${c.DESCRICAO}" (${fmt(c.DT_INICIO)} a ${fmt(c.DT_FIM)}).`, politicaConflitante: c });
    }
    await produtosModel.adicionar(id, codprod.trim());
    res.status(201).json({ mensagem: 'Produto adicionado com sucesso.', produto });
  } catch (err) {
    if (err.number === 2627 || (err.message && err.message.includes('UQ_POLITICA_PRODUTO')))
      return res.status(409).json({ erro: 'Este produto já está nesta política.' });
    res.status(500).json({ erro: 'Erro ao adicionar produto.' });
  }
}

async function removerProduto(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { codprod } = req.params;
    const linhas = await produtosModel.remover(id, codprod);
    if (linhas === 0) return res.status(404).json({ erro: 'Produto não encontrado nesta política.' });
    res.json({ mensagem: 'Produto removido com sucesso.' });
  } catch (err) { res.status(500).json({ erro: 'Erro ao remover produto.' }); }
}

async function listarTodosProdutosComPolitica(_req, res) {
  try { res.json(await produtosModel.listarTodosProdutosComPolitica()); }
  catch (err) { res.status(500).json({ erro: 'Erro ao listar produtos.' }); }
}

async function listarProdutosSemPolitica(_req, res) {
  try { res.json(await produtosModel.listarSemPolitica()); }
  catch (err) { res.status(500).json({ erro: 'Erro ao listar produtos sem política.' }); }
}

module.exports = { buscarProduto, listarProdutos, adicionarProduto, removerProduto, listarTodosProdutosComPolitica, listarProdutosSemPolitica };
