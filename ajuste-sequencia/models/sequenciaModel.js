'use strict';
const { getPoolERP: getPool, sql } = require('../../config/dbConfig');

async function buscarCarga(carga) {
  const pool = await getPool();
  const req = pool.request().input('carga', sql.VarChar(20), carga);

  const [dak, dai, sf2, sc9] = await Promise.all([
    req.query(`SELECT RTRIM(DAK_FILIAL) AS FILIAL, RTRIM(DAK_COD) AS COD, RTRIM(DAK_SEQCAR) AS SEQCAR
               FROM DAK010 WITH(NOLOCK)
               WHERE D_E_L_E_T_ <> '*' AND RTRIM(DAK_COD) = RTRIM(@carga)`),

    pool.request().input('carga2', sql.VarChar(20), carga).query(`
      SELECT RTRIM(DAI_FILIAL) AS FILIAL, RTRIM(DAI_COD) AS COD, RTRIM(DAI_SEQCAR) AS SEQCAR
      FROM DAI010 WITH(NOLOCK)
      WHERE D_E_L_E_T_ <> '*' AND RTRIM(DAI_COD) = RTRIM(@carga2)`),

    pool.request().input('carga3', sql.VarChar(20), carga).query(`
      SELECT RTRIM(F2_FILIAL) AS FILIAL, RTRIM(F2_CARGA) AS COD, RTRIM(F2_SEQCAR) AS SEQCAR
      FROM SF2010 WITH(NOLOCK)
      WHERE RTRIM(F2_CARGA) = RTRIM(@carga3)`),

    pool.request().input('carga4', sql.VarChar(20), carga).query(`
      SELECT RTRIM(C9_FILIAL) AS FILIAL, RTRIM(C9_CARGA) AS COD, RTRIM(C9_SEQCAR) AS SEQCAR
      FROM SC9010 WITH(NOLOCK)
      WHERE D_E_L_E_T_ <> '*' AND RTRIM(C9_CARGA) = RTRIM(@carga4)`),
  ]);

  const dakRec = dak.recordset[0] || null;
  if (!dakRec) return null;

  const seqMaster = dakRec.SEQCAR;

  return {
    dak: dakRec,
    seqMaster,
    divergentes: {
      dai: dai.recordset.filter(r => r.SEQCAR !== seqMaster),
      sf2: sf2.recordset.filter(r => r.SEQCAR !== seqMaster),
      sc9: sc9.recordset.filter(r => r.SEQCAR !== seqMaster),
    },
  };
}

async function padronizarSequencia(carga, seqcar) {
  const pool = await getPool();
  const req1 = pool.request().input('carga', sql.VarChar(20), carga).input('seq', sql.VarChar(10), seqcar);
  const req2 = pool.request().input('carga', sql.VarChar(20), carga).input('seq', sql.VarChar(10), seqcar);
  const req3 = pool.request().input('carga', sql.VarChar(20), carga).input('seq', sql.VarChar(10), seqcar);

  const [r1, r2, r3] = await Promise.all([
    req1.query(`UPDATE DAI010 SET DAI_SEQCAR=@seq
                WHERE D_E_L_E_T_<>'*' AND RTRIM(DAI_COD)=RTRIM(@carga) AND RTRIM(DAI_SEQCAR)<>RTRIM(@seq)`),
    req2.query(`UPDATE SF2010 SET F2_SEQCAR=@seq
                WHERE RTRIM(F2_CARGA)=RTRIM(@carga) AND RTRIM(F2_SEQCAR)<>RTRIM(@seq)`),
    req3.query(`UPDATE SC9010 SET C9_SEQCAR=@seq
                WHERE D_E_L_E_T_<>'*' AND RTRIM(C9_CARGA)=RTRIM(@carga) AND RTRIM(C9_SEQCAR)<>RTRIM(@seq)`),
  ]);

  return {
    dai: r1.rowsAffected[0],
    sf2: r2.rowsAffected[0],
    sc9: r3.rowsAffected[0],
  };
}

module.exports = { buscarCarga, padronizarSequencia };
