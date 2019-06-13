import * as log from "../log/logger";
import MsSqlServer from "../database/sqlserver";
import { EMAIL_CONFIG } from "../config/config";
const logger = log.logger(__filename);

export default class Movilizate {
  private static _instance: Movilizate;
  private queryTransactionIsolation: string = "set transaction isolation level read uncommitted ";
  private queryGetEmailConfiguration: string =
    this.queryTransactionIsolation + `select idConfiguracion, ValorTexto from Configuracion where idconfiguracion in ($param1)`; // (11,12,13,14,15,20,21,22);";

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.info("Clase de Logica de Negocio de Movilizate Inicializada !");
  }

  getEmailConfiguration() {
    return new Promise((resolve, reject) => {
      let query: string = this.queryGetEmailConfiguration.replace("$param1", Object.values(EMAIL_CONFIG).toString());
      //   logger.info(query);
      MsSqlServer.ejecutarQuery(query)
        .then(results => {
          logger.info("resultado => " + results);
          resolve(results);
        })
        .catch((error: Error) => {
          logger.error("resultado => " + error);
          reject(error);
        });
    });
  }
}
