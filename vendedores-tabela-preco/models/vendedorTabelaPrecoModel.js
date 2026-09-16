'use strict';
const { getPoolERP: getPool, sql } = require('../../config/dbConfig');

const FILIAL_PADRAO = '0101';
const PROTHEUS_DB = process.env.DB_DATABASE_PROT || 'p11_prod';

const SELECT_BASE = `
  SELECT H02.H02_FILIAL AS FILIAL, RTRIM(H02.H02_VEND) AS VEND, RTRIM(A3.A3_NOME) AS VENDEDOR_NOME,
         RTRIM(H02.H02_CODTAB) AS CODTAB, RTRIM(DA0.DA0_DESCRI) AS TABELA_DESCRICAO, H02.H02_DATAALT AS DATAALT
  FROM ${PROTHEUS_DB}..H02010 H02
  LEFT JOIN ${PROTHEUS_DB}..SA3010 A3 ON A3.A3_COD = H02.H02_VEND AND A3.D_E_L_E_T_=''
  LEFT JOIN ${PROTHEUS_DB}..DA0010 DA0 ON DA0.DA0_CODTAB = H02.H02_CODTAB AND DA0.D_E_L_E_T_=''
`;

async function listar() {
  return (await (await getPool()).request()
    .input('filial', sql.VarChar(6), FILIAL_PADRAO)
    .query(`${SELECT_BASE} WHERE H02.H02_FILIAL=@filial ORDER BY VENDEDOR_NOME, TABELA_DESCRICAO`)).recordset;
}

async function buscarPorChave(vend, codtab) {
  return (await (await getPool()).request()
    .input('filial', sql.VarChar(6), FILIAL_PADRAO)
    .input('vend', sql.VarChar(4), vend)
    .input('codtab', sql.VarChar(3), codtab)
    .query(`${SELECT_BASE} WHERE H02.H02_FILIAL=@filial AND H02.H02_VEND=@vend AND H02.H02_CODTAB=@codtab`)).recordset[0] || null;
}

async function existeAssociacao(vend, codtab) {
  return !!(await (await getPool()).request()
    .input('filial', sql.VarChar(6), FILIAL_PADRAO)
    .input('vend', sql.VarChar(4), vend)
    .input('codtab', sql.VarChar(3), codtab)
    .query(`SELECT TOP 1 1 AS ok FROM ${PROTHEUS_DB}..H02010 WHERE H02_FILIAL=@filial AND H02_VEND=@vend AND H02_CODTAB=@codtab`)).recordset[0];
}

async function criar(dados) {
  const pool = await getPool();
  await pool.request()
    .input('filial', sql.VarChar(6), FILIAL_PADRAO)
    .input('vend', sql.VarChar(4), dados.vend)
    .input('codtab', sql.VarChar(3), dados.codtab)
    .input('dataalt', sql.VarChar(8), dados.dataalt)
    .query(`INSERT INTO ${PROTHEUS_DB}..H02010 (H02_FILIAL, H02_VEND, H02_CODTAB, H02_DATAALT)
            VALUES (@filial, @vend, @codtab, @dataalt)`);
}

async function atualizar(vendAtual, codtabAtual, dados) {
  const pool = await getPool();
  const result = await pool.request()
    .input('filial', sql.VarChar(6), FILIAL_PADRAO)
    .input('vendAtual', sql.VarChar(4), vendAtual)
    .input('codtabAtual', sql.VarChar(3), codtabAtual)
    .input('vendNovo', sql.VarChar(4), dados.vend)
    .input('codtabNovo', sql.VarChar(3), dados.codtab)
    .input('dataalt', sql.VarChar(8), dados.dataalt)
    .query(`UPDATE ${PROTHEUS_DB}..H02010 SET H02_VEND=@vendNovo, H02_CODTAB=@codtabNovo, H02_DATAALT=@dataalt
            WHERE H02_FILIAL=@filial AND H02_VEND=@vendAtual AND H02_CODTAB=@codtabAtual`);
  return result.rowsAffected[0];
}

async function excluir(vend, codtab) {
  const result = await (await getPool()).request()
    .input('filial', sql.VarChar(6), FILIAL_PADRAO)
    .input('vend', sql.VarChar(4), vend)
    .input('codtab', sql.VarChar(3), codtab)
    .query(`DELETE FROM ${PROTHEUS_DB}..H02010 WHERE H02_FILIAL=@filial AND H02_VEND=@vend AND H02_CODTAB=@codtab`);
  return result.rowsAffected[0];
}

async function listarVendedores() {
  return (await (await getPool()).request().query(`
    SELECT RTRIM(A3_COD) AS COD, RTRIM(A3_NOME) AS NOME
    FROM ${PROTHEUS_DB}..SA3010
    WHERE D_E_L_E_T_=''
    ORDER BY A3_NOME
  `)).recordset;
}

async function listarTabelasPreco() {
  return (await (await getPool()).request().query(`
    SELECT RTRIM(DA0_CODTAB) AS COD, RTRIM(DA0_DESCRI) AS DESCRICAO
    FROM ${PROTHEUS_DB}..DA0010
    WHERE D_E_L_E_T_='' AND DA0_ATIVO='1'
    ORDER BY DA0_DESCRI
  `)).recordset;
}

module.exports = {
  FILIAL_PADRAO,
  listar,
  buscarPorChave,
  existeAssociacao,
  criar,
  atualizar,
  excluir,
  listarVendedores,
  listarTabelasPreco,
};
