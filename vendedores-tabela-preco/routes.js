'use strict';
const { Router } = require('express');
const ctrl = require('./controllers/vendedorTabelaPrecoController');

const router = Router();

router.get('/vendedores-tabela-preco', ctrl.listar);
router.get('/vendedores-tabela-preco/opcoes/vendedores', ctrl.opcoesVendedores);
router.get('/vendedores-tabela-preco/opcoes/tabelas', ctrl.opcoesTabelas);
router.get('/vendedores-tabela-preco/:vend/:codtab', ctrl.buscarPorChave);
router.post('/vendedores-tabela-preco', ctrl.criar);
router.put('/vendedores-tabela-preco/:vend/:codtab', ctrl.atualizar);
router.delete('/vendedores-tabela-preco/:vend/:codtab', ctrl.excluir);

module.exports = router;
