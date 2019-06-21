import * as log from "../log/logger";
import MsSqlServer from "../database/sqlserver";
const logger = log.logger(__filename);

export default class Topaz {
  private static _instance: Topaz;
  private queryTransactionIsolation: string = "set transaction isolation level read uncommitted ";
  private queryGetValorParametro: string =
    this.queryTransactionIsolation + `select Descripcion, Valor from sl_lista_sarlaft_parametro where Codigo = '$param1'`;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase de Logica de Negocio de Topaz Inicializada !");
  }

  getValorParametro(codigo: string) {
    return new Promise<IParametro>((resolve, reject) => {
      let query: string = this.queryGetValorParametro.replace("$param1", codigo);
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
