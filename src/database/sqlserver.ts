import mssql, { RequestError, IResult, ISqlTypeFactory, ISqlType } from "mssql";
import { DATA_BASE_CONFIG_MOVILIZATE } from "../config/config";
import * as log from "../log/logger";
const logger = log.logger(__filename);

export default class MsSqlServer {
  private static _instance: MsSqlServer;

  poolConnection: mssql.ConnectionPool;
  isConnected: boolean = false;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  /**
   * Clase Inicializada con el patron Singleton, para solo mantener un solo pool de conexiones desde la aplicacion !
   */
  constructor() {
    logger.info("Clase de conexion a la base de datos Inicializada !");
    this.poolConnection = new mssql.ConnectionPool(DATA_BASE_CONFIG_MOVILIZATE).on("error", err => {
      logger.error(err);
    });
  }

  /**
   * Conexion a la base de datos, solo se debe hacer al momento de iniciar el servidor (index.ts)
   * este metodo NO debe ser llamado nuevamente.
   */
  async conectarDB() {
    if (this.isConnected) {
      logger.warn("La conexion a la base de datos ya existe, por favor NO intente crear otra conexion, utilice la que ya existe !");
    }
    await this.poolConnection.connect();
    this.isConnected = true;
    logger.info("La conexion a la base de datos fue exitosa !");

    // this.poolConnection.connect((err: mssql.ConnectionError) => {
    //   if (err) {
    //     logger.error(err.message);
    //     return;
    //   }
    //   this.isConnected = true;
    //   logger.error("Conectado a la Base de Datos: ");
    // });
  }

  /**
   * Close all active connections in the pool.
   */
  public cerrarPoolConnection() {
    this.isConnected = false;
    this.poolConnection.close();
  }

  /**
   * Este metodo ejecuta un insert
   * @param insertQuery ejemplo: insert into testtable (somecolumn, somecolumn2) values (@myval, @myval2)
   * @param values este valor es un json de la forma como esta el siguiente ejemplo: [{"name": "myval", "type": "mssql.VarChar", "value": "valor a insertar" }, { "name": "myval2", "type": "mssql.mssql.Int", "value": 12345 } ]
   */

  static insert(insertQuery: string, values: any) {
    return this.insertUpdateDelete(insertQuery, values);
  }

  static update(insertQuery: string, values: any) {
    return this.insertUpdateDelete(insertQuery, values);
  }

  static delete(insertQuery: string, values: any) {
    return this.insertUpdateDelete(insertQuery, values);
  }

  /**
   * Este metodo sirve para insert, update y delete
   * @param insertQuery ejemplo: insert into testtable (somecolumn, somecolumn2) values (@myval, @myval2)
   * @param values este valor es un json de la forma como esta el siguiente ejemplo: [{"name": "myval", "type": "mssql.VarChar", "value": "valor a insertar" }, { "name": "myval2", "type": "mssql.mssql.Int", "value": 12345 } ]
   */
  static insertUpdateDelete(insertQuery: string, values: any) {
    return new Promise((resolve, reject) => {
      let request = this.instance.poolConnection.request();

      values.forEach((name: string, type: ISqlType, value: string) => {
        logger.info(`############## name: ${name},    type:${type},    value:${value} ##############`);
        request.input(name, type, value);
      });

      request.query(insertQuery, (err, result) => {
        if (err) {
          logger.error("Error al intentar el insert: " + insertQuery);
          logger.error(err);
          reject(err);
        }

        if (result === undefined || result.recordset.length === 0) {
          reject("**********************");
        } else {
          resolve(result.recordset);
        }
      });
    });
  }

  static insertUpdateDeleteWithPreparedStatement(insertQuery: string, values: any) {
    let ps = new mssql.PreparedStatement(this.instance.poolConnection);

    // values.forEach((name: string, type: ISqlType, value: string) => {
    //   logger.error(`############## name: ${name},    type:${type},    value:${value} ##############`);
    //   ps.input(name, type, value);
    // });

    // ps.input("param", mssql.Int);
    // ps.prepare("select @param as value", err => {
    //   // ... error checks

    //   ps.execute({ param: 12345 }, (err, result) => {
    //     // ... error checks

    //     logger.error(result.recordset[0].value); // return 12345
    //     logger.error(result.rowsAffected); // Returns number of affected rows in case of INSERT, UPDATE or DELETE statement.

    //     ps.unprepare(err => {
    //       // ... error checks
    //     });
    //   });
    // });
  }

  /**
   * Este metodo ejecuta un query pasado como parametro
   * @param query
   */
  static ejecutarQuery(query: string) {
    return new Promise((resolve, reject) => {
      this.instance.poolConnection.request().query(query, (err, results) => {
        if (err) {
          logger.error("Error en query");
          logger.error(err);
          reject(err);
        }

        if (results === undefined || results.recordset.length === 0) {
          reject("El registro solicitado no existe.");
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
  static ejecutarProcedure(query: string, input: string) {
    return new Promise((resolve, reject) => {
      this.instance.poolConnection
        .request()
        .input("input_parameter", mssql.Int, input)
        .output("output_parameter", mssql.VarChar(50))
        .execute("procedure_name", (err, result) => {
          if (err) {
            logger.error("Error en query");
            logger.error(err);
            reject(err);
          }

          if (result === undefined || result.recordset.length === 0) {
            reject("El registro solicitado no existe.");
          } else {
            resolve(result.recordset);
          }

          console.dir(result);
        });
    });
  }
}
