'use strict';
const { Router } = require('express');
const canalVendaCtrl = require('./controllers/canalVendaController');

const router = Router();

router.get('/canais-venda', canalVendaCtrl.listar);
router.get('/canais-venda/:id', canalVendaCtrl.buscarPorId);
router.post('/canais-venda', canalVendaCtrl.criar);
router.put('/canais-venda/:id', canalVendaCtrl.atualizar);
router.delete('/canais-venda/:id', canalVendaCtrl.excluir);

module.exports = router;
