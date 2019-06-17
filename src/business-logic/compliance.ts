import { getListaControlWS, IComplianceRequest, IComplianceResponse, IComplianceResponseResultados } from "../services/compliance";
import * as log from "../log/logger";
import Vigia from "./vigia";
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
        let getListaControlVigia: any = await Vigia.instance.getListaControl(dataToConsult);
        resolve(getListaControlVigia);
      }
    });
  }

  private process(response: IComplianceResponse) {
    logger.info("BI: process");
    return new Promise((resolve, reject) => {
      //
      logger.info("nombre: " + JSON.stringify(response.nombre));

      //lista con solo presentariesgo = true
      let listaTieneRiesgo = response.resultados.filter(resultado => resultado.presentaRiesgo);
      //lista con solo presentaadvertencia = true y presenta riesgo false
      let listaTieneAdvertencia = response.resultados.filter(resultado => !resultado.presentaRiesgo && resultado.presentaAdvertencia);

      let listaTieneRiesgo3 = listaTieneRiesgo.filter(resultado => resultado.presentaRiesgo && resultado.lista !== Compliance.PEPS_1674_SERVICE);
      logger.warn("*************************listaTieneRiesgo3 ??: " + listaTieneRiesgo3.length);

      if (listaTieneRiesgo3.length > 0) {
        // tipo 3
        // aca toca procesar... bloquear el usuario
        // INSERTAR EN TABLA DE BLOQUEO Y BLOQUEAMOS LOS USUARIOS QUE PERTENEZCAN A ESTE NUMERO DE SOLICITUD
        // , OSEA LOS QUE ESTAN EN LA TABLA TEMPORAL
        resolve({ ok: true, response });
      } else {
        let listaTieneRiesgo2 = listaTieneRiesgo.filter(resultado => resultado.presentaRiesgo && resultado.lista === Compliance.PEPS_1674_SERVICE);
        logger.warn("*************************listaTieneRiesgo2 ??: " + listaTieneRiesgo2.length);

        if (listaTieneRiesgo2.length > 0) {
          //tipo 2   tambien debemos bloquear a la persona, segun documento
          // INSERTAR EN TABLA DE BLOQUEO Y BLOQUEAMOS LOS USUARIOS QUE PERTENEZCAN A ESTE NUMERO DE SOLICITUD
          // , OSEA LOS QUE ESTAN EN LA TABLA TEMPORAL
          resolve({ ok: true, response });
        } else {
          let listaTieneRiesgo1 = listaTieneAdvertencia.filter(resultado => resultado.presentaAdvertencia);
          logger.warn("*************************listaTieneRiesgo1 ??: " + listaTieneRiesgo1.length);

          if (listaTieneRiesgo1.length > 0) {
            resolve({ ok: true, response });
            //tipo 1
            // Por favor analizar la vinculación por parte del Director de Oficina”
            //dejando el nombre de la lista donde se genera la advertencia
            //y la descripción que es cuando el atributo “tieneResultados” = true.
            //INSERTAR EN TABLA TEMPORAL
          } else {
            //tipo 0
            logger.warn("*************************No tiene riesgo ni adertencias");
            logger.info("BI: saliendo de process ok");
            //INSERTAR EN TABLA TEMPORAL
            resolve({ ok: true, response });
          }
        }

        // logger.error("BI: saliendo de process error");
        // resolve({ ok: false, errorMessage: "algun mensaje de error" });
      }

      //lista de resultados
      // resultados.forEach((res: IComplianceResponseResultados) => {
      //   //lista de descripciones por cada resultado
      //   logger.warn("*************************" + res.lista );
      //   res.descripcion.forEach((desc: string) => {
      //     //
      //     logger.warn(desc);
      //   });
      // });
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
