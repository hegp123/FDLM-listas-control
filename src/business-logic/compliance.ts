import { getListaControlWS, IComplianceRequest, IComplianceResponse } from "../services/compliance";

export default class Compliance {
  private static _instance: Compliance;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    console.log("Clase de comsumo a Compliance Inicializada !");
  }

  public getListaControl(dataToConsult: IComplianceRequest) {
    console.log("BI: getListaControl");
    return new Promise(async (resolve, reject) => {
      let listaControl: any = await getListaControlWS(dataToConsult);
      if (listaControl.ok) {
        //aca se va a procesar, osea a hacer la logica de negocio
        console.log("BI: ok");
        let processListaControl: any = await this.process(listaControl.response);
        if (processListaControl.ok) {
          //aca si sito va perfecto, osea se pudo consultar y procesar la logica de negocio
          console.log("BI: processListaControl.ok");
          resolve(processListaControl);
        } else {
          //aca revienta el proceso, no tiene sentido continuar si hay algun error en la logica de negocio
          console.log("BI: processListaControl.error" + processListaControl);
          reject(processListaControl);
        }
      } else {
        //aca debe venir un ok:false y el mensaje de error que viene del consumo al servicio
        console.log("BI: error" + listaControl);
        resolve(listaControl);
      }
    });
  }

  public process(response: IComplianceResponse) {
    console.log("BI: process");
    return new Promise((resolve, reject) => {
      //
      console.log("nombre: " + JSON.stringify(response.nombre));

      let anyError: boolean = false;
      if (!anyError) {
        resolve({ ok: true, response });
        console.log("BI: saliendo de process ok");
      } else {
        console.log("BI: saliendo de process error");
        resolve({ ok: false, errorMessage: "algun mensaje de error" });
      }
    });
  }
}
