import { Router, Request, Response } from "express";

const intranet = Router();

intranet.get("/i/getListaDeControl", (req: Request, res: Response) => {
  console.log("-----------INTRANET-----------");
  console.log(JSON.stringify(req.body));
  console.log("----------------------");

  res.status(200).json({
    ok: true,
    testService: "OK",
    body: JSON.stringify(req.body) || "No hay nada en el body"
  });
});

export default intranet;
