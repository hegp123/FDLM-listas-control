import { getListaControlWS, IComplianceRequest, IComplianceResponse, IComplianceResponseResultados } from "../services/compliance";
import { IParametroValorEnvioCorreoEmail } from "./movilizate";
import { RIESGO_ALTO, RIESGO_MEDIO, RIESGO_BAJO, RIESGO_NO_HAY } from "../constants/Constantes";
import * as log from "../log/logger";
import EMail from "../email/email";
const logger = log.logger(__filename);

export default class Compliance {
  private static _instance: Compliance;
  private static PEPS_1674_SERVICE = "Peps1674Service";

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase de comsumo a Compliance Inicializada !");
  }

  /**
   * Funcion que se encarga de llamar al consumo del web service de compliance
   * @param dataToConsult
   */
  public getListaControl(dataToConsult: IComplianceRequest) {
    logger.debug("BI: getListaControl");
    return new Promise(async (resolve, reject) => {
      let listaControl: any = await getListaControlWS(dataToConsult);
      if (listaControl.ok) {
        resolve(listaControl);
      } else {
        //Hubo un error al consumir el servicio web de compliance
        resolve(listaControl);
      }
    });
  }

  /**
   * Funcion que se encarga de procesar el resultado de la consulta a compliance
   *
   * @param response  respuesta de cpmpliance
   * @param tipoRiesgoEnviaCorreo configuracion para saber si enviamos correo o no
   */
  public process(response: IComplianceResponse, tipoRiesgoEnviaCorreo: IParametroValorEnvioCorreoEmail[], listasTipo2: string[]) {
    logger.debug("BI: process");
    return new Promise((resolve, reject) => {
      //
      logger.debug("-----------> NOMBRE: " + JSON.stringify(response.nombre));

      //obtenemos el tipo de riesgo encontrado
      let tipoRiesgo = this.getTipoRiesgo(response.resultados, listasTipo2);
      logger.info("-----------> TIPO DE RIESGO " + tipoRiesgo);
      let debeEnviarCorreo = tipoRiesgoEnviaCorreo.filter(riesgo => riesgo.tipo === tipoRiesgo && riesgo.notificar).length > 0;
      logger.info("-----------> DEBE ENVIAR CORREO " + debeEnviarCorreo);

      switch (tipoRiesgo) {
        case RIESGO_ALTO: // tipo 3
          this.processRiesgoAlto(debeEnviarCorreo);

          resolve({ ok: true, response });
          return; // break;

        case RIESGO_MEDIO: //tipo 2   tambien debemos bloquear a la persona, segun documento
          this.processRiesgoMedio(debeEnviarCorreo);

          resolve({ ok: true, response });
          return; // break;

        case RIESGO_BAJO: //tipo 1
          this.processRiesgoBajo(debeEnviarCorreo);

          resolve({ ok: true, response });
          return; // break;

        default:
          //tipo 0
          this.processRiesgoNoTiene(debeEnviarCorreo);

          resolve({ ok: true, response });
          return; // break;
      }
    });
  }

  /**
   * Metodo que revisa en los resultados de la consulta a compliance que tipo de riesgo tiene
   * @param resultados: restulado de todas las listas consultadas en compliance
   */
  private getTipoRiesgo(resultados: IComplianceResponseResultados[], listasTipo2: string[]) {
    //lista con solo presentariesgo = true
    let listaTieneRiesgo = resultados.filter(resultado => resultado.presentaRiesgo);

    // let listaTieneRiesgo3 = listaTieneRiesgo.filter(resultado => resultado.presentaRiesgo && resultado.lista !== Compliance.PEPS_1674_SERVICE);
    let listaTieneRiesgo3 = listaTieneRiesgo.filter(resultado => resultado.presentaRiesgo && !listasTipo2.includes(resultado.lista));
    if (listaTieneRiesgo3.length > 0) {
      return RIESGO_ALTO;
    }

    // let listaTieneRiesgo2 = listaTieneRiesgo.filter(resultado => resultado.presentaRiesgo && resultado.lista === Compliance.PEPS_1674_SERVICE);
    let listaTieneRiesgo2 = listaTieneRiesgo.filter(resultado => resultado.presentaRiesgo && listasTipo2.includes(resultado.lista));
    if (listaTieneRiesgo2.length > 0) {
      return RIESGO_MEDIO;
    }

    //lista con solo presentaadvertencia = true y presenta riesgo false
    let listaTieneRiesgo1 = resultados.filter(resultado => !resultado.presentaRiesgo && resultado.presentaAdvertencia);
    if (listaTieneRiesgo1.length > 0) {
      return RIESGO_BAJO;
    }

    return RIESGO_NO_HAY;
  }

  /**
   * Funcion que se encarga de hacer el proceso cuando es un riesgo ALTO, osea tipo 3
   // aca toca procesar... bloquear el usuario
   // INSERTAR EN TABLA DE BLOQUEO Y BLOQUEAMOS LOS USUARIOS QUE PERTENEZCAN A ESTE NUMERO DE SOLICITUD
   // , OSEA LOS QUE ESTAN EN LA TABLA TEMPORAL
   //ENVIAMOS CORREO SI ES NECESARIO

   * @param debeEnviarCorreo parametro para saber si debemo enviar email o no
   */
  private processRiesgoAlto(debeEnviarCorreo: boolean) {
    logger.debug("--------> procesando riesgo ALTO");

    EMail.sendMail("hectoregarciap@gmail.com", "Test - Riesgo Alto", "<h1>Hola mundo!!</h1> <h3>Email en formato html</h3>", false);
  }

  /**
   * Funcion que se encarga de hacer el proceso cuando es un riesgo MEDIO, osea tipo 2
   * SOLO INSERTAR EN TABLA DE BLOQUEO, NO BLOQUEAMOS LOS USUARIOS QUE PERTENEZCAN A ESTE NUMERO DE SOLICITUD
   * ENVIAMOS CORREO SI ES NECESARIO
   *
   * @param debeEnviarCorreo parametro para saber si debemo enviar email o no
   */
  private processRiesgoMedio(debeEnviarCorreo: boolean) {
    logger.debug("--------> procesando riesgo MEDIO");
    //
  }

  /**
   * Funcion que se encarga de hacer el proceso cuando es un riesgo BAJO, osea tipo 1
   * Por favor analizar la vinculación por parte del Director de Oficina”
   * dejando el nombre de la lista donde se genera la advertencia
   * y la descripción que es cuando el atributo “tieneResultados” = true.
   * INSERTAR EN TABLA TEMPORAL
   * ENVIAMOS CORREO SI ES NECESARIO
   *
   * @param debeEnviarCorreo parametro para saber si debemo enviar email o no
   */
  private processRiesgoBajo(debeEnviarCorreo: boolean) {
    logger.debug("--------> procesando riesgo BAJO");
  }

  /**
   * Funcion que se encarga de hacer el proceso cuando es un riesgo NO_TIENE, osea tipo 0
   * INSERTAR EN TABLA TEMPORAL
   * ENVIAMOS CORREO SI ES NECESARIO
   *
   * @param debeEnviarCorreo parametro para saber si debemo enviar email o no
   */
  private processRiesgoNoTiene(debeEnviarCorreo: boolean) {
    logger.debug("--------> procesando riesgo NO_TIENE");
    EMail.sendMail("hectoregarciap@gmail.com", "Test - Tranquilo no tiene riesgo", "<h1>Hola mundo!!</h1> <h3>Email en formato html</h3>");
  }
}
