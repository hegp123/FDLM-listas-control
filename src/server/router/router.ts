import { Router, Request, Response } from "express";
import * as log from "../../log/logger";
const logger = log.logger(__filename);

const router = Router();

// middleware that is specific to this router
// este se debe colocar en cada archivo de rutas si se desea rastrear las peticiones o filtrarlas y/o bloquearlas
router.use(function timeLog(req, res, next) {
  logger.info("Time: ", Date.now());
  logger.info("===> " + req.body);
  next();
});

export default router;
