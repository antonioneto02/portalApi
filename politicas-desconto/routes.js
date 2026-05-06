'use strict';
const { Router } = require('express');
const politicasCtrl      = require('./controllers/politicasController');
const produtosCtrl       = require('./controllers/produtosController');
const bonificacoesCtrl   = require('./controllers/bonificacoesController');
const politicaDescCtrl   = require('./controllers/politicaDescontoController');

const router = Router();

// Produtos
router.get('/produtos/visao-geral',  produtosCtrl.listarTodosProdutosComPolitica);
router.get('/produtos/sem-politica', produtosCtrl.listarProdutosSemPolitica);
router.get('/produtos/buscar',       produtosCtrl.buscarProduto);

// Regras de Desconto (politicas)
router.get('/politicas',                    politicasCtrl.listar);
router.get('/politicas/:id',                politicasCtrl.buscarPorId);
router.post('/politicas',                   politicasCtrl.criar);
router.put('/politicas/:id',                politicasCtrl.atualizar);
router.delete('/politicas/:id',             politicasCtrl.excluir);
router.patch('/politicas/:id/ativar',       politicasCtrl.ativar);
router.patch('/politicas/:id/inativar',     politicasCtrl.inativar);
router.post('/politicas/:id/replicar',      politicasCtrl.replicar);
router.post('/politicas/sincronizar-11',    politicasCtrl.sincronizarPolitica11);
router.get('/politicas/:id/produtos',       produtosCtrl.listarProdutos);
router.post('/politicas/:id/produtos',      produtosCtrl.adicionarProduto);
router.delete('/politicas/:id/produtos/:codprod', produtosCtrl.removerProduto);

// Políticas de Desconto (por grupo/produto)
router.get('/politicas-desconto/grupos/buscar', politicaDescCtrl.buscarGrupo);
router.get('/politicas-desconto',               politicaDescCtrl.listar);
router.get('/politicas-desconto/:id',           politicaDescCtrl.buscarPorId);
router.post('/politicas-desconto',              politicaDescCtrl.criar);
router.put('/politicas-desconto/:id',           politicaDescCtrl.atualizar);
router.delete('/politicas-desconto/:id',        politicaDescCtrl.excluir);
router.patch('/politicas-desconto/:id/ativar',  politicaDescCtrl.ativar);
router.patch('/politicas-desconto/:id/inativar',politicaDescCtrl.inativar);
router.post('/politicas-desconto/:id/replicar', politicaDescCtrl.replicar);

// Bonificações
router.get('/bonificacoes/grupos/buscar',    bonificacoesCtrl.buscarGrupo);
router.get('/bonificacoes',                  bonificacoesCtrl.listar);
router.get('/bonificacoes/:id',              bonificacoesCtrl.buscarPorId);
router.post('/bonificacoes',                 bonificacoesCtrl.criar);
router.put('/bonificacoes/:id',              bonificacoesCtrl.atualizar);
router.delete('/bonificacoes/:id',           bonificacoesCtrl.excluir);
router.patch('/bonificacoes/:id/ativar',     bonificacoesCtrl.ativar);
router.patch('/bonificacoes/:id/inativar',   bonificacoesCtrl.inativar);
router.post('/bonificacoes/:id/replicar',    bonificacoesCtrl.replicar);

module.exports = router;
