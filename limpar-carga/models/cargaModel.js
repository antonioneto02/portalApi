'use strict';
const { getPoolERP: getPool, sql } = require('../../config/dbConfig');

async function buscarItensPorPedido(filial, pedido) {
  const pool = await getPool();
  const request = pool.request();
  let filtros = `sc9.D_E_L_E_T_ = '' AND RTRIM(sc9.C9_CARGA) != ''`;
  if (filial) { request.input('filial', sql.VarChar, filial); filtros += ` AND RTRIM(sc9.C9_FILIAL) = RTRIM(@filial)`; }
  if (pedido) { request.input('pedido', sql.VarChar, pedido); filtros += ` AND RTRIM(sc9.C9_PEDIDO) = RTRIM(@pedido)`; }
  const result = await request.query(`
    SELECT sc9.R_E_C_N_O_,
           RTRIM(sc9.C9_FILIAL) AS C9_FILIAL, RTRIM(sc9.C9_PEDIDO) AS C9_PEDIDO,
           RTRIM(sc9.C9_ITEM)   AS C9_ITEM,   RTRIM(sc9.C9_PRODUTO) AS C9_PRODUTO,
           ISNULL(RTRIM(sb1.B1_DESC),'') AS B1_DESC,
           RTRIM(sc9.C9_CARGA) AS C9_CARGA,
           ISNULL(RTRIM(sc9.C9_SEQCAR),'') AS C9_SEQCAR,
           sc9.C9_QUANT
    FROM SC9010 sc9 WITH(NOLOCK)
    LEFT JOIN SB1010 sb1 WITH(NOLOCK) ON RTRIM(sb1.B1_COD)=RTRIM(sc9.C9_PRODUTO) AND sb1.D_E_L_E_T_=''
    WHERE ${filtros}
    ORDER BY sc9.C9_FILIAL, sc9.C9_PEDIDO, sc9.C9_ITEM
  `);
  return result.recordset;
}

async function buscarItensPorCarga(carga) {
  const pool = await getPool();
  const result = await pool.request().input('carga', sql.VarChar, carga).query(`
    SELECT sc9.R_E_C_N_O_,
           RTRIM(sc9.C9_FILIAL) AS C9_FILIAL, RTRIM(sc9.C9_PEDIDO) AS C9_PEDIDO,
           RTRIM(sc9.C9_ITEM)   AS C9_ITEM,   RTRIM(sc9.C9_PRODUTO) AS C9_PRODUTO,
           ISNULL(RTRIM(sb1.B1_DESC),'') AS B1_DESC,
           RTRIM(sc9.C9_CARGA) AS C9_CARGA,
           ISNULL(RTRIM(sc9.C9_SEQCAR),'') AS C9_SEQCAR,
           sc9.C9_QUANT
    FROM SC9010 sc9 WITH(NOLOCK)
    LEFT JOIN SB1010 sb1 WITH(NOLOCK) ON RTRIM(sb1.B1_COD)=RTRIM(sc9.C9_PRODUTO) AND sb1.D_E_L_E_T_=''
    WHERE sc9.D_E_L_E_T_='' AND RTRIM(sc9.C9_CARGA)=RTRIM(@carga)
    ORDER BY sc9.C9_FILIAL, sc9.C9_PEDIDO, sc9.C9_ITEM
  `);
  return result.recordset;
}

async function limparCarga(recno) {
  const pool = await getPool();
  const result = await pool.request().input('recno', sql.BigInt, recno).query(`
    UPDATE SC9010 SET C9_CARGA='', C9_SEQCAR=''
    WHERE R_E_C_N_O_=@recno AND D_E_L_E_T_='' AND RTRIM(C9_CARGA)!=''
  `);
  return result.rowsAffected[0];
}

async function buscarItensHojeSemNfiscal(dataHoje, { filial, pedido, produto, qtdLibMin, qtdLibMax } = {}) {
  const pool = await getPool();
  const req = pool.request().input('dataHoje', sql.Char(8), dataHoje);

  let filtros = `D_E_L_E_T_ = ''
      AND C9_DATALIB = CONVERT(DATE, @dataHoje, 112)
      AND C9_NFISCAL = ''`;

  if (filial)  { req.input('filial',  sql.VarChar, filial);  filtros += ` AND RTRIM(C9_FILIAL)  LIKE '%' + @filial  + '%'`; }
  if (pedido)  { req.input('pedido',  sql.VarChar, pedido);  filtros += ` AND RTRIM(C9_PEDIDO)  LIKE '%' + @pedido  + '%'`; }
  if (produto) { req.input('produto', sql.VarChar, produto); filtros += ` AND RTRIM(C9_PRODUTO) LIKE '%' + @produto + '%'`; }
  if (qtdLibMin != null) { req.input('qtdMin', sql.Decimal(18, 4), qtdLibMin); filtros += ` AND C9_QTDLIB >= @qtdMin`; }
  if (qtdLibMax != null) { req.input('qtdMax', sql.Decimal(18, 4), qtdLibMax); filtros += ` AND C9_QTDLIB <= @qtdMax`; }

  const result = await req.query(`
    SELECT
      RTRIM(C9_FILIAL)  AS C9_FILIAL,
      RTRIM(C9_PEDIDO)  AS C9_PEDIDO,
      RTRIM(C9_ITEM)    AS C9_ITEM,
      RTRIM(C9_PRODUTO) AS C9_PRODUTO,
      C9_QTDLIB,
      CONVERT(VARCHAR(10), TRY_CONVERT(DATE, C9_DATALIB, 112), 23) AS C9_DATALIB,
      RTRIM(C9_NFISCAL) AS C9_NFISCAL,
      RTRIM(C9_CARGA)   AS C9_CARGA,
      RTRIM(C9_SEQCAR)  AS C9_SEQCAR,
      R_E_C_N_O_
    FROM SC9010 WITH(NOLOCK)
    WHERE ${filtros}
    ORDER BY C9_FILIAL, C9_PEDIDO, C9_ITEM
  `);
  return result.recordset;
}

module.exports = { buscarItensPorPedido, buscarItensPorCarga, limparCarga, buscarItensHojeSemNfiscal };
