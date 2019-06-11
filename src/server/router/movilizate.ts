import { Router, Request, Response } from "express";

const movilizate = Router();

movilizate.get("/m/getListaDeControl", (req: Request, res: Response) => {
  console.log("-----------MOVILIZATE-----------");
  console.log(JSON.stringify(req.body));
  console.log("----------------------");

  res.status(200).json({
    ok: true,
    testService: "OK",
    body: JSON.stringify(req.body) || "No hay nada en el body"
  });
});

export default movilizate;
