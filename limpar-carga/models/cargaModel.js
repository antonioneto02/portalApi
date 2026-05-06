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

async function buscarItensHojeSemNfiscal() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT C9_FILIAL, C9_PEDIDO, C9_ITEM, C9_PRODUTO, C9_QTDLIB, C9_DATALIB, C9_NFISCAL, C9_CARGA, C9_SEQCAR, R_E_C_N_O_
    FROM SC9010 WITH(NOLOCK)
    WHERE 1=1
      AND C9_DATALIB = CONVERT(DATE,GETDATE())
      AND C9_NFISCAL = ''
  `);
  return result.recordset;
}

module.exports = { buscarItensPorPedido, buscarItensPorCarga, limparCarga, buscarItensHojeSemNfiscal };
