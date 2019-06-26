import { Router, Request, Response } from "express";
import bodyParser = require("body-parser");
import EMail from "../../email/email";
import MsSqlServer from "../../database/sqlserver";
import { RequestError } from "mssql";
import * as log from "../../log/logger";
import Movilizate from "../../business-logic/movilizate";
import ListaControl from "../../business-logic/lista-control";
const logger = log.logger(__filename);

const test = Router();

test.get("/conectivity", (req: Request, res: Response) => {
  MsSqlServer.ejecutarQuery("select 1", MsSqlServer.instance.getDataBaseMovilizate())
    .then(results => {
      res.status(200).json({
        ok: true,
        message: "Conectado a la Base de Datos. test con el query: SELECT 1",
        resultQuery: JSON.stringify(results)
      });
    })
    .catch((error: RequestError) => {
      logger.error(error);
      res.status(200).json({
        ok: false,
        message: error
      });
    });
});

test.get("/getListaControl", (req: Request, res: Response) => {
  logger.info("WS: getListaControl");
  let data = req.query;
  // logger.info(data);

  // let compliance = Compliance.instance;
  // compliance
  let listaControl = ListaControl.instance;
  listaControl
    .getListaControl(data, 12345)
    .then((resp: any) => {
      logger.info("WS: getListaControl:then1=> " + JSON.stringify(resp.ok));
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
      logger.info("WS: getListaControl:then2=> " + JSON.stringify(resp.ok));
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
      logger.error(error.errorMessage);
      res.status(500).json({
        ok: false,
        errorMessage: error,
        data
      });
    });
});

test.get("/compliance", (req: Request, res: Response) => {
  let query = req.query;
  logger.info(JSON.stringify(query));
  res.status(200).json({
    ok: true,
    query
  });
});

test.get("/compliance/:doc", (req: Request, res: Response) => {
  let param = req.params;
  logger.info(JSON.stringify(param));
  res.status(200).json({
    ok: true,
    param
  });
});

var urlencodedParser = bodyParser.urlencoded({ extended: false });
test.post("/compliance", urlencodedParser, (req: Request, res: Response) => {
  let body = req.body;
  logger.info(JSON.stringify(body));
  res.status(200).json({
    ok: true,
    body
  });
});

test.get("/sendemail", (req: Request, res: Response) => {
  EMail.sendMail({
    to: "hectoregarciap@gmail.com",
    subject: "Test - Email",
    htmlBody: "<h1>Hola mundo!!</h1> <h3>Email en formato html</h3>"
  });

  res.status(200).json({
    ok: true,
    testService: "Email enviado !!!"
  });
});

test.get("/sendemailtemplate", (req: Request, res: Response) => {
  EMail.sendMailTemplate({
    to: "hectoregarciap@gmail.com",
    subject: "Test - Email",
    mailOptionsTemplateBody: "email.body",
    mailOptionsContext: {
      rutaEstilos: "https://movilizate.fundaciondelamujer.com:55698/css/",
      fecha: "10 de junio del 2019",
      correoAdmin: "desarrollo@fundaciondelamujer.com",
      fuenteConsulta: "Compliance y/o Vigia.... esto debe ser automatico :)",
      aplicacion: "Movilízate",
      usuario: "HGARCIA ",
      oficina: "Bucaramanga",
      cliente: {
        nombre: "HECTOR EDUARDO GARCIA PICON",
        identificacion: "7573655"
      }
    }
  });

  res.status(200).json({
    ok: true,
    testService: "Email enviado !!!"
  });
});

test.get("/getConfiguraciones", (req: Request, res: Response) => {
  Movilizate.instance
    .getEmailConfiguration()
    .then((results: any) => {
      res.status(200).json({
        ok: true,
        resultQuery: results
      });
    })
    .catch((error: RequestError) => {
      logger.error(error);
      res.status(200).json({
        ok: false,
        message: error
      });
    });
});

test.get("/getConfiguracion/:idConfiguracion", (req: Request, res: Response) => {
  let idConfiguracion = req.params.idConfiguracion;
  logger.info("idConfiguracion=> " + idConfiguracion);
  let sql: string =
    "set transaction isolation level read uncommitted select ValorTexto from Configuracion where idConfiguracion = " + idConfiguracion;
  MsSqlServer.ejecutarQuery(sql, MsSqlServer.instance.getDataBaseMovilizate())
    .then((results: any) => {
      res.status(200).json({
        ok: true,
        resultQuery: results[0].ValorTexto
      });
    })
    .catch((error: RequestError) => {
      logger.error(error);
      res.status(200).json({
        ok: false,
        message: error
      });
    });
});

export default test;
