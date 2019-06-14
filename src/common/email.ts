import * as nodemailer from "nodemailer";
import { SentMessageInfo } from "nodemailer/lib/sendmail-transport";
import { EMAIL_CONFIG } from "../config/config";
import { Address } from "nodemailer/lib/mailer";
import * as log from "../log/logger";
import Movilizate from "../business-logic/movilizate";
const logger = log.logger(__filename);

export default class EMail {
  private static _instance: EMail;
  private transporter: any;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    logger.info("Clase EMail Inicializada !");
    this.getEmailConfiguration()
      .then((emailConfiguration: any) => {
        logger.warn("emailConfiguration => " + JSON.stringify(emailConfiguration));
        this.transporter = nodemailer.createTransport(emailConfiguration);
        // verify connection configuration
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
        .then((results: any) => {
          const emailConfiguracion = {
            host: this.getValue(results, EMAIL_CONFIG.idParamServerMail),
            port: this.getValue(results, EMAIL_CONFIG.idParamPortMail),
            auth: {
              user: this.getValue(results, EMAIL_CONFIG.idParamDomainMail),
              pass: this.getValue(results, EMAIL_CONFIG.idParamDomainPassword)
            },
            from: this.getValue(results, EMAIL_CONFIG.idParamDomainMail),
            sender: this.getValue(results, EMAIL_CONFIG.idParamDomainUser)
            // logger: true,
            // debug: true
          };
          resolve(emailConfiguracion);
        })
        .catch((error: Error) => {
          logger.error(error);
          reject({ ok: false, error });
        });
    });
  }

  private getValue(results: any, id: number) {
    let value = "";
    results.forEach((confi: any) => {
      if (confi.idConfiguracion === id) {
        value = confi.ValorTexto;
        return;
      }
    });
    return value;
  }

  static sendMail(
    to: string | Address | Array<string | Address>,
    subject: string,
    htmlBody: string,
    cc?: string | Address | Array<string | Address>,
    bcc?: string | Address | Array<string | Address>
  ) {
    let mailOptions = {
      to,
      cc,
      bcc,
      subject,
      html: htmlBody // html body
    };

    this.instance.transporter.sendMail(mailOptions, (err: Error, info: SentMessageInfo) => {
      if (err) {
        logger.error("#####2 " + err);
      } else {
        logger.info(info);
        logger.info("Message sent: %s", info.messageId);
      }
    });
  }
}
