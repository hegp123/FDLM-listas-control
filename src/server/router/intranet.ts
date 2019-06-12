import { Router, Request, Response } from "express";
import * as log from "../../log/logger";
const logger = log.logger(__filename);

const intranet = Router();

intranet.get("/i/getListaDeControl", (req: Request, res: Response) => {
  logger.info("-----------INTRANET-----------");
  logger.info(JSON.stringify(req.body));
  logger.info("----------------------");

  res.status(200).json({
    ok: true,
    testService: "OK",
    body: JSON.stringify(req.body) || "No hay nada en el body"
  });
});

export default intranet;
