import axios from "axios";
import { COMPLIANCE_WS_CONFIG } from "../config/config";
import * as log from "../log/logger";
const logger = log.logger(__filename);

const instance = axios.create(COMPLIANCE_WS_CONFIG);

export let getListaControlWS = (dataToConsult: IComplianceRequest) => {
  logger.debug("SERVICE: getListaControl");
  return new Promise((resolve, reject) => {
    instance
      .post(COMPLIANCE_WS_CONFIG.url, dataToConsult)
      .then(response => {
        let responseData: IComplianceResponse = response.data;
        // logger.debug("SERVICE: response" + JSON.stringify(responseData));
        if (response) {
          resolve({
            ok: true,
            response: responseData
          });
        }
      })
      .catch(error => {
        logger.error("SERVICE: error" + error);
        resolve({
          ok: false,
          errorMessage: error
        });
      });
  });
};

export interface IComplianceRequest {
  datoConsultar: string;
  /**
   * Cuando el tipo de documento sea pasaporte, tiene que colocarse el nombre
   * --------------
   * {
   * "datoConsultar":"R123456",
   * "tipoDocumento":"pa",
   * "nombrePasaporte":"JUAN MANUEL SANTOS CALDERON"
   * }
   */
  tipoDocumento: IComplianceTipoDocumento;
  /**
   * nombrePasaporte
   * Si el tipo de documento es Pasaporte (“pa”), se debe enviar como parámetro adicional, el nombre de la persona, ejemplo:
   */
  nombrePasaporte: string; // solo cuando el tipoDocumento es ps: Pasaporte
  /**
   * url
   * El servicio retorna un código 201 (CREATED) cuando se registra correctamente la consulta. De lo
   * contrario, retorna un código 400 (BAD REQUEST) y un JSON con el atributo error que contiene el
   * mensaje.
   * Una vez finalizada la consulta, el sistema envía automáticamente a la URL enviada en la petición y
   * con un llamado POST, la estructura JSON con toda la información (lista, tipo, presentaRiesgo,
   * presentaAdvertencia, descricpion, etc) como se describió en los puntos anteriores.
   */
  url: string; //solo para llamados asincronos, explicacion abajo
}

interface IComplianceTipoDocumento {
  cc: string; //Cédula de Ciudadanía"
  cd: string; //Carnet Diplomático"
  ce: string; //Cédula de Extranjería"
  nit: string; //NIT"
  nom: string; //Nombre"
  pa: string; //Pasaporte"
  rc: string; //Registro Civil"
  ti: string; //Tarjeta de Identidad"
}

export interface IComplianceResponse {
  idDatoConsultado: number;
  tipoDocumento: string;
  resultados: IComplianceResponseResultados[];
  totalFuentesConError: number;
  datoConsultado: string; // numero de documento
  totalFuentesConsultadas: number;
  idConsulta: number;
  nombre: string;
  tieneResultados: boolean;
  presentaRiesgo: boolean;
}

export interface IComplianceResponseResultados {
  lista: string;
  /**
   * Arreglo de Strings que contiene el detalle retornado
   * por la fuente. Como la estructura de datos es variable
   * dependiendo de la fuente, las columnas se separan por
   * pipes “|” y las filas por salto de línea “\n”.
   * ------
   * cuando no tiene descripcion puede venir asi
   * -> "descripcion": [],
   * -> "descripcion": [ "sinResultados: XXXXXXX"	]
   */
  descripcion: string; //ver explicacion abajo
  tipo: string;
  duracion: number; // no estaba en la documentacion
  presentaRiesgo: boolean;
  tieneResultados: boolean; // no estaba en la documentacion
  presentaAdvertencia: boolean;
  error: string;
}
