'use strict';
const { getPoolDw: getPool, sql } = require('../../config/dbConfig');

const SELECT_BASE = `SELECT id, CODCANAL, CANAL, DESP_PROMOTORES, DESP_COM, PERC_TRADE, PERC_RAPEL, PERC_COMISSAO, TP_FRETE, SEQ FROM dbo.SGC011`;

async function listar() {
  return (await (await getPool()).request().query(`${SELECT_BASE} ORDER BY CODCANAL`)).recordset;
}

async function buscarPorId(id) {
  return (await (await getPool()).request().input('id', sql.Int, id)
    .query(`${SELECT_BASE} WHERE id=@id`)).recordset[0] || null;
}

async function buscarPorCodCanal(codcanal) {
  return (await (await getPool()).request().input('codcanal', sql.VarChar(6), codcanal)
    .query(`SELECT TOP 1 id FROM dbo.SGC011 WHERE CODCANAL=@codcanal`)).recordset[0] || null;
}

async function criar(dados) {
  const pool = await getPool();
  const result = await pool.request()
    .input('codcanal', sql.VarChar(6), dados.codcanal)
    .input('canal', sql.VarChar(30), dados.canal)
    .input('despPromotores', sql.VarChar(1), dados.despPromotores)
    .input('despCom', sql.VarChar(1), dados.despCom)
    .input('percTrade', sql.Decimal(14, 4), dados.percTrade)
    .input('percRapel', sql.Decimal(14, 4), dados.percRapel)
    .input('percComissao', sql.Decimal(14, 4), dados.percComissao)
    .input('tpFrete', sql.VarChar(4), dados.tpFrete)
    .input('seq', sql.VarChar(2), dados.seq)
    .query(`INSERT INTO dbo.SGC011 (CODCANAL, CANAL, DESP_PROMOTORES, DESP_COM, PERC_TRADE, PERC_RAPEL, PERC_COMISSAO, TP_FRETE, SEQ)
            OUTPUT INSERTED.id
            VALUES (@codcanal, @canal, @despPromotores, @despCom, @percTrade, @percRapel, @percComissao, @tpFrete, @seq)`);
  return result.recordset[0].id;
}

async function atualizar(id, dados) {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('codcanal', sql.VarChar(6), dados.codcanal)
    .input('canal', sql.VarChar(30), dados.canal)
    .input('despPromotores', sql.VarChar(1), dados.despPromotores)
    .input('despCom', sql.VarChar(1), dados.despCom)
    .input('percTrade', sql.Decimal(14, 4), dados.percTrade)
    .input('percRapel', sql.Decimal(14, 4), dados.percRapel)
    .input('percComissao', sql.Decimal(14, 4), dados.percComissao)
    .input('tpFrete', sql.VarChar(4), dados.tpFrete)
    .input('seq', sql.VarChar(2), dados.seq)
    .query(`UPDATE dbo.SGC011 SET CODCANAL=@codcanal, CANAL=@canal, DESP_PROMOTORES=@despPromotores, DESP_COM=@despCom,
            PERC_TRADE=@percTrade, PERC_RAPEL=@percRapel, PERC_COMISSAO=@percComissao, TP_FRETE=@tpFrete, SEQ=@seq
            WHERE id=@id`);
  return result.rowsAffected[0];
}

async function excluir(id) {
  const result = await (await getPool()).request().input('id', sql.Int, id)
    .query(`DELETE FROM dbo.SGC011 WHERE id=@id`);
  return result.rowsAffected[0];
}

module.exports = { listar, buscarPorId, buscarPorCodCanal, criar, atualizar, excluir };
