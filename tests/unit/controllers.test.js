const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const sequenciaController = require('../../ajuste-sequencia/controllers/sequenciaController');
const cargaController = require('../../limpar-carga/controllers/cargaController');
const bonificacoesController = require('../../politicas-desconto/controllers/bonificacoesController');
const politicasController = require('../../politicas-desconto/controllers/politicasController');
const politicaDescontoController = require('../../politicas-desconto/controllers/politicaDescontoController');
const produtosController = require('../../politicas-desconto/controllers/produtosController');

describe('ajuste-sequencia/sequenciaController', () => {
  test('exporta as funções esperadas', () => {
    assert.equal(typeof sequenciaController.buscarCarga, 'function');
    assert.equal(typeof sequenciaController.padronizarSequencia, 'function');
  });
});

describe('limpar-carga/cargaController', () => {
  test('exporta as funções esperadas', () => {
    assert.equal(typeof cargaController.buscarItens, 'function');
    assert.equal(typeof cargaController.limparCarga, 'function');
  });
});

describe('politicas-desconto/bonificacoesController', () => {
  test('exporta as funções esperadas', () => {
    for (const fn of ['listar', 'buscarPorId', 'criar', 'atualizar', 'excluir', 'ativar', 'inativar', 'replicar', 'buscarGrupo']) {
      assert.equal(typeof bonificacoesController[fn], 'function', `${fn} deveria ser função`);
    }
  });
});

describe('politicas-desconto/politicasController', () => {
  test('exporta as funções esperadas', () => {
    for (const fn of ['listar', 'buscarPorId', 'criar', 'atualizar', 'excluir', 'ativar', 'inativar', 'replicar', 'sincronizarPolitica11']) {
      assert.equal(typeof politicasController[fn], 'function', `${fn} deveria ser função`);
    }
  });
});

describe('politicas-desconto/politicaDescontoController', () => {
  test('exporta as funções esperadas', () => {
    for (const fn of ['listar', 'buscarPorId', 'criar', 'atualizar', 'excluir', 'ativar', 'inativar', 'replicar', 'buscarGrupo']) {
      assert.equal(typeof politicaDescontoController[fn], 'function', `${fn} deveria ser função`);
    }
  });
});

describe('politicas-desconto/produtosController', () => {
  test('exporta as funções esperadas', () => {
    for (const fn of ['buscarProduto', 'listarProdutos', 'adicionarProduto', 'removerProduto', 'listarTodosProdutosComPolitica', 'listarProdutosSemPolitica']) {
      assert.equal(typeof produtosController[fn], 'function', `${fn} deveria ser função`);
    }
  });
});
