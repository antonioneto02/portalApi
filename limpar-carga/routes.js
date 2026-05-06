'use strict';
const { Router } = require('express');
const ctrl = require('./controllers/cargaController');
const router = Router();

router.get('/sc9/itens',                  ctrl.buscarItens);
router.patch('/sc9/:recno/limpar-carga',  ctrl.limparCarga);

module.exports = router;
