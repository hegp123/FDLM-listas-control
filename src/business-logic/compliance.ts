import { getListaControlWS, IComplianceRequest, IComplianceResponse } from "../services/compliance";
import * as log from "../log/logger";
const logger = log.logger(__filename);

export default class Compliance {
  private static _instance: Compliance;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.info("Clase de comsumo a Compliance Inicializada !");
  }

  public getListaControl(dataToConsult: IComplianceRequest) {
    logger.info("BI: getListaControl");
    return new Promise(async (resolve, reject) => {
      let listaControl: any = await getListaControlWS(dataToConsult);
      if (listaControl.ok) {
        //aca se va a procesar, osea a hacer la logica de negocio
        logger.info("BI: ok");
        let processListaControl: any = await this.process(listaControl.response);
        if (processListaControl.ok) {
          //aca si sito va perfecto, osea se pudo consultar y procesar la logica de negocio
          logger.info("BI: processListaControl.ok");
          resolve(processListaControl);
        } else {
          //aca revienta el proceso, no tiene sentido continuar si hay algun error en la logica de negocio
          logger.error("BI: processListaControl.error" + processListaControl);
          reject(processListaControl);
        }
      } else {
        //aca debe venir un ok:false y el mensaje de error que viene del consumo al servicio
        logger.error("BI: error" + listaControl);
        resolve(listaControl);
      }
    });
  }

  public process(response: IComplianceResponse) {
    logger.info("BI: process");
    return new Promise((resolve, reject) => {
      //
      logger.info("nombre: " + JSON.stringify(response.nombre));

      let anyError: boolean = false;
      if (!anyError) {
        resolve({ ok: true, response });
        logger.info("BI: saliendo de process ok");
      } else {
        logger.error("BI: saliendo de process error");
        resolve({ ok: false, errorMessage: "algun mensaje de error" });
      }
    });
  }
}
