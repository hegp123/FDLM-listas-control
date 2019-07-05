import mssql, { RequestError, IResult, ISqlTypeFactory, ISqlType, Transaction } from "mssql";
import { DATA_BASE_CONFIG_MOVILIZATE, DATA_BASE_CONFIG_VIGIA, DATA_BASE_CONFIG_TOPAZ } from "../config/config";
const async = require("async");
import * as log from "../log/logger";
const logger = log.logger(__filename);

export default class MsSqlServer {
  private static _instance: MsSqlServer;

  poolConnectionMovilizate: mssql.ConnectionPool;
  poolConnectionVigia: mssql.ConnectionPool;
  poolConnectionTopaz: mssql.ConnectionPool;
  isConnectedMovilizate: boolean = false;
  isConnectedVigia: boolean = false;
  isConnectedTopaz: boolean = false;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  public getDataBaseMovilizate() {
    return this.poolConnectionMovilizate;
  }

  public getDataBaseVigia() {
    return this.poolConnectionVigia;
  }

  public getDataBaseTopaz() {
    return this.poolConnectionTopaz;
  }

  /**
   * Clase Inicializada con el patron Singleton, para solo mantener un solo pool de conexiones desde la aplicacion !
   */
  constructor() {
    logger.debug("Clase de conexion a la base de datos Inicializada !");
    this.poolConnectionMovilizate = new mssql.ConnectionPool(DATA_BASE_CONFIG_MOVILIZATE).on("error", err => {
      logger.error(err);
    });
    this.poolConnectionVigia = new mssql.ConnectionPool(DATA_BASE_CONFIG_VIGIA).on("error", err => {
      logger.error(err);
    });
    this.poolConnectionTopaz = new mssql.ConnectionPool(DATA_BASE_CONFIG_TOPAZ).on("error", err => {
      logger.error(err);
    });
  }

  /**
   * Conexion a la base de datos, solo se debe hacer al momento de iniciar el servidor (index.ts)
   * este metodo NO debe ser llamado nuevamente.
   */
  async conectarDBMovilizate() {
    if (this.isConnectedMovilizate) {
      logger.warn("La conexion a la base de datos MOVILIZATE ya existe, por favor NO intente crear otra conexion, utilice la que ya existe !");
    }
    await this.poolConnectionMovilizate.connect();
    this.isConnectedMovilizate = true;
    logger.info("La conexion a la base de datos MOVILIZATE fue exitosa !");
  }

  async conectarDBVigia() {
    if (this.isConnectedVigia) {
      logger.warn("La conexion a la base de datos VIGIA ya existe, por favor NO intente crear otra conexion, utilice la que ya existe !");
    }
    await this.poolConnectionVigia.connect();
    this.isConnectedVigia = true;
    logger.info("La conexion a la base de datos VIGIA fue exitosa !");
  }

  async conectarDBTopaz() {
    if (this.isConnectedTopaz) {
      logger.warn("La conexion a la base de datos TOPAZ ya existe, por favor NO intente crear otra conexion, utilice la que ya existe !");
    }
    await this.poolConnectionTopaz.connect();
    this.isConnectedTopaz = true;
    logger.info("La conexion a la base de datos TOPAZ fue exitosa !");
  }

  /**
   * Close all active connections in the pool.
   */
  public cerrarPoolConnectionMovilizate() {
    this.isConnectedMovilizate = false;
    this.poolConnectionMovilizate.close();
  }

  public cerrarPoolConnectionVigia() {
    this.isConnectedVigia = false;
    this.poolConnectionVigia.close();
  }

  public cerrarPoolConnectionTopaz() {
    this.isConnectedTopaz = false;
    this.poolConnectionTopaz.close();
  }

  /**
   * Este metodo ejecuta un insert
   * @param insertQuery ejemplo: insert into testtable (somecolumn, somecolumn2) values (@myval, @myval2)
   * @param values este valor es un json de la forma como esta el siguiente ejemplo: [{"name": "myval", "type": "mssql.VarChar", "value": "valor a insertar" }, { "name": "myval2", "type": "mssql.mssql.Int", "value": 12345 } ]
   */
  static insert(insertQuery: string, values: any[], dataBase: mssql.ConnectionPool, requestTransaction?: mssql.Request) {
    return this.insertUpdateDelete(insertQuery, values, dataBase, requestTransaction);
  }

  static update(insertQuery: string, values: any, dataBase: mssql.ConnectionPool, requestTransaction?: mssql.Request) {
    return this.insertUpdateDelete(insertQuery, values, dataBase, requestTransaction);
  }

  static delete(insertQuery: string, values: any, dataBase: mssql.ConnectionPool, requestTransaction?: mssql.Request) {
    return this.insertUpdateDelete(insertQuery, values, dataBase, requestTransaction);
  }

