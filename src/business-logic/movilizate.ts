import * as log from "../log/logger";
import MsSqlServer from "../database/sqlserver";
import { EMAIL_CONFIG } from "../config/config";
const logger = log.logger(__filename);

export default class Movilizate {
  private static _instance: Movilizate;
  private queryTransactionIsolation: string = "set transaction isolation level read uncommitted ";
  private queryGetEmailConfiguration: string =
    this.queryTransactionIsolation + `select idConfiguracion, ValorTexto from Configuracion where idconfiguracion in ($param1)`; // (11,12,13,14,15,20,21,22);";
  private queryGetValorParametro: string =
    this.queryTransactionIsolation + `select Descripcion, Valor from sl_lista_sarlaft_parametro where Codigo = '$param1';`;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase de Logica de Negocio de Movilizate Inicializada !");
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

  getValorParametro(parametro: string) {
    return new Promise<IParametro>((resolve, reject) => {
      let query: string = this.queryGetValorParametro.replace("$param1", parametro);
      //   logger.info(query);
      MsSqlServer.ejecutarQuery(query, MsSqlServer.instance.getDataBaseTopaz())
        .then((results: IParametro[]) => {
          // logger.debug("resultado => " + results);
          if (results.length === 0) {
            resolve({
              Descripcion: "",
              Valor: "[]"
            });
          } else {
            resolve(results[0]);
          }
        })
        .catch((error: Error) => {
          logger.error(error);
          reject(error);
        });
    });
  }
}

export interface IEmailConfiguration {
  idConfiguracion: number;
  ValorTexto: string;
}

export interface IParametro {
  Descripcion: string;
  Valor: string;
}

export interface IParametroValorEnvioCorreoEmail {
  tipo: number;
  notificar: boolean;
}

export interface IParametroValorListasTipo2 {
  lista: string;
}
