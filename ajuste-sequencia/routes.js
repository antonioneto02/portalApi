'use strict';
const { Router } = require('express');
const ctrl = require('./controllers/sequenciaController');
const router = Router();

router.get('/sequencia/carga',         ctrl.buscarCarga);
router.post('/sequencia/padronizar',   ctrl.padronizarSequencia);

module.exports = router;
