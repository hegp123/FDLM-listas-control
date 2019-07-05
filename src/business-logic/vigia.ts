import { IComplianceRequest } from "../services/compliance";
import MsSqlServer, { ISqlValue } from "../database/sqlserver";
import mssql from "mssql";
import * as log from "../log/logger";
const logger = log.logger(__filename);

export default class Vigia {
  private static _instance: Vigia;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase de comsumo a Vigia Inicializada !");
  }

  public getListaControl(
    dataToConsult: IComplianceRequest,
    { origen, cadena, indicador, porcentaje }: { origen: string; cadena: string; indicador: number; porcentaje: number }
  ) {
    return new Promise(async (resolve, reject) => {
      let datosVigia: IVerificaTerceroVigiaOutput = await this.getDatosVigia({ origen, cadena, indicador, porcentaje });
      let processListaControl: any = await this.process(dataToConsult, datosVigia);
      if (processListaControl.ok) {
        resolve({ ok: true, message: datosVigia });
      } else {
        resolve({ ok: false, errorMessage: "algun mensaje de error" });
      }
    });
  }

  getDatosVigia({ origen, cadena, indicador, porcentaje }: { origen: string; cadena: string; indicador: number; porcentaje: number }) {
    return new Promise<IVerificaTerceroVigiaOutput>((resolve, reject) => {
      let inputs: ISqlValue[] = [
        { name: "PAR_ORIGEN", type: mssql.VarChar, value: origen },
        { name: "PAR_CADENA", type: mssql.NVarChar, value: cadena },
        { name: "PAR_INDICADOR", type: mssql.Int, value: indicador },
        { name: "PAR_PORCENTAJE", type: mssql.Int, value: porcentaje }
      ];
      let outputs: ISqlValue[] = [
        { name: "PAR_ENCONTRO", type: mssql.VarChar },
        { name: "PAR_TIPO", type: mssql.VarChar },
        { name: "PAR_LISTAS", type: mssql.NVarChar }
      ];

      MsSqlServer.ejecutarProcedure("PR_VERIFICATERCEROV2", inputs, outputs, MsSqlServer.instance.getDataBaseVigia())
        .then((result : IVerificaTerceroVigiaOutput)=> {//"PAR_ENCONTRO":"N","PAR_TIPO":"D","PAR_LISTAS":null
          resolve(result);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error.message);
        });
    });
  }

  private process(response: IComplianceRequest, listaControl: IVerificaTerceroVigiaOutput) {
    logger.debug("BI: process");
    return new Promise((resolve, reject) => {
      /*logica a realizar para el proceso */ 
      resolve({ ok: true, message: "xxxxx" });
    });
  }
}

interface IVerificaTerceroVigiaOutput {
  PAR_ENCONTRO: string;
  PAR_TIPO: string;
  PAR_LISTAS: string
}