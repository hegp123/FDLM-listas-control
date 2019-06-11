import { Router, Request, Response } from "express";

const router = Router();

// middleware that is specific to this router
// este se debe colocar en cada archivo de rutas si se desea rastrear las peticiones o filtrarlas y/o bloquearlas
router.use(function timeLog(req, res, next) {
  console.log("Time: ", Date.now());
  console.log("===> " + req.body);
  next();
});

export default router;
