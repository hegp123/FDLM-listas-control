import { getListaControlWS, IComplianceRequest, IComplianceResponse, IComplianceResponseResultados } from "../services/compliance";
import { RIESGO_ALTO, RIESGO_MEDIO, RIESGO_BAJO, RIESGO_NO_HAY } from "../constants/Constantes";
import * as log from "../log/logger";
import EMail from "../email/email";
import Topaz, { IParametroValorEnvioCorreoEmail } from "./topaz";
import { getFechaActual } from "../util/util";
import { BODY_PLANTILLA_NOTIFICACION } from "../config/config";
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
  public process({
    response,
    tipoRiesgoEnviaCorreo,
    listasTipo2,
    parametrosMail,
    parametrosPlantilla
  }: {
    response: IComplianceResponse;
    tipoRiesgoEnviaCorreo: IParametroValorEnvioCorreoEmail[];
    listasTipo2: string[];
    parametrosMail: IParametrosMail;
    parametrosPlantilla: IMailOptionsContext;
  }) {
    logger.debug("BI: process");
    //esta promesa no debe tener reject, porque el que la invoca controla esa parte
    // cuando exista errores, le damos resolve, pero con ok : false
    return new Promise(async resolve => {
      //
      logger.debug("-----------> NOMBRE: " + JSON.stringify(response.nombre));
      parametrosPlantilla.cliente = {
        nombre: response.nombre,
        identificacion: response.datoConsultado,
        tipoDocumento: response.tipoDocumento
      };

      //obtenemos el tipo de riesgo encontrado
      let tipoRiesgo = this.getTipoRiesgo(response.resultados, listasTipo2);
      logger.info("-----------> TIPO DE RIESGO " + tipoRiesgo);
      let debeEnviarCorreo = tipoRiesgoEnviaCorreo.filter(riesgo => riesgo.tipo === tipoRiesgo && riesgo.notificar).length > 0;
      logger.info("-----------> DEBE ENVIAR CORREO " + debeEnviarCorreo);

      switch (tipoRiesgo) {
        case RIESGO_ALTO: // tipo 3
          this.processRiesgoAlto(response, debeEnviarCorreo, parametrosMail, parametrosPlantilla);

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
          try {
            await this.processRiesgoNoTiene(debeEnviarCorreo, parametrosMail, parametrosPlantilla);
            resolve({ ok: true, response });
          } catch (error) {
            logger.error(error);
            resolve({ ok: false, errorMessage: error });
          }
          return; // break;
      }

      // if (debeEnviarCorreo) {
      //   this.processRiesgoAlto(debeEnviarCorreo, parametrosMail, parametrosPlantilla);
      // }
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
  private processRiesgoAlto(
    response: IComplianceResponse,
    debeEnviarCorreo: boolean,
    parametrosMail: IParametrosMail,
    parametrosPlantilla: IMailOptionsContext
  ) {
    logger.debug("--------> procesando riesgo ALTO");

    let listas = response.resultados;
    listas.forEach(resultado => {
      let descripcion = resultado.descripcion;
    });

    EMail.sendMailTemplate({
      to: parametrosMail.to,
      subject: parametrosMail.subject,
      mailOptionsTemplateBody: BODY_PLANTILLA_NOTIFICACION,
      mailOptionsContext: {
        rutaEstilos: parametrosPlantilla.rutaEstilos,
        fecha: getFechaActual(), //"10 de junio del 2019",
        correoAdmin: parametrosPlantilla.correoAdmin,
        fuenteConsulta: parametrosPlantilla.fuenteConsulta,
        aplicacion: "Movilízate",
        usuario: "HGARCIA ",
        oficina: "Bucaramanga",
        cliente: parametrosPlantilla.cliente
      }
    });
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
  private async processRiesgoNoTiene(debeEnviarCorreo: boolean, parametrosMail: IParametrosMail, parametrosPlantilla: IMailOptionsContext) {
    logger.debug("--------> procesando riesgo NO_TIENE");
    try {
      await Topaz.instance.insertBloqueoPersona({
        tipoDocumento: "cc",
        nrodocumento: "7573655",
        numsolicitud: 12345,
        bloqueo: 1,
        nivelriesgo: 3,
        observacion: "Fresco :)"
      });

      await Topaz.instance.insertTemporalEnvioCorreo({
        tipoDocumento: "cc",
        nrodocumento: "7573655",
        numsolicitud: 12345
      });

      await Topaz.instance.insertDetalle({
        riesgo: "3",
        lista: "lista tal",
        numsolicitud: 12345,
        nrodocumento: "7573655",
        descripcion:
          " El documento de identificación número 7573655 NO está incluido en el BDME que publica la CONTADURÍA GENERAL DE LA NACIÓN, de acuerdo con lo establecido en el artículo 2° de la Ley 901 de 2004"
      });

      logger.debug("--------> saliendo del insert riesgo NO_TIENE ");
      // EMail.sendMailTemplate({
      //   to: parametrosMail.to,
      //   subject: parametrosMail.subject,
      //   mailOptionsTemplateBody: BODY_PLANTILLA_NOTIFICACION,
      //   mailOptionsContext: {
      //     rutaEstilos: parametrosPlantilla.rutaEstilos,
      //     fecha: getFechaActual(), //"10 de junio del 2019",
      //     correoAdmin: parametrosPlantilla.correoAdmin,
      //     fuenteConsulta: parametrosPlantilla.fuenteConsulta,
      //     aplicacion: "Movilízate",
      //     usuario: "HGARCIA ",
      //     oficina: "Bucaramanga",
      //     cliente: parametrosPlantilla.cliente
      //   }
      // });
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}

export interface IMailOptionsContext {
  rutaEstilos?: string;
  fecha?: string;
  cliente?: ICliente;
  correoAdmin?: string;
  fuenteConsulta?: string;
  aplicacion?: string;
  usuario?: string;
  oficina?: string;
}

export interface ICliente {
  nombre?: string;
  identificacion?: string;
  tipoDocumento?: string;
}

export interface IParametrosMail {
  to: string;
  subject: string;
}
