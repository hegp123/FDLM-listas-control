import * as log from "../log/logger";
import Vigia from "./vigia";
import { IComplianceRequest } from "../services/compliance";
import Compliance from "./compliance";
import Movilizate, { IParametro, IParametroValorEnvioCorreoEmail, IParametroValorListasTipo2 } from "./movilizate";
import { ENVIO_CORREO_NIVEL, LISTA_TIPO_2 } from "../constants/Constantes";
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
      //   logger.debug("XXXX-1-ListaControl: getListaControl");
      let listaControl: any = await Compliance.instance.getListaControl(dataToConsult);
      //   logger.debug("XXXX-2-ListaControl: getListaControl");
      if (listaControl.ok) {
        // logger.debug("XXXX-3-ListaControl: getListaControl");
        //tipoRiesgoEnviaCorreo y listasTipo2 ES SOLO PARA COMPLIANCE, AL MENOS POR AHORA
        let tipoRiesgoEnviaCorreo: IParametroValorEnvioCorreoEmail[] = await this.tipoRiesgoEnviaCorreo();
        let listasTipo2: string[] = await this.listasTipo2();

        //VAMOS A PROCESAR
        let processListaControl: any = await Compliance.instance.process(listaControl.response, tipoRiesgoEnviaCorreo, listasTipo2);
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
        logger.warn("HUBO UN ERROR EN COMPLIANCE, PERO TRANQUILO AHOR VMOS A VIGIA: " + listaControl.errorMessage);
        logger.info("----------> VAMOS A VIGIA A CONTINUAR CON EL PROCESO");
        let getListaControlVigia: any = await Vigia.instance.getListaControl(dataToConsult);
        resolve(getListaControlVigia);
      }
    });
  }

  /**
   * Funcion que se encarga de buscar los tipos de riesgos que deben enviar correos
   */
  private tipoRiesgoEnviaCorreo() {
    return new Promise<IParametroValorEnvioCorreoEmail[]>((resolve, reject) => {
      Movilizate.instance
        .getValorParametro(ENVIO_CORREO_NIVEL)
        .then((parametro: IParametro) => {
          // logger.debug("==> " + JSON.stringify(result));
          let tipoRiesgoEnviaCorreo = JSON.parse(parametro.Valor).filter((valor: IParametroValorEnvioCorreoEmail) => valor.notificar);
          resolve(tipoRiesgoEnviaCorreo);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Funcion que busca los nombres de las lista que estan configuradas como tipo riesgo 2
   * VALUES('LISTA_TIPO_2', 'Listas tipo 2', '[{"lista": "Peps1674Service"}]')
   */
  private listasTipo2() {
    return new Promise<string[]>((resolve, reject) => {
      Movilizate.instance
        .getValorParametro(LISTA_TIPO_2)
        .then((parametro: IParametro) => {
          // logger.debug("==> " + JSON.stringify(result));
          let listasTipo2Json: IParametroValorListasTipo2[] = JSON.parse(parametro.Valor);
          let listasTipo2 = listasTipo2Json.map(riesgo => riesgo.lista);
          resolve(listasTipo2);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}
