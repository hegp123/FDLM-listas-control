import * as log from "../log/logger";
import MsSqlServer, { ISqlValue } from "../database/sqlserver";
import mssql, { Transaction } from "mssql";
import { IComplianceResponse } from "../services/compliance";
import Compliance from "./compliance";
import { CLIENTE_BLOQUEADO } from "../constants/Constantes";
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
  getPersonasTemporalesXNumeroSolicitud(numSolicitud: number, requestTransaction?: mssql.Request) {
    return new Promise<ITemporalEnvioCorreo[]>((resolve, reject) => {
      let query: string = this.queryGetPersonasXNumeroSolicitud.replace("$param1", numSolicitud.toString());
      //   logger.info(query);
      MsSqlServer.ejecutarQuery(query, MsSqlServer.instance.getDataBaseTopaz(), requestTransaction)
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
  insertBloqueoPersona(
    {
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
    },
    requestTransaction?: mssql.Request
  ) {
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
      MsSqlServer.insert(insert, values, MsSqlServer.instance.getDataBaseTopaz(), requestTransaction)
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
  insertTemporalEnvioCorreo(
    { tipoDocumento, nrodocumento, numsolicitud }: { tipoDocumento: string; nrodocumento: string; numsolicitud: number },
    requestTransaction?: mssql.Request
  ) {
    return new Promise((resolve, reject) => {
      let values: ISqlValue[] = [
        { name: "TipoDocumento", type: mssql.VarChar, value: tipoDocumento },
        { name: "nrodocumento", type: mssql.VarChar, value: nrodocumento },
        { name: "numsolicitud", type: mssql.Float, value: numsolicitud }
      ];
      let insert = "insert into sl_lista_sarlaft_temporal_envio_correo ";
      insert += " (TipoDocumento, nrodocumento, numsolicitud) ";
      insert += " values (@TipoDocumento, @nrodocumento, @numsolicitud)";
      MsSqlServer.insert(insert, values, MsSqlServer.instance.getDataBaseTopaz(), requestTransaction)
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
  insertDetalle(
    {
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
    },
    requestTransaction?: mssql.Request
  ) {
    return new Promise(async (resolve, reject) => {
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
      await MsSqlServer.insert(insert, values, MsSqlServer.instance.getDataBaseTopaz(), requestTransaction)
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
  deleteTemporalEnvioCorreo({ numsolicitud }: { numsolicitud: number }, requestTransaction?: mssql.Request) {
    return new Promise((resolve, reject) => {
      let values: ISqlValue[] = [{ name: "numsolicitud", type: mssql.Float, value: numsolicitud }];
      let deleteQuery = "delete from sl_lista_sarlaft_temporal_envio_correo where numsolicitud = @numsolicitud ";

      MsSqlServer.delete(deleteQuery, values, MsSqlServer.instance.getDataBaseTopaz(), requestTransaction)
        .then(result => {
          resolve(result);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error.message);
        });
    });
  }

  procesarRiesgo3(response: IComplianceResponse, listasTipo2: string[], numeroSolicitud: number, tipoRiesgo: number) {
    return new Promise(async (resolve, reject) => {
      const transaction: Transaction = await MsSqlServer.instance.getDataBaseTopaz().transaction();
      transaction.begin(mssql.ISOLATION_LEVEL.READ_COMMITTED, async (error: any) => {
        if (error) {
          reject({ ok: false, errorMessage: error });
        }
        try {
          const requestTransaction = transaction.request();

          let listas = response.resultados;
          let datoConsultado = response.datoConsultado.toString();
          for (let index = 0; index < listas.length; index++) {
            let resultado = listas[index];
            let descripcion: string = resultado.descripcion;
            let riesgo = Compliance.getTipoRiesgoPorResultado(resultado, listasTipo2);
            if (descripcion.length > 0) {
              await this.insertDetalle(
                {
                  riesgo: riesgo.toString(),
                  lista: resultado.lista,
                  numsolicitud: numeroSolicitud,
                  nrodocumento: datoConsultado,
                  descripcion: descripcion.toString()
                },
                requestTransaction
              );
            }
          }

          // //consultamos las otras personas que pertenecen a la solicitud, para bloquearlas
          let personasABloquear: ITemporalEnvioCorreo[] = await this.getPersonasTemporalesXNumeroSolicitud(numeroSolicitud, requestTransaction);
          // // adicionamos al cliente actualmente consultado y aparece en alguna de las listas con riesgo 3, entonces este man afecta a los demas consultados previamente
          personasABloquear.push({
            TipoDocumento: response.tipoDocumento,
            nrodocumento: datoConsultado,
            numsolicitud: numeroSolicitud
          });
          // //mandand a bloquear al cliente actual y a su combo que haian pasado limpio en las listas

          logger.debug("=========> antes de insertar   T");
          for (let index = 0; index < personasABloquear.length; index++) {
            const persona = personasABloquear[index];
            await this.insertBloqueoPersona(
              {
                tipoDocumento: persona.TipoDocumento,
                nrodocumento: persona.nrodocumento,
                numsolicitud: persona.numsolicitud,
                bloqueo: CLIENTE_BLOQUEADO,
                nivelriesgo: tipoRiesgo,
                observacion:
                  persona.nrodocumento === datoConsultado
                    ? `Se bloqueó porque tiene riesgo tipo: ${tipoRiesgo}`
                    : `Se bloqueó por contagio del cliento con documento número: ${datoConsultado} y número de solicitud ${numeroSolicitud}`
              },
              requestTransaction
            );
          }
          // //ahora limpiamos la tabla temporal, porque ya la utilizamos
          await this.deleteTemporalEnvioCorreo({ numsolicitud: numeroSolicitud }, requestTransaction);

          logger.debug("=========> VAMOS A HACER COMMIT");
          transaction.commit(error => {
            if (error) {
              logger.error("++++++++++++++++ " + error.message);
              reject({ ok: false, error: error.message });
              return;
            }
            logger.debug("=========>  COMMIT   ok");
            resolve({ ok: true });
          });
        } catch (err) {
          logger.debug("=========> antes de  rollback ");
          logger.error(err);
          // transaction.rollback(error => {
          //   logger.debug("=========>  rollback   ok");
          //   reject({ ok: false });
          // });
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
