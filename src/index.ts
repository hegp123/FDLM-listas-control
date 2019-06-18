import Server from "./server/server";
import test from "./server/router/test";
import router from "./server/router/router";
import movilizate from "./server/router/movilizate";
import intranet from "./server/router/intranet";
import MsSqlServer from "./database/sqlserver";
import { PORT } from "./config/config";
import * as log from "./log/logger";
import EMail from "./email/email";
const logger = log.logger(__filename);

//inicializando el servidor
const server = Server.init(PORT);
//importando las rutas de los servicios REST
server.app.use(test);
server.app.use(router);
server.app.use(movilizate);
server.app.use(intranet);

//Conexion a la base de datos, cuando arranca el server
let initialize = MsSqlServer.instance;

initialize
  .conectarDBMovilizate()
  .then(() => {
    return initialize.conectarDBVigia();
  })
  .then(() => {
    return initialize.conectarDBTopaz();
  })
  .then(() => {
    //establecemos los parametros para que se conecte al servidor de correos
    EMail.instance;
    //Corriendo el servidor, solo si se pudo conectar a la base de datos
    server.start(() => {
      logger.info("Servidor corriendo en el puerto " + PORT);
    });
  })
  .catch(error => {
    logger.error(error.message);
    throw error;
  });
