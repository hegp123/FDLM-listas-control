import * as nodemailer from "nodemailer";
import { SentMessageInfo } from "nodemailer/lib/sendmail-transport";
import { EMAIL_CONFIG } from "../config/config";
import { Address } from "nodemailer/lib/mailer";

export default class EMail {
  private static _instance: EMail;
  private transporter: any;

  public static get instance() {
    return this._instance || (this._instance = new this());
  }

  constructor() {
    console.log("Clase EMail Inicializada !");
    this.transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.password
      },
      service: EMAIL_CONFIG.service
      // tls: { rejectUnauthorized: false },
    });
  }

  static sendMail(
    to: string | Address | Array<string | Address>,
    subject: string,
    htmlBody: string,
    cc?: string | Address | Array<string | Address>,
    bcc?: string | Address | Array<string | Address>
  ) {
    let mailOptions = {
      from: EMAIL_CONFIG.user,
      to,
      cc,
      bcc,
      subject,
      html: htmlBody // html body
    };

    // console.log(this.transporter);

    this.instance.transporter.sendMail(mailOptions, (err: Error, info: SentMessageInfo) => {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
        console.log("Message sent: %s", info.messageId);
      }
    });
  }
}
