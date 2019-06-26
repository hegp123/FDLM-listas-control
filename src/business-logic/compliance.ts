import { getListaControlWS, IComplianceRequest, IComplianceResponse, IComplianceResponseResultados } from "../services/compliance";
import { RIESGO_ALTO, RIESGO_MEDIO, RIESGO_BAJO, RIESGO_NO_HAY, CLIENTE_BLOQUEADO } from "../constants/Constantes";
import * as log from "../log/logger";
import EMail from "../email/email";
import Topaz, { IParametroValorEnvioCorreoEmail, ITemporalEnvioCorreo } from "./topaz";
import { getFechaActual } from "../util/util";
import { BODY_PLANTILLA_NOTIFICACION, MAX_TEXTO_PARA_DESCRIPCION_LISTA } from "../config/config";
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
    parametrosPlantilla,
    numeroSolicitud
  }: {
    response: IComplianceResponse;
    tipoRiesgoEnviaCorreo: IParametroValorEnvioCorreoEmail[];
    listasTipo2: string[];
    parametrosMail: IParametrosMail;
    parametrosPlantilla: IMailOptionsContext;
    numeroSolicitud: number;
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
      let tipoRiesgo: number = this.getTipoRiesgo(response.resultados, listasTipo2);
      logger.info("-----------> TIPO DE RIESGO " + tipoRiesgo);
      let debeEnviarCorreo: boolean = tipoRiesgoEnviaCorreo.filter(riesgo => riesgo.tipo === tipoRiesgo && riesgo.notificar).length > 0;
      logger.info("-----------> DEBE ENVIAR CORREO " + debeEnviarCorreo);

      switch (tipoRiesgo) {
        case RIESGO_ALTO: // tipo 3
          try {
            await this.processRiesgoAlto({
              response,
              tipoRiesgo,
              listasTipo2,
              numeroSolicitud,
              debeEnviarCorreo,
              parametrosMail,
              parametrosPlantilla
            });
            resolve({ ok: true, response });
          } catch (error) {
            logger.error(error);
            resolve({ ok: false, errorMessage: error });
          }
          return; // break;

        case RIESGO_MEDIO: //tipo 2   tambien debemos bloquear a la persona, segun documento
          try {
            await this.processRiesgoMedio(debeEnviarCorreo);
            resolve({ ok: true, response });
          } catch (error) {
            logger.error(error);
            resolve({ ok: false, errorMessage: error });
          }
          return; // break;

        case RIESGO_BAJO: //tipo 1
          try {
            await this.processRiesgoBajo(debeEnviarCorreo);
            resolve({ ok: true, response });
          } catch (error) {
            logger.error(error);
            resolve({ ok: false, errorMessage: error });
          }
          return; // break;

        default:
          //tipo 0
          try {
            await this.processRiesgoNoTiene(response, debeEnviarCorreo, parametrosMail, parametrosPlantilla, numeroSolicitud);
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
   * Funcion que se encarga de hacer el proceso cuando es un riesgo ALTO, osea tipo 3
   // aca toca procesar... bloquear el usuario
   // INSERTAR EN TABLA DE BLOQUEO Y BLOQUEAMOS LOS USUARIOS QUE PERTENEZCAN A ESTE NUMERO DE SOLICITUD
   // , OSEA LOS QUE ESTAN EN LA TABLA TEMPORAL
   //ENVIAMOS CORREO SI ES NECESARIO

   * @param debeEnviarCorreo parametro para saber si debemo enviar email o no
   */
  private async processRiesgoAlto({
    response,
    tipoRiesgo,
    listasTipo2,
    numeroSolicitud,
    debeEnviarCorreo,
    parametrosMail,
    parametrosPlantilla
  }: {
    response: IComplianceResponse;
    tipoRiesgo: number;
    listasTipo2: string[];
    numeroSolicitud: number;
    debeEnviarCorreo: boolean;
    parametrosMail: IParametrosMail;
    parametrosPlantilla: IMailOptionsContext;
  }) {
    logger.debug("--------> procesando riesgo ALTO");
    try {
      //guardando las listas y sus detalles
      let listas = response.resultados;
      let datoConsultado = response.datoConsultado.toString();
      let emailDescription: IMailDescription[] = [];
      let index: number = 0;
      listas.forEach(async resultado => {
        let descripcion: string = resultado.descripcion;
        let riesgo = this.getTipoRiesgoPorResultado(resultado, listasTipo2);
        if (descripcion.length > 0) {
          // logger.debug("index: " + index);
          emailDescription.push({
            riesgo: riesgo.toString(),
            lista: resultado.lista,
            descripcion: descripcion.toString()
          });
          index = index + 1;
          // if (resultado.lista === "GovermentWantedUsaService") {
          await Topaz.instance.insertDetalle({
            riesgo: riesgo.toString(),
            lista: resultado.lista,
            numsolicitud: numeroSolicitud,
            nrodocumento: datoConsultado,
            descripcion: descripcion.toString()
          });

          // }
        }
      });
      logger.debug("emailDescription: " + emailDescription);
      emailDescription.sort(function(a: any, b: any) {
        return b.riesgo - a.riesgo;
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
          cliente: parametrosPlantilla.cliente,
          emailDescription
        }
      });

      //consultamos las otras personas que pertenecen a la solicitud, para bloquearlas
      await this.bloquearYLimpiar(numeroSolicitud, response, datoConsultado, tipoRiesgo);
      //
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  private async bloquearYLimpiar(numeroSolicitud: number, response: IComplianceResponse, datoConsultado: string, tipoRiesgo: number) {
    let personasABloquear: ITemporalEnvioCorreo[] = await Topaz.instance.getPersonasTemporalesXNumeroSolicitud(numeroSolicitud);
    // adicionamos al cliente actualmente consultado y aparece en alguna de las listas con riesgo 3, entonces este man afecta a los demas consultados previamente
    personasABloquear.push({
      TipoDocumento: response.tipoDocumento,
      nrodocumento: datoConsultado,
      numsolicitud: numeroSolicitud
    });
    //mandand a bloquear al cliente actual y a su combo que haian pasado limpio en las listas
    personasABloquear.forEach(async persona => {
      await Topaz.instance.insertBloqueoPersona({
        tipoDocumento: persona.TipoDocumento,
        nrodocumento: persona.nrodocumento,
        numsolicitud: persona.numsolicitud,
        bloqueo: CLIENTE_BLOQUEADO,
        nivelriesgo: tipoRiesgo,
        observacion:
          persona.nrodocumento === datoConsultado
            ? `Se bloqueó porque tiene riesgo tipo: ${tipoRiesgo}`
            : `Se bloqueó por contagio del cliento con documento número: ${datoConsultado} y número de solicitud ${numeroSolicitud}`
      });
    });
    //ahora limpiamos la tabla temporal, porque ya la utilizamos
    await Topaz.instance.deleteTemporalEnvioCorreo({ numsolicitud: numeroSolicitud });
  }

  /**
   * Funcion que se encarga de hacer el proceso cuando es un riesgo MEDIO, osea tipo 2
   * SOLO INSERTAR EN TABLA DE BLOQUEO, NO BLOQUEAMOS LOS USUARIOS QUE PERTENEZCAN A ESTE NUMERO DE SOLICITUD
   * ENVIAMOS CORREO SI ES NECESARIO
   *
   * @param debeEnviarCorreo parametro para saber si debemo enviar email o no
   */
  private async processRiesgoMedio(debeEnviarCorreo: boolean) {
    logger.debug("--------> procesando riesgo MEDIO");
    try {
      // await
    } catch (error) {
      logger.error(error);
      throw error;
    }
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
  private async processRiesgoBajo(debeEnviarCorreo: boolean) {
    logger.debug("--------> procesando riesgo BAJO");
    try {
      // await
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  /**
   * Funcion que se encarga de hacer el proceso cuando es un riesgo NO_TIENE, osea tipo 0
   * INSERTAR EN TABLA TEMPORAL
   * ENVIAMOS CORREO SI ES NECESARIO
   *
   * @param debeEnviarCorreo parametro para saber si debemo enviar email o no
   */
  private async processRiesgoNoTiene(
    response: IComplianceResponse,
    debeEnviarCorreo: boolean,
    parametrosMail: IParametrosMail,
    parametrosPlantilla: IMailOptionsContext,
    numeroSolicitud: number
  ) {
    logger.debug("--------> procesando riesgo NO_TIENE");
    try {
      // await Topaz.instance.insertBloqueoPersona({
      //   tipoDocumento: "cc",
      //   nrodocumento: "7573655",
      //   numsolicitud: numeroSolicitud,
      //   bloqueo: 1,
      //   nivelriesgo: 3,
      //   observacion: "Fresc@ñ$ ' á  :)"
      // });

      await Topaz.instance.insertTemporalEnvioCorreo({
        tipoDocumento: response.tipoDocumento,
        nrodocumento: response.datoConsultado.toString(),
        numsolicitud: numeroSolicitud
      });

      // await Topaz.instance.insertDetalle({
      //   riesgo: "3",
      //   lista: "lista tal",
      //   numsolicitud: numeroSolicitud,
      //   nrodocumento: "7573655",
      //   descripcion:
      //     " El documento de identificación número 7573655 NO está incluido en el BDME que publica la CONTADURÍA GENERAL DE LA NACIÓN, de acuerdo con lo establecido en el artículo 2° de la Ley 901 de 2004"
      // });

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

  private getTipoRiesgoPorResultado(resultado: IComplianceResponseResultados, listasTipo2: string[]) {
    let listaTieneRiesgo3 = resultado.presentaRiesgo && !listasTipo2.includes(resultado.lista);
    if (listaTieneRiesgo3) {
      return RIESGO_ALTO;
    }

    let listaTieneRiesgo2 = resultado.presentaRiesgo && listasTipo2.includes(resultado.lista);
    if (listaTieneRiesgo2) {
      return RIESGO_MEDIO;
    }

    //lista con solo presentaadvertencia = true y presenta riesgo false
    let listaTieneRiesgo1 = !resultado.presentaRiesgo && resultado.presentaAdvertencia;
    if (listaTieneRiesgo1) {
      return RIESGO_BAJO;
    }

    return RIESGO_NO_HAY;
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
  emailDescription?: IMailDescription[];
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

export interface IMailDescription {
  riesgo: string;
  lista: string;
  descripcion: string;
}
