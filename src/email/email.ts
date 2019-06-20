import * as nodemailer from "nodemailer";
import { SentMessageInfo } from "nodemailer/lib/sendmail-transport";
import { EMAIL_CONFIG, EMAIL_TEST_CONECTIVIDAD, EMAIL_CONFIG_HECTOR } from "../config/config";
import { Address } from "nodemailer/lib/mailer";
import * as log from "../log/logger";
var hbs = require("nodemailer-express-handlebars");
import Movilizate, { IEmailConfiguration } from "../business-logic/movilizate";
const logger = log.logger(__filename);
import path from "path";

export default class EMail {
  private static _instance: EMail;
  private transporter: any;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.debug("Clase EMail Inicializada !");
    this.getEmailConfiguration()
      .then((emailConfiguration: any) => {
        logger.warn("emailConfiguration => " + JSON.stringify(emailConfiguration));
        this.transporter = nodemailer.createTransport(emailConfiguration);

        // verify connection configuration
        if (EMAIL_TEST_CONECTIVIDAD) {
          logger.info("Haciendo el test de conectividad con el servidor de correo");
          this.transporter.verify(function(error: Error, success: any) {
            if (error) {
              if (error.message.indexOf("ETIMEDOUT") >= 0) {
                logger.error("La aplicación no tiene permisos para acceder al servidor de correos.  Message: " + error.message);
              } else {
                logger.error(error.message);
              }
            } else {
              logger.info("La conexion al servidor de correos es exitosa.");
            }
          });
        }
      })
      .catch(error => {
        logger.error(error.message);
      });
  }

  private getEmailConfiguration() {
    // logger.warn("REVISANDO  => " + this.emailConfiguration);
    return new Promise<any>((resolve, reject) => {
      Movilizate.instance
        .getEmailConfiguration()
        .then((results: IEmailConfiguration[]) => {
          const emailConfiguracion = {
            host: results.filter(res => res.idConfiguracion === EMAIL_CONFIG.idParamServerMail)[0].ValorTexto, //this.getValue(results, EMAIL_CONFIG.idParamServerMail),
            port: results.filter(res => res.idConfiguracion === EMAIL_CONFIG.idParamPortMail)[0].ValorTexto, //this.getValue(results, EMAIL_CONFIG.idParamPortMail),
            auth: {
              user: results.filter(res => res.idConfiguracion === EMAIL_CONFIG.idParamDomainMail)[0].ValorTexto, //this.getValue(results, EMAIL_CONFIG.idParamDomainMail),
              pass: results.filter(res => res.idConfiguracion === EMAIL_CONFIG.idParamDomainPassword)[0].ValorTexto //this.getValue(results, EMAIL_CONFIG.idParamDomainPassword)
            },
            from: results.filter(res => res.idConfiguracion === EMAIL_CONFIG.idParamDomainMail)[0].ValorTexto, //this.getValue(results, EMAIL_CONFIG.idParamDomainMail),
            sender: results.filter(res => res.idConfiguracion === EMAIL_CONFIG.idParamDomainUser)[0].ValorTexto //this.getValue(results, EMAIL_CONFIG.idParamDomainUser)
            // logger: true,
            // debug: true
          };
          logger.error("00000000 PILAS NO OLVIDES QUITAR ESTA LINEA Y BORRAR MI CONTRASEÑA");
          // resolve(emailConfiguracion);
          resolve(EMAIL_CONFIG_HECTOR);
        })
        .catch((error: Error) => {
          logger.error(error);
          reject({ ok: false, error });
        });
    });
  }

  static sendMail(
    to: string | Address | Array<string | Address>,
    subject: string,
    htmlBody: string,
    isTemplate: boolean = false,
    cc?: string | Address | Array<string | Address>,
    bcc?: string | Address | Array<string | Address>
  ) {
    let mailOptions: any = {
      // from: "hectoregarciap@hotmail.com",
      to,
      cc,
      bcc,
      subject,
      html: htmlBody
    };
    logger.debug(":::::::::::::::>  " + mailOptions.html);
    //si es plantilla ajustamos el mailOptions
    if (isTemplate) {
      let options = {
        viewEngine: {
          extname: ".hbs",
          layoutsDir: path.join(__dirname, "templates"),
          defaultLayout: "template",
          partialsDir: path.join(__dirname, "templates/partials/")
        },
        viewPath: path.join(__dirname, "templates"),
        extName: ".hbs"
      };
      this.instance.transporter.use("compile", hbs(options));
      //quitamos el atributo html, y adicionamos template y context.... para que funcione con plantillas
      delete mailOptions.html;
      mailOptions.template = htmlBody; //cuando es template, en la variable htmlBody viene el nombre de la plantilla
      mailOptions.context = {
        rutaEstilos: "https://movilizate.fundaciondelamujer.com:55698/css/",
        fecha: "10 de junio del 2019",
        correoAdmin: "desarrollo@fundaciondelamujer.com",
        fuenteConsulta: "Compliance y/o Vigia.... esto debe ser automatico :)",
        aplicacion: "Movilízate",
        usuario: "HGARCIA ",
        oficina: "Bucaramanga"
      };
      // Object.keys(mailOptions).map(
      //   function(object){
      //     json[object]["newKey"]='newValue'
      // });
      // mailOptions.map(i => (i.Country = "Nepal"));
      // var obj: any = {};
      // obj["name"] = "value";
      // obj["anotherName"] = "anotherValue";
    }

    logger.debug(":::::::::::::::>  " + mailOptions.html);
    this.instance.transporter.sendMail(mailOptions, (err: Error, info: SentMessageInfo) => {
      if (err) {
        logger.error("#####2 " + err);
      } else {
        logger.debug(info);
        logger.debug("Message sent: %s", info.messageId);
      }
    });
  }

  static sendMailTemplate(
    to: string | Address | Array<string | Address>,
    subject: string,
    templateName: string,
    cc?: string | Address | Array<string | Address>,
    bcc?: string | Address | Array<string | Address>
  ) {
    this.sendMail(to, subject, templateName, true, cc, bcc);
    // let options = {
    //   viewEngine: {
    //     extname: ".hbs",
    //     layoutsDir: path.join(__dirname, "templates"),
    //     defaultLayout: "template",
    //     partialsDir: path.join(__dirname, "templates/partials/")
    //   },
    //   viewPath: path.join(__dirname, "templates"),
    //   extName: ".hbs"
    // };
    // this.instance.transporter.use("compile", hbs(options));
    // //send mail with options
    // var mailOptions = {
    //   from: "hectoregarciap@gmail.com",
    //   to,
    //   subject,
    //   template: "email.body",
    //   context: {
    //     rutaEstilos: "https://movilizate.fundaciondelamujer.com:55698/css/",
    //     fecha: "10 de junio del 2019",
    //     correoAdmin: "desarrollo@fundaciondelamujer.com",
    //     fuenteConsulta: "Compliance y/o Vigia.... esto debe ser automatico :)",
    //     aplicacion: "Movilízate",
    //     usuario: "HGARCIA ",
    //     oficina: "Bucaramanga"
    //   }
    // };
    // this.instance.transporter.sendMail(mailOptions),
    //   function(error: any, response: any) {
    //     console.log("mail sent to " + to);
    //   };
  }
}
