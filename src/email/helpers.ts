import { RIESGO_ALTO, RIESGO_MEDIO } from "../constants/Constantes";
import { MAX_TEXTO_PARA_DESCRIPCION_LISTA } from "../config/config";

export const Helpers = {
  incremento: (value: string, options: any) => {
    return parseInt(value) + 1;
  },

  procesarTextoDescripcion: (riesgo: string) => {
    return `<div>${riesgo.substring(0, MAX_TEXTO_PARA_DESCRIPCION_LISTA)}</div>`;
  },

  formatearTextoRiesgo: (riesgo: string, texto: string) => {
    if (riesgo === RIESGO_ALTO.toString()) {
      return `<div style="color: red; font-weight: bold;">${texto}</div>`;
    } else if (riesgo === RIESGO_MEDIO.toString()) {
      return `<div style="color: orange;">${texto}</div>`;
    }
    return `<div>${texto}</div>`;
  }
};