  /**
   * Este metodo sirve para insert, update y delete
   * @param insertQuery ejemplo: insert into testtable (somecolumn, somecolumn2) values (@myval, @myval2)
   * @param values este valor es un json de la forma como esta el siguiente ejemplo: [{"name": "myval", "type": mssql.VarChar, "value": "valor a insertar" }, { "name": "myval2", "type": mssql.Int, "value": 12345 } ]
   */
  private static insertUpdateDelete(insertQuery: string, values: ISqlValue[], dataBase: mssql.ConnectionPool, requestTransaction?: mssql.Request) {
    return new Promise((resolve, reject) => {
      let request: any;
      if (requestTransaction) {
        request = requestTransaction;
      } else {
        request = dataBase.request();
      }

      // logger.debug(`############## insertQuery: ${insertQuery}`);
      // logger.debug(`############## values: ${JSON.stringify(values)}`);
      values.forEach(value => {
        // logger.debug(`############## name: ${value.name},    type:${value.type},    value:${value.value} ##############`);
        request.input(value.name, value.type, value.value);
      });

      request.query(insertQuery, (error: any, result: any) => {
        // esto es lo que trae la variable result:  {"recordsets":[],"output":{},"rowsAffected":[1]}
        if (error) {
          logger.error(JSON.stringify(error));
          reject(error);
          return;
        }
        resolve({ ok: true, message: "El proceso fué exitoso." });
      });
    });
  }

