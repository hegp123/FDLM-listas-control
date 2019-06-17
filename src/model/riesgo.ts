export class Riesgo {
  amenaza: string = "";
  code: number = 0;
  tipoRestriccion: string = "";
  generaComunicacion: boolean = false;

  noTiene = {
    amenaza: "No existen coincidencias",
    code: 0,
    tipoRestriccion: "Aceptar vinculación",
    generaComunicacion: false
  };

  bajo = {
    amenaza: "Bajo",
    code: 1,
    tipoRestriccion: "Análisis de vinculación",
    generaComunicacion: true
  };

  medio = {
    amenaza: "Medio",
    code: 2,
    tipoRestriccion: "Escalar al área de Riesgo",
    generaComunicacion: true
  };

  alto = {
    amenaza: "Alto",
    code: 3,
    tipoRestriccion: "Rechazar vinculación",
    generaComunicacion: true
  };
}
