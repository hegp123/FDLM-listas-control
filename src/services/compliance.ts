import axios from "axios";
import { COMPLIANCE_WS_CONFIG } from "../config/config";
import * as log from "../log/logger";
const logger = log.logger(__filename);

const instance = axios.create(COMPLIANCE_WS_CONFIG);

export let getListaControlWS = (dataToConsult: IComplianceRequest) => {
  logger.info("SERVICE: getListaControl");
  return new Promise((resolve, reject) => {
    instance
      .post(COMPLIANCE_WS_CONFIG.url, dataToConsult)
      .then(response => {
        logger.info("SERVICE: response" + response.data);
        if (response) {
          resolve({
            ok: true,
            response: response.data
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
  tipoDocumento: string;
}

export interface IComplianceResponse {
  idDatoConsultado: number;
  tipoDocumento: string;
  resultados: IComplianceResponseResultados[];
  totalFuentesConError: number;
  datoConsultado: string;
  totalFuentesConsultadas: number;
  idConsulta: number;
  nombre: string;
  tieneResultados: boolean;
  presentaRiesgo: boolean;
}

interface IComplianceResponseResultados {
  lista: string;
  descripcion: string[];
  duracion: number;
  presentaRiesgo: boolean;
  tieneResultados: boolean;
  presentaAdvertencia: boolean;
}
