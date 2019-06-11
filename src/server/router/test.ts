import { Router, Request, Response } from "express";
import bodyParser = require("body-parser");
import Compliance from "../../business-logic/compliance";
import EMail from "../../common/email";
import MsSqlServer from "../../database/sqlserver";
import { RequestError } from "mssql";

const test = Router();

test.get("/conectivity", (req: Request, res: Response) => {
  MsSqlServer.ejecutarQuery("select 1")
    .then(results => {
      res.status(200).json({
        ok: true,
        message: "Conectado a la Base de Datos. test con el query: SELECT 1",
        resultQuery: JSON.stringify(results)
      });
    })
    .catch((error: RequestError) => {
      console.log(error);
      res.status(200).json({
        ok: false,
        message: error
      });
    });
});

test.get("/getListaControl", (req: Request, res: Response) => {
  console.log("WS: getListaControl");
  let data = req.query;
  console.log(data);

  let compliance = Compliance.instance;
  compliance
    .getListaControl(data)
    .then((resp: any) => {
      console.log("WS: getListaControl:then1=> " + JSON.stringify(resp.ok));
      if (resp.ok) {
        // no hacemos nada, por ahora, todo debio salir perfecto
        //simplemente mandamos la misma respuesta, que es el resultado de la consulta
        return resp;
      } else {
        //NO pudo consultar en compliance, entonces vamos a VIGIA
        return {
          ok: false,
          errorMessage: "No se pudo consultar en compliance, ahora vamos para VIGIA, este mensaje es temporal"
        };
      }
    })
    .then((resp: any) => {
      console.log("WS: getListaControl:then2=> " + JSON.stringify(resp.ok));
      if (resp.ok) {
        //proceso exitosamente la informacion, independientemente si es de compliance o VIGIA
        res.status(200).json({
          ok: true,
          message: "El proceso terminó exitosamente.",
          data,
          response: resp.response
        });
      } else {
        //hubo un problema en el proceso
        res.status(500).json({
          ok: false,
          errorMessage: "500 Internal Server Error.",
          data
        });
      }
    })
    .catch(error => {
      console.log(error);
    });
});

test.get("/compliance", (req: Request, res: Response) => {
  let query = req.query;
  console.log(query);
  res.status(200).json({
    ok: true,
    query
  });
});

test.get("/compliance/:doc", (req: Request, res: Response) => {
  let param = req.params;
  console.log(param);
  res.status(200).json({
    ok: true,
    param
  });
});

var urlencodedParser = bodyParser.urlencoded({ extended: false });
test.post("/compliance", urlencodedParser, (req: Request, res: Response) => {
  let body = req.body;
  console.log(body);
  res.status(200).json({
    ok: true,
    body
  });
});

test.get("/sendemail", (req: Request, res: Response) => {
  EMail.sendMail("hectoregarciap@gmail.com", "Test - Email", "<h1>Hola mundo!!</h1> <h3>Email en formato html</h3>");

  res.status(200).json({
    ok: true,
    testService: "Email enviado !!!"
  });
});

export default test;
