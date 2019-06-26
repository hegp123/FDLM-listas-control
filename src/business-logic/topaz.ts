import * as log from "../log/logger";
import MsSqlServer, { ISqlValue } from "../database/sqlserver";
import mssql from "mssql";
const logger = log.logger(__filename);

export default class Topaz {
  private static _instance: Topaz;
  private queryTransactionIsolation: string = "set transaction isolation level read uncommitted ";
  private queryGetValorParametro: string =
    this.queryTransactionIsolation + `select Descripcion, Valor from sl_lista_sarlaft_parametro where Codigo = '$param1'`;
  private queryGetPersonasXNumeroSolicitud: string =
    this.queryTransactionIsolation +
    `select  TipoDocumento, nrodocumento, numsolicitud from sl_lista_sarlaft_temporal_envio_correo where numsolicitud = $param1`;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase de Logica de Negocio de Topaz Inicializada !");
  }

  /**
   * Funcion que trae el valor de un parametro
   * @param codigo
   */
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

  /**
   * Funcion que trae las personas consultadas en la lista que no tuvieron riesgos y han sido almacenadas por solicitud
   * Las necesitamos para mandarlas a bloquear, porque alguien de la misma solicitud está reportado en las listas :(
   * @param numSolicitud
   */
  getPersonasTemporalesXNumeroSolicitud(numSolicitud: number) {
    return new Promise<ITemporalEnvioCorreo[]>((resolve, reject) => {
      let query: string = this.queryGetPersonasXNumeroSolicitud.replace("$param1", numSolicitud.toString());
      //   logger.info(query);
      MsSqlServer.ejecutarQuery(query, MsSqlServer.instance.getDataBaseTopaz())
        .then((results: ITemporalEnvioCorreo[]) => {
          // logger.debug("resultado => " + results);
          if (results.length === 0) {
            resolve([]);
          } else {
            resolve(results);
          }
        })
        .catch((error: Error) => {
          logger.error(error);
          reject(error);
        });
    });
  }

  /**
   * Funcion que inserta en la tabla sl_lista_sarlaft_bloqueo_persona
   */
  insertBloqueoPersona({
    tipoDocumento,
    nrodocumento,
    numsolicitud,
    bloqueo,
    nivelriesgo,
    observacion
  }: {
    tipoDocumento: string;
    nrodocumento: string;
    numsolicitud: number;
    bloqueo: number;
    nivelriesgo: number;
    observacion: string;
  }) {
    return new Promise((resolve, reject) => {
      let values: ISqlValue[] = [
        { name: "TipoDocumento", type: mssql.VarChar, value: tipoDocumento },
        { name: "nrodocumento", type: mssql.VarChar, value: nrodocumento },
        { name: "numsolicitud", type: mssql.Float, value: numsolicitud },
        { name: "bloqueo", type: mssql.Int, value: bloqueo },
        { name: "fecha", type: mssql.DateTime, value: new Date() },
        { name: "nivelriesgo", type: mssql.Int, value: nivelriesgo },
        { name: "observacion", type: mssql.NVarChar, value: observacion }
      ];
      let insert = "insert into sl_lista_sarlaft_bloqueo_persona ";
      insert += " (TipoDocumento, nrodocumento, numsolicitud, bloqueo, fecha, nivelriesgo,observacion) ";
      insert += " values (@TipoDocumento, @nrodocumento, @numsolicitud, @bloqueo, @fecha, @nivelriesgo, @observacion)";
      MsSqlServer.insert(insert, values, MsSqlServer.instance.getDataBaseTopaz())
        .then(result => {
          resolve(result);
        })
        .catch((error: Error) => {
          logger.error(error);
          reject(error.message);
        });
    });
  }

  /**
   * Funcion que inserta en la tabla sl_lista_sarlaft_temporal_envio_correo
   * @param param0
   */
  insertTemporalEnvioCorreo({ tipoDocumento, nrodocumento, numsolicitud }: { tipoDocumento: string; nrodocumento: string; numsolicitud: number }) {
    return new Promise((resolve, reject) => {
      let values: ISqlValue[] = [
        { name: "TipoDocumento", type: mssql.VarChar, value: tipoDocumento },
        { name: "nrodocumento", type: mssql.VarChar, value: nrodocumento },
        { name: "numsolicitud", type: mssql.Float, value: numsolicitud }
      ];
      let insert = "insert into sl_lista_sarlaft_temporal_envio_correo ";
      insert += " (TipoDocumento, nrodocumento, numsolicitud) ";
      insert += " values (@TipoDocumento, @nrodocumento, @numsolicitud)";
      MsSqlServer.insert(insert, values, MsSqlServer.instance.getDataBaseTopaz())
        .then(result => {
          resolve(result);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error.message);
        });
    });
  }

  /**
   * Funcion que inserta en la tabla sl_lista_sarlaft_detalle
   * @param param0
   */
  insertDetalle({
    riesgo,
    lista,
    numsolicitud,
    nrodocumento,
    descripcion
  }: {
    riesgo: string;
    lista: string;
    numsolicitud: number;
    nrodocumento: string;
    descripcion: string;
  }) {
    return new Promise((resolve, reject) => {
      let values: ISqlValue[] = [
        { name: "riesgo", type: mssql.VarChar, value: riesgo },
        { name: "lista", type: mssql.VarChar, value: lista },
        { name: "numsolicitud", type: mssql.Float, value: numsolicitud },
        { name: "nrodocumento", type: mssql.VarChar, value: nrodocumento },
        { name: "fechalog", type: mssql.DateTime, value: new Date() },
        { name: "descripcion", type: mssql.NVarChar, value: descripcion }
      ];
      let insert = "insert into sl_lista_sarlaft_detalle ";
      insert += " (riesgo, lista, numsolicitud, nrodocumento, fechalog, descripcion) ";
      insert += " values (@riesgo, @lista, @numsolicitud, @nrodocumento, @fechalog, @descripcion)";
      MsSqlServer.insert(insert, values, MsSqlServer.instance.getDataBaseTopaz())
        .then(result => {
          resolve(result);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error.message);
        });
    });
  }

  /**
   * Funcion que elimina todos los registros temporales de una solicitud
   * Se elimina porque ya se utilizo para bloquearlos, entones despues de bloqueados ya no son necesarios, seria basura
   * @param param0
   */
  deleteTemporalEnvioCorreo({ numsolicitud }: { numsolicitud: number }) {
    return new Promise((resolve, reject) => {
      let values: ISqlValue[] = [{ name: "numsolicitud", type: mssql.Float, value: numsolicitud }];
      let deleteQuery = "delete from sl_lista_sarlaft_temporal_envio_correo where numsolicitud = @numsolicitud ";

      MsSqlServer.delete(deleteQuery, values, MsSqlServer.instance.getDataBaseTopaz())
        .then(result => {
          resolve(result);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error.message);
        });
    });
  }
  //
  //
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

export interface ITemporalEnvioCorreo {
  TipoDocumento: string;
  nrodocumento: string;
  numsolicitud: number;
}
