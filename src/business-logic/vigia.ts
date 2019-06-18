import * as log from "../log/logger";
import { IComplianceRequest } from "../services/compliance";
const logger = log.logger(__filename);

export default class Vigia {
  private static _instance: Vigia;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase de comsumo a Vigia Inicializada !");
  }

  public getListaControl(dataToConsult: IComplianceRequest) {
    return new Promise(async (resolve, reject) => {
      let listaControl = "me imagino que buscar en la base de datos de vigia";
      let processListaControl: any = await this.process(listaControl);
      if (processListaControl.ok) {
        resolve({ ok: true, message: "xxxxx" });
      } else {
        resolve({ ok: false, errorMessage: "algun mensaje de error" });
      }
    });
  }

  private process(response: any) {
    logger.debug("BI: process");
    return new Promise((resolve, reject) => {
      resolve({ ok: true, message: "xxxxx" });
    });
  }
}
