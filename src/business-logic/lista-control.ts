import * as log from "../log/logger";
import Vigia from "./vigia";
import { IComplianceRequest } from "../services/compliance";
import Compliance from "./compliance";
import MsSqlServer from "../database/sqlserver";
import Movilizate, { IParametro, IParametroValorEnvioCorreoEmail } from "./movilizate";
import { ENVIO_CORREO_NIVEL } from "../constants/Constantes";
const logger = log.logger(__filename);

export default class ListaControl {
  private static _instance: ListaControl;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.info("Clase ListaControl Inicializada !");
  }

  public getListaControl(dataToConsult: IComplianceRequest) {
    // logger.info("XXXX-ListaControl: getListaControl");
    return new Promise(async (resolve, reject) => {
      logger.info("XXXX-1-ListaControl: getListaControl");
      let tipoRiesgoEnviaCorreo: IParametroValorEnvioCorreoEmail[] = await this.tipoRiesgoEnviaCorreo();
      logger.info("XXXX-2-ListaControl: getListaControl" + tipoRiesgoEnviaCorreo);

      //   logger.info("XXXX-1-ListaControl: getListaControl");
      let listaControl: any = await Compliance.instance.getListaControl(dataToConsult);
      //   logger.info("XXXX-2-ListaControl: getListaControl");
      if (listaControl.ok) {
        // logger.info("XXXX-3-ListaControl: getListaControl");
        let processListaControl: any = await Compliance.instance.process(listaControl.response, tipoRiesgoEnviaCorreo);
        // logger.info("XXXX-4-ListaControl: getListaControl");
        if (processListaControl.ok) {
          //aca si todo va perfecto, osea se pudo consultar y procesar la logica de negocio
          logger.info("BI: processListaControl.ok");
          resolve(processListaControl);
        } else {
          //aca revienta el proceso, no tiene sentido continuar si hay algun error en la logica de negocio
          logger.error("BI: processListaControl.error" + processListaControl);
          reject(processListaControl);
        }
      } else {
        logger.error("BI: error" + listaControl.errorMessage);
        let getListaControlVigia: any = await Vigia.instance.getListaControl(dataToConsult);
        resolve(getListaControlVigia);
      }
    });
  }

  private tipoRiesgoEnviaCorreo() {
    return new Promise<IParametroValorEnvioCorreoEmail[]>((resolve, reject) => {
      Movilizate.instance
        .getValorParametro(ENVIO_CORREO_NIVEL)
        .then((result: IParametro) => {
          let tipoRiesgoEnviaCorreo = JSON.parse(result.Valor).filter((valor: IParametroValorEnvioCorreoEmail) => valor.notificar);
          resolve(tipoRiesgoEnviaCorreo);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}