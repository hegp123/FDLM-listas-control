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
    logger.debug("Clase ListaControl Inicializada !");
  }

  public getListaControl(dataToConsult: IComplianceRequest) {
    // logger.debug("XXXX-ListaControl: getListaControl");
    return new Promise(async (resolve, reject) => {
      logger.debug("XXXX-1-ListaControl: getListaControl");
      let tipoRiesgoEnviaCorreo: IParametroValorEnvioCorreoEmail[] = await this.tipoRiesgoEnviaCorreo();
      logger.debug("XXXX-2-ListaControl: getListaControl" + tipoRiesgoEnviaCorreo);

      //   logger.debug("XXXX-1-ListaControl: getListaControl");
      let listaControl: any = await Compliance.instance.getListaControl(dataToConsult);
      //   logger.debug("XXXX-2-ListaControl: getListaControl");
      if (listaControl.ok) {
        // logger.debug("XXXX-3-ListaControl: getListaControl");
        let processListaControl: any = await Compliance.instance.process(listaControl.response, tipoRiesgoEnviaCorreo);
        // logger.debug("XXXX-4-ListaControl: getListaControl");
        if (processListaControl.ok) {
          //aca si todo va perfecto, osea se pudo consultar y procesar la logica de negocio
          logger.debug("BI: processListaControl.ok");
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
          // logger.debug("==> " + JSON.stringify(result));
          let tipoRiesgoEnviaCorreo = JSON.parse(result.Valor).filter((valor: IParametroValorEnvioCorreoEmail) => valor.notificar);
          resolve(tipoRiesgoEnviaCorreo);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  // VALUES('LISTA_TIPO_2', 'Listas tipo 2', '[{"lista": "Peps1674Service"}]')
  /**
   * lo voy a desarrollar sin promesas, para demostrar que es lo mismo... Hector Garcia: 2019.06.19
   */
  private listasTipo2() {
    //
  }
}
