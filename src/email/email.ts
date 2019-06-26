import * as nodemailer from "nodemailer";
import { SentMessageInfo } from "nodemailer/lib/sendmail-transport";
import { EMAIL_CONFIG, EMAIL_TEST_CONECTIVIDAD, EMAIL_CONFIG_HECTOR } from "../config/config";
import { Address } from "nodemailer/lib/mailer";
import * as log from "../log/logger";
var hbs = require("nodemailer-express-handlebars");
import Movilizate, { IEmailConfiguration } from "../business-logic/movilizate";
const logger = log.logger(__filename);
import path from "path";
import { TEMPLATE_NOTIFICACION_CORREO } from "../constants/Constantes";
import { IMailOptionsContext } from "../business-logic/compliance";
import { Helpers } from "./helpers";

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

  /**
   * Funcion que envia correos con plantillas
   * @param to
   * @param subject
   * @param cc
   * @param bcc
   */
  static sendMailTemplate({
    to,
    subject,
    cc,
    bcc,
    mailOptionsTemplateBody,
    mailOptionsContext
  }: {
    to: string | Address | Array<string | Address>;
    subject: string;
    cc?: string | Address | Array<string | Address>;
    bcc?: string | Address | Array<string | Address>;
    mailOptionsTemplateBody: string;
    mailOptionsContext: IMailOptionsContext;
  }) {
    this.sendMail({ to, subject, isTemplate: true, cc, bcc, mailOptionsTemplateBody, mailOptionsContext });
  }

  /**
   *
   * @param to
   * @param subject
   * @param htmlBody: html plano
   * @param isTemplate: si es true,vSdebemos utilizar los campos  mailOptionsTemplateBody y mailOptionsContext
   * @param cc
   * @param bcc
   */
  static sendMail({
    to,
    subject,
    htmlBody,
    isTemplate = false,
    cc,
    bcc,
    mailOptionsTemplateBody,
    mailOptionsContext
  }: {
    to: string | Address | Array<string | Address>;
    subject: string;
    htmlBody?: string;
    isTemplate?: boolean;
    cc?: string | Address | Array<string | Address>;
    bcc?: string | Address | Array<string | Address>;
    mailOptionsTemplateBody?: string;
    mailOptionsContext?: IMailOptionsContext;
  }) {
    let mailOptions: any = {
      // from: "hectoregarciap@hotmail.com",
      to,
      cc,
      bcc,
      subject,
      html: htmlBody
    };
    //si es plantilla ajustamos el mailOptions por referencia
    if (isTemplate) {
      this.converterMailOptionsToTemplate(mailOptions, mailOptionsTemplateBody, mailOptionsContext);
    }

    this.instance.transporter.sendMail(mailOptions, (err: Error, info: SentMessageInfo) => {
      if (err) {
        logger.error(err.message);
      } else {
        logger.debug(info);
        logger.debug("Message sent: " + info.messageId);
      }
    });
  }

  /**
   * Funcion que convierte la configuracion mailOptions para que soporte la plantilla
   * elimina el objeto html y adiciona dos mas: template y context, que son necesario para que soporte plantilla de correos
   * @param mailOptions Datos de configuracion: to, cc, bcc, subject, html: htmlBody
   * @param mailOptionsTemplateBody Esta el nombre del archivo de la plantilla, por ejemplo: email.body
   */
  private static converterMailOptionsToTemplate(
    mailOptions: any,
    mailOptionsTemplateBody: string = "",
    mailOptionsContext: IMailOptionsContext = {}
  ) {
    let options = {
      viewEngine: {
        extname: ".hbs",
        layoutsDir: path.join(__dirname, "templates"),
        defaultLayout: TEMPLATE_NOTIFICACION_CORREO,
        partialsDir: path.join(__dirname, "templates/partials/"),
        helpers: Helpers
      },
      viewPath: path.join(__dirname, "templates"),
      extName: ".hbs"
    };

    this.instance.transporter.use("compile", hbs(options));
    //quitamos el atributo html, y adicionamos template y context.... para que funcione con plantillas
    delete mailOptions.html;
    mailOptions.template = mailOptionsTemplateBody; //nombre del body q usa la plantilla
    mailOptions.context = mailOptionsContext;
  }
}
