'use strict';
const { getPoolPoliticas, getPoolDw, sql } = require('../../config/dbConfig');

async function listarPorPolitica(idPolitica) {
  const pool = await getPoolPoliticas();
  const result = await pool.request().input('idPolitica', sql.Int, idPolitica)
    .query(`SELECT ID, CODPROD, DT_INCLUSAO FROM dbo.POLITICAS_DESCONTO_PRODUTOS
            WHERE ID_POLITICA=@idPolitica ORDER BY DT_INCLUSAO`);
  return result.recordset;
}

async function adicionar(idPolitica, codprod) {
  const pool = await getPoolPoliticas();
  const result = await pool.request()
    .input('idPolitica', sql.Int, idPolitica).input('codprod', sql.VarChar(30), codprod)
    .query(`INSERT INTO dbo.POLITICAS_DESCONTO_PRODUTOS (ID_POLITICA, CODPROD)
            OUTPUT INSERTED.ID VALUES (@idPolitica, @codprod)`);
  return result.recordset[0].ID;
}

async function remover(idPolitica, codprod) {
  const pool = await getPoolPoliticas();
  const result = await pool.request()
    .input('idPolitica', sql.Int, idPolitica).input('codprod', sql.VarChar(30), codprod)
    .query(`DELETE FROM dbo.POLITICAS_DESCONTO_PRODUTOS WHERE ID_POLITICA=@idPolitica AND CODPROD=@codprod`);
  return result.rowsAffected[0];
}

async function listarCodprods(idPolitica) {
  const pool = await getPoolPoliticas();
  const result = await pool.request().input('idPolitica', sql.Int, idPolitica)
    .query(`SELECT CODPROD FROM dbo.POLITICAS_DESCONTO_PRODUTOS WHERE ID_POLITICA=@idPolitica`);
  return result.recordset.map(r => r.CODPROD);
}

async function sincronizarProdutosNovos(idPolitica) {
  const [poolDw, poolPol] = await Promise.all([getPoolDw(), getPoolPoliticas()]);
  const [ativos, ocupados] = await Promise.all([
    poolDw.request().query(`SELECT DISTINCT CODPROD FROM [dbo].[V_PRODUTOS_ATIVOS] WHERE CODPROD IS NOT NULL`),
    poolPol.request().query(`SELECT CODPROD FROM dbo.POLITICAS_DESCONTO_PRODUTOS WHERE ID_POLITICA IN (9, 10, 11)`),
  ]);
  const ocupadosSet = new Set(ocupados.recordset.map(r => r.CODPROD));
  const novos = ativos.recordset.filter(r => !ocupadosSet.has(r.CODPROD));
  for (const { CODPROD } of novos) {
    await poolPol.request()
      .input('idPolitica', sql.Int, idPolitica).input('codprod', sql.VarChar(30), CODPROD)
      .query(`IF NOT EXISTS (SELECT 1 FROM dbo.POLITICAS_DESCONTO_PRODUTOS WHERE ID_POLITICA=@idPolitica AND CODPROD=@codprod)
              INSERT INTO dbo.POLITICAS_DESCONTO_PRODUTOS (ID_POLITICA, CODPROD) VALUES (@idPolitica, @codprod)`);
  }
  return novos.length;
}

async function listarTodosProdutosComPolitica() {
  const pool = await getPoolPoliticas();
  const result = await pool.request().query(`
    WITH PoliticaVigente AS (
      SELECT pdp.CODPROD, pd.ID AS ID_POLITICA, pd.DESCRICAO, pd.PERC_DESCONTO, pd.DT_INICIO, pd.DT_FIM,
             ROW_NUMBER() OVER (PARTITION BY pdp.CODPROD ORDER BY pd.ID DESC) AS RN
      FROM dbo.POLITICAS_DESCONTO_PRODUTOS pdp
      INNER JOIN dbo.POLITICAS_DESCONTO pd ON pd.ID = pdp.ID_POLITICA
      WHERE pd.ATIVO=1 AND CAST(pd.DT_INICIO AS DATE)<=CAST(GETDATE() AS DATE) AND CAST(pd.DT_FIM AS DATE)>=CAST(GETDATE() AS DATE)
    )
    SELECT vp.SEQ, vp.FAMILIA, vp.CODPROD, vp.PRODUTO,
           pv.ID_POLITICA, pv.DESCRICAO AS POLITICA_DESCRICAO, pv.PERC_DESCONTO, pv.DT_INICIO, pv.DT_FIM
    FROM dw.dbo.V_PRODUTOS_ATIVOS vp
    LEFT JOIN PoliticaVigente pv ON pv.CODPROD COLLATE LATIN1_GENERAL_CI_AS = vp.CODPROD COLLATE LATIN1_GENERAL_CI_AS AND pv.RN=1
    ORDER BY vp.FAMILIA, vp.PRODUTO
  `);
  return result.recordset;
}

async function listarSemPolitica() {
  const pool = await getPoolPoliticas();
  const result = await pool.request().query(`
    SELECT DISTINCT RTRIM(DA1.DA1_CODPRO) AS CODPROD,
           ISNULL((SELECT TOP 1 PRODUTO FROM dw.dbo.V_PRODUTOS_ATIVOS WHERE CODPROD=RTRIM(DA1.DA1_CODPRO)),'') AS PRODUTO,
           A.FAMILIA
    FROM p11_prod..H02010 H02
    INNER JOIN p11_prod..DA0010 DA0 ON H02.H02_CODTAB=DA0.DA0_CODTAB AND DA0.D_E_L_E_T_=''
    INNER JOIN p11_prod..DA1010 DA1 ON DA0.DA0_CODTAB=DA1.DA1_CODTAB AND DA1.D_E_L_E_T_=''
    INNER JOIN dw.dbo.SGC005 A ON RTRIM(DA1.DA1_CODPRO)=A.CODPROD
    WHERE DA0.D_E_L_E_T_='' AND DA0.DA0_DATDE<=CAST(GETDATE() AS DATE) AND DA0.DA0_DATATE>=CAST(GETDATE() AS DATE)
      AND DA1.DA1_ATIVO=1 AND DA1.DA1_VMINB>0
      AND NOT EXISTS (
        SELECT 1 FROM dbo.POLITICAS_DESCONTO_PRODUTOS pdp
        INNER JOIN dbo.POLITICAS_DESCONTO pd ON pd.ID=pdp.ID_POLITICA
        WHERE pd.ATIVO=1 AND CAST(pd.DT_INICIO AS DATE)<=CAST(GETDATE() AS DATE) AND CAST(pd.DT_FIM AS DATE)>=CAST(GETDATE() AS DATE)
          AND pdp.CODPROD COLLATE LATIN1_GENERAL_CI_AS=RTRIM(DA1.DA1_CODPRO) COLLATE LATIN1_GENERAL_CI_AS
      )
    ORDER BY FAMILIA, PRODUTO, CODPROD
  `);
  return result.recordset;
}

async function buscarProdutoDw(codprod) {
  const pool = await getPoolDw();
  const result = await pool.request().input('codprod', sql.VarChar(30), codprod)
    .query(`SELECT TOP 1 [SEQ],[FAMILIA],[CODPROD],[PRODUTO] FROM [dw].[dbo].[V_PRODUTOS_ATIVOS] WHERE [CODPROD]=@codprod`);
  return result.recordset[0] || null;
}

module.exports = { listarPorPolitica, adicionar, remover, listarCodprods, buscarProdutoDw, sincronizarProdutosNovos, listarTodosProdutosComPolitica, listarSemPolitica };
