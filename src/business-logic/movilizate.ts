import * as log from "../log/logger";
import MsSqlServer from "../database/sqlserver";
import { EMAIL_CONFIG } from "../config/config";
const logger = log.logger(__filename);

export default class Movilizate {
  private static _instance: Movilizate;
  private queryTransactionIsolation: string = "set transaction isolation level read uncommitted ";
  private queryGetEmailConfiguration: string =
    this.queryTransactionIsolation + `select idConfiguracion, ValorTexto from Configuracion where idconfiguracion in ($param1)`; // (11,12,13,14,15,20,21,22);";
  private queryGetValorTextoConfiguracion: string =
    this.queryTransactionIsolation + `select ValorTexto from Configuracion where idconfiguracion = $param1`;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase de Logica de Negocio de Movilizate Inicializada !");
  }

  getConfiguration(idconfiguracion: string) {
    return new Promise<string>((resolve, reject) => {
      let query: string = this.queryGetValorTextoConfiguracion.replace("$param1", idconfiguracion);
      // logger.debug(query);
      MsSqlServer.ejecutarQuery(query, MsSqlServer.instance.getDataBaseMovilizate())
        .then((results: any[]) => {
          // logger.debug("resultado => " + results[0].ValorTexto);
          if (results.length === 0) {
            resolve("");
          } else {
            resolve(results[0].ValorTexto);
          }
        })
        .catch((error: Error) => {
          logger.error("resultado => " + error);
          reject(error);
        });
    });
  }

  getEmailConfiguration() {
    return new Promise<IEmailConfiguration[]>((resolve, reject) => {
      let query: string = this.queryGetEmailConfiguration.replace("$param1", Object.values(EMAIL_CONFIG).toString());
      // logger.debug(query);
      MsSqlServer.ejecutarQuery(query, MsSqlServer.instance.getDataBaseMovilizate())
        .then((results: IEmailConfiguration[]) => {
          // logger.debug("resultado => " + results);
          if (results.length === 0) {
            resolve([]);
          } else {
            resolve(results);
          }
        })
        .catch((error: Error) => {
          logger.error("resultado => " + error);
          reject(error);
        });
    });
  }
}

export interface IEmailConfiguration {
  idConfiguracion: number;
  ValorTexto: string;
}
