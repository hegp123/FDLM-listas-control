import { getListaControlWS, IComplianceRequest, IComplianceResponse, IComplianceResponseResultados } from "../services/compliance";
import * as log from "../log/logger";
const logger = log.logger(__filename);

export default class Compliance {
  private static _instance: Compliance;
  private static PEPS_1674_SERVICE = "Peps1674Service";

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
          //aca si todo va perfecto, osea se pudo consultar y procesar la logica de negocio
          logger.info("BI: processListaControl.ok");
          resolve(processListaControl);
        } else {
          //aca revienta el proceso, no tiene sentido continuar si hay algun error en la logica de negocio
          logger.error("BI: processListaControl.error" + processListaControl);
          reject(processListaControl);
        }
      } else {
        //aca debe venir un ok:false y el mensaje de error que viene del consumo al servicio
        // esto quiere decir que debemos procesar por VIGIA
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

      //solo trabajamos con los que tienen resultado
      let listaTieneRiesgoAdvertencia = response.resultados.filter(resultado => resultado.presentaRiesgo || resultado.presentaAdvertencia);

      let presentaRiesgo = listaTieneRiesgoAdvertencia.filter(res => res.presentaRiesgo);
      let presentaAdvertencia = listaTieneRiesgoAdvertencia.filter(res => res.presentaAdvertencia);
      let pesp1674 = this.hasPesp1647(listaTieneRiesgoAdvertencia);

      logger.warn("*************************listaTieneRiesgoAdvertencia " + listaTieneRiesgoAdvertencia.length);
      logger.warn("*************************presentaRiesgo " + presentaRiesgo.length);
      logger.warn("*************************presentaAdvertencia " + presentaAdvertencia.length);
      // logger.warn("*************************pesp1674 " + pesp1674.length);

      //lista de resultados
      // resultados.forEach((res: IComplianceResponseResultados) => {
      //   //lista de descripciones por cada resultado
      //   logger.warn("*************************" + res.lista );
      //   res.descripcion.forEach((desc: string) => {
      //     //
      //     logger.warn(desc);
      //   });
      // });

      let anyError: boolean = false;
      if (!anyError) {
        logger.info("BI: saliendo de process ok");
        resolve({ ok: true, response });
      } else {
        logger.error("BI: saliendo de process error");
        resolve({ ok: false, errorMessage: "algun mensaje de error" });
      }
    });
  }

  private hasPesp1647(resultados: IComplianceResponseResultados[]) {
    let pesp1647 = resultados.filter(res => res.lista === Compliance.PEPS_1674_SERVICE);
    if (pesp1647 && pesp1647.length > 0) {
      pesp1647[0].descripcion.filter(desc => {
        logger.warn(">>>>>>>>>>> " + JSON.stringify(desc));
        // if (desc.length > 0 && desc[0] === "sinResultados") {
        // }
      });
    }
  }
}
