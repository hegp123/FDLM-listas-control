import { Router, Request, Response } from "express";
import * as log from "../../log/logger";
const logger = log.logger(__filename);

const movilizate = Router();

movilizate.get("/m/getListaDeControl", (req: Request, res: Response) => {
  logger.debug("-----------MOVILIZATE-----------");
  logger.debug(JSON.stringify(req.body));
  logger.debug("----------------------");

  res.status(200).json({
    ok: true,
    testService: "OK",
    body: JSON.stringify(req.body) || "No hay nada en el body"
  });
});

export default movilizate;