  /**
   * Este metodo ejecuta un query pasado como parametro
   * @param query
   */
  static ejecutarQuery(query: string, dataBase: mssql.ConnectionPool, requestTransaction?: mssql.Request): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let request: any;
      if (requestTransaction) {
        request = requestTransaction;
      } else {
        request = dataBase.request();
      }
      request.query(query, (err: any, results: any) => {
        if (err) {
          logger.error(err);
          reject(err);
          return;
        }

        if (results === undefined || results.recordset.length === 0) {
          logger.debug("El query no arrojó ningún resultado. " + query);
          resolve([]);
        } else {
          resolve(results.recordset);
        }
      });
    });
  }

  /**
   * Ejecuta un procedimiento al macenado
   * Esto no se ha probado aun, puede terner errores
   * @param query
   * @param input
   */
  static ejecutarProcedure(nombreProcedimiento: string, inputs: any[], outputs: any[], dataBase: mssql.ConnectionPool): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let request = dataBase.request();

      inputs.forEach(input => {
        request.input(input.name, input.type, input.value);
      });
      outputs.forEach(output => {
        request.output(output.name, output.type);
      });

      request.execute(nombreProcedimiento, (error, result: any) => {
        // esto es lo que trae la variable result:  {"recordsets":[],"output":{"PAR_ENCONTRO":"S","PAR_TIPO":"D","PAR_LISTAS":"(12)-LISTA FUNCIONARIOS ACTIVOS-Amenaza Alta-RECHAZAR VINCULACIËN"},"rowsAffected":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"returnValue":0}
        if (error) {
          logger.error(JSON.stringify(error));
          reject(error);
          return;
        }
        // logger.info("-------->" + JSON.stringify(result.output));
        resolve(result.output);
      });
    });
  }

  static async testCaseTransaccion_Commit_OK(dataBase: mssql.ConnectionPool) {
    return new Promise((resolve, reject) => {
      const transaction = new mssql.Transaction(dataBase);
      transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED, async (error: any) => {
        if (error) {
          reject({ ok: false, errorMessage: error });
        }
        try {
          const request = new mssql.Request(transaction);

          let values: ISqlValue[] = [
            { name: "riesgo", type: mssql.VarChar, value: "riesgo" },
            { name: "lista", type: mssql.VarChar, value: "lista" },
            { name: "numsolicitud", type: mssql.Float, value: 12345 },
            { name: "nrodocumento", type: mssql.VarChar, value: "nrodocumento" },
            { name: "fechalog", type: mssql.DateTime, value: new Date() },
            { name: "descripcion", type: mssql.NVarChar, value: "descripcion" }
          ];
          let insert = "insert into sl_lista_sarlaft_detalle ";
          insert += " (riesgo, lista, numsolicitud, nrodocumento, fechalog, descripcion) ";
          insert += " values (@riesgo, @lista, @numsolicitud, @nrodocumento, @fechalog, @descripcion)";

          values.forEach(value => {
            request.input(value.name, value.type, value.value);
          });

          const result1 = await request.query(insert);
          const result2 = await request.query(insert);
          const result3 = await request.query(insert);
          const result4 = await request.query(insert);
          const result5 = await request.query(insert);

          transaction.commit(commitError => {
            if (commitError) {
              logger.error("Error al hacer commit: " + commitError);
              reject({ ok: false, errorMessage: commitError });
              return;
            } else {
              logger.info("commit: OK");
              resolve("transaccion OK");
            }
          });
        } catch (err) {
          transaction.rollback(rollbackError => {
            if (rollbackError) {
              logger.error("Error al hacer rollback: " + rollbackError);
              reject({ ok: false, errorMessage: rollbackError });
              return;
            } else {
              logger.info("rollback: OK");
              reject(err);
              return;
            }
          });
        }
      });
    });
  }

  static async testCaseTransaccion_Roolback(dataBase: mssql.ConnectionPool) {
    return new Promise((resolve, reject) => {
      const transaction = new mssql.Transaction(dataBase);
      transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED, async (error: any) => {
        if (error) {
          reject({ ok: false, errorMessage: error });
        }
        try {
          const request = new mssql.Request(transaction);

          let values: ISqlValue[] = [
            { name: "riesgo", type: mssql.VarChar, value: "riesgo" },
            { name: "lista", type: mssql.VarChar, value: "lista" },
            { name: "numsolicitud", type: mssql.Float, value: 12345 },
            { name: "nrodocumento", type: mssql.VarChar, value: "nrodocumento" },
            { name: "fechalog", type: mssql.DateTime, value: new Date() },
            { name: "descripcion", type: mssql.NVarChar, value: "descripcion" }
          ];
          let insert = "insert into sl_lista_sarlaft_detalle ";
          insert += " (riesgo, lista, numsolicitud, nrodocumento, fechalog, descripcion) ";
          insert += " values (@riesgo, @lista, @numsolicitud, @nrodocumento, @fechalog, @descripcion)";

          values.forEach(value => {
            request.input(value.name, value.type, value.value);
          });

          const result1 = await request.query(insert);
          const result2 = await request.query(insert);
          const result3 = await request.query("insert into sl_lista_sarlaft_detalle este insert esta mal, solo para hacer la prueba del roolback");
          const result4 = await request.query(insert);
          const result5 = await request.query(insert);

          transaction.commit(commitError => {
            if (commitError) {
              logger.error("Error al hacer commit: " + commitError);
              reject({ ok: false, errorMessage: commitError });
              return;
            } else {
              logger.info("commit: OK");
              resolve("transaccion OK");
            }
          });
        } catch (err) {
          transaction.rollback(rollbackError => {
            if (rollbackError) {
              logger.error("Error al hacer rollback: " + rollbackError);
              reject({ ok: false, errorMessage: rollbackError });
              return;
            } else {
              logger.info("rollback: OK");
              reject(err);
              return;
            }
          });
        }
      });
    });
  }

  /**
   * Importante:  NO se debe utilizar for de esta forma: forEach(   ->  sale error
   * Se debe utilizar el for de esta forma:  for (let index = 0; index < 5; index++)
   * @param dataBase
   */
  static async testCaseTransaccion_Commit_OK_con_FOR(dataBase: mssql.ConnectionPool) {
    return new Promise((resolve, reject) => {
      // const transaction = new mssql.Transaction(dataBase);
      const transaction = dataBase.transaction();
      transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED, async (error: any) => {
        if (error) {
          reject({ ok: false, errorMessage: error });
        }
        try {
          // const request = new mssql.Request(transaction);
          const request = transaction.request();

          for (let index = 0; index < 5; index++) {
            let values: ISqlValue[] = [
              { name: "riesgo", type: mssql.VarChar, value: "riesgo" },
              { name: "lista", type: mssql.VarChar, value: "lista" },
              { name: "numsolicitud", type: mssql.Float, value: 12345 },
              { name: "nrodocumento", type: mssql.VarChar, value: "nrodocumento" },
              { name: "fechalog", type: mssql.DateTime, value: new Date() },
              { name: "descripcion", type: mssql.NVarChar, value: "descripcion" }
            ];
            let insert = "insert into sl_lista_sarlaft_detalle ";
            insert += " (riesgo, lista, numsolicitud, nrodocumento, fechalog, descripcion) ";
            insert += " values (@riesgo, @lista, @numsolicitud, @nrodocumento, @fechalog, @descripcion)";

            values.forEach(value => {
              request.input(value.name, value.type, value.value);
            });
            if (index === 3) {
              // await request.query("insert into sl_lista_sarlaft_detalle este insert esta mal, solo para hacer la prueba del roolback");
              await request.query(insert);
            }
            await request.query(insert);
          }

          transaction.commit(commitError => {
            if (commitError) {
              logger.error("Error al hacer commit: " + commitError);
              reject({ ok: false, errorMessage: commitError });
              return;
            } else {
              logger.info("commit: OK");
              resolve("transaccion OK");
            }
          });
        } catch (err) {
          transaction.rollback(rollbackError => {
            if (rollbackError) {
              logger.error("Error al hacer rollback: " + rollbackError);
              reject({ ok: false, errorMessage: rollbackError });
              return;
            } else {
              logger.info("rollback: OK");
              reject(err);
              return;
            }
          });
        }
      });
    });
  }

  //

  //
}

export interface ISqlValue {
  name: string;
  type: any;
  value?: string | number | Date;
}

// documentacion para revisar tranacciones
// https://www.npmjs.com/package/mssql#cli
