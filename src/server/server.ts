import express = require("express");
var bodyParser = require("body-parser");
import path = require("path");
import cors = require("cors"); 
export default class Server {
  public app: express.Application;
  public port: number;

  constructor(port: number) {
    this.port = port;
    this.app = express();
  }

  static init(port: number) {
    return new Server(port);
  }

  private publicFolder() {
    const publicPath = path.resolve(__dirname, "../public");
    this.app.use(express.static(publicPath));
  }

  private bodyParse() {
    // parse application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({ extended: false }));
    // parse application/json
    this.app.use(bodyParser.json());
    this.app.use(cors());
  }

  start(callback: Function) {
    this.app.listen(this.port, callback());
    this.publicFolder();
    this.bodyParse();
  }
}
