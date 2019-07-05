import { Router, Request, Response } from "express";
import bodyParser = require("body-parser");
import ListaControl from "../../business-logic/lista-control";
var urlencodedParser = bodyParser.urlencoded({ extended: false });

import * as log from "../../log/logger";
const logger = log.logger(__filename);

const movilizate = Router();

/* movilizate.get("/m/getListaDeControl", (req: Request, res: Response) => {
  logger.debug("-----------MOVILIZATE-----------");
  logger.debug(JSON.stringify(req.body));
  logger.debug("----------------------");

  res.status(200).json({
    ok: true,
    testService: "OK",
    body: JSON.stringify(req.body) || "No hay nada en el body"
  });
}); */

movilizate.post("/m/getListaDeControl", urlencodedParser, (req: Request, res: Response) => {
  let body = req.body;
  let body_NumeroSolicitud: number = body.NumeroSolicitud;
  delete body.NumeroSolicitud;
  // logger.info("Body:  " + JSON.stringify(body));
  // logger.info("NumeroSolicitud:  " + JSON.stringify(body_NumeroSolicitud));
  let listaControl = ListaControl.instance;
  listaControl
    .getListaControl(body, body_NumeroSolicitud)
    .then((resp: any) => {
      logger.info("WS: getListaControl:then1=> " + JSON.stringify(resp.ok));
      res.status(200).json({
        ok: true,
        message: "El proceso terminó exitosamente.",
        // data: body,
        response: resp.response
      });
    })
    .catch(error => {
      logger.error(error.errorMessage);
      res.status(500).json({
        ok: false,
        errorMessage: error
        // data: body
      });
    });
});

export default movilizate;
