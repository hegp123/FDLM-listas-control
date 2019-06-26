import * as log from "../log/logger";
import Vigia from "./vigia";
import { IComplianceRequest } from "../services/compliance";
import Compliance, { IParametrosMail, IMailOptionsContext } from "./compliance";
import { ENVIO_CORREO_NIVEL, LISTA_TIPO_2 } from "../constants/Constantes";
import Topaz, { IParametro, IParametroValorEnvioCorreoEmail, IParametroValorListasTipo2 } from "./topaz";
import {
  ID_PARAM_CORREOS_LISTAS_CONTROL_MAIL,
  ID_PARAM_ASUNTO_LISTAS_CONTROL_MAIL,
  ID_PARAM_RUTA_ESTILOS,
  ID_PARAM_CORREO_ADMIN,
  FUENTE_CONSULTA_COMPLIANCE
} from "../config/config";
import Movilizate from "./movilizate";
import { FUENTE_CONSULTA_VIGIA } from "../config/config";
const logger = log.logger(__filename);

export default class ListaControl {
  private static _instance: ListaControl;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase ListaControl Inicializada !");
  }

  public getListaControl(dataToConsult: IComplianceRequest, numeroSolicitud: number) {
    // logger.debug("XXXX-ListaControl: getListaControl");
    return new Promise(async (resolve, reject) => {
      //   logger.debug("XXXX-1-ListaControl: getListaControl");
      let listaControl: any = await Compliance.instance.getListaControl(dataToConsult);
      //   logger.debug("XXXX-2-ListaControl: getListaControl");

      //CONSULTAMOS ESTOS DATOS FUERA DEL IF, PORQUE AAPLICA PARA COMPLIANCE Y VIGIA
      let to: string = await this.getTo();
      let subject: string = await this.getSubject();
      let rutaEstilos: string = await this.getRutaEstilos();
      let correoAdmin: string = await this.getCorreoAdmin();
      //--------------------------
      let parametrosMail: IParametrosMail = { to, subject };
      let parametrosPlantilla: IMailOptionsContext = { rutaEstilos, correoAdmin };

      if (listaControl.ok) {
        // logger.debug("XXXX-3-ListaControl: getListaControl");
        //tipoRiesgoEnviaCorreo y listasTipo2 ES SOLO PARA COMPLIANCE, AL MENOS POR AHORA
        let tipoRiesgoEnviaCorreo: IParametroValorEnvioCorreoEmail[] = await this.tipoRiesgoEnviaCorreo();
        let listasTipo2: string[] = await this.listasTipo2();

        parametrosPlantilla.fuenteConsulta = FUENTE_CONSULTA_COMPLIANCE;
        //VAMOS A PROCESAR
        let processListaControl: any = await Compliance.instance.process({
          response: listaControl.response,
          tipoRiesgoEnviaCorreo,
          listasTipo2,
          parametrosMail,
          parametrosPlantilla,
          numeroSolicitud
        });
        // logger.debug("XXXX-4-ListaControl: getListaControl");
        if (processListaControl.ok) {
          //aca si todo va perfecto, osea se pudo consultar y procesar la logica de negocio
          logger.debug("BI: processListaControl.ok");
          resolve(processListaControl);
        } else {
          //aca revienta el proceso, no tiene sentido continuar si hay algun error en la logica de negocio
          logger.error("BI: processListaControl.error" + processListaControl.errorMessage);
          reject(processListaControl);
        }
      } else {
        logger.warn("HUBO UN ERROR EN COMPLIANCE, PERO TRANQUILO AHOR VMOS A VIGIA: " + listaControl.errorMessage);
        logger.info("----------> VAMOS A VIGIA A CONTINUAR CON EL PROCESO");
        parametrosPlantilla.fuenteConsulta = FUENTE_CONSULTA_VIGIA;
        let getListaControlVigia: any = await Vigia.instance.getListaControl(dataToConsult);
        resolve(getListaControlVigia);
      }
    });
  }

  private getTo() {
    return "hectoregarciap@gmail.com";
    return new Promise<string>((resolve, reject) => {
      Movilizate.instance
        .getConfiguration(ID_PARAM_CORREOS_LISTAS_CONTROL_MAIL)
        .then((valorTexto: string) => {
          resolve(valorTexto);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  private getSubject() {
    return new Promise<string>((resolve, reject) => {
      Movilizate.instance
        .getConfiguration(ID_PARAM_ASUNTO_LISTAS_CONTROL_MAIL)
        .then((valorTexto: string) => {
          resolve(valorTexto);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  private getRutaEstilos() {
    // return "https://movilizate.fundaciondelamujer.com:55698/css/";
    return new Promise<string>((resolve, reject) => {
      Movilizate.instance
        .getConfiguration(ID_PARAM_RUTA_ESTILOS)
        .then((valorTexto: string) => {
          resolve(valorTexto);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  private getCorreoAdmin() {
    return "desarrollo@fundaciondelamujer.com";
    return new Promise<string>((resolve, reject) => {
      Movilizate.instance
        .getConfiguration(ID_PARAM_CORREO_ADMIN)
        .then((valorTexto: string) => {
          resolve(valorTexto);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * Funcion que se encarga de buscar los tipos de riesgos que deben enviar correos
   */
  private tipoRiesgoEnviaCorreo() {
    return new Promise<IParametroValorEnvioCorreoEmail[]>((resolve, reject) => {
      Topaz.instance
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
      Topaz.instance
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
