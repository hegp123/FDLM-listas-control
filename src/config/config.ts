// CONFIGURACION DEL PUERTO DE LA APLICACION
export const PORT = 3000;

// CONFIGURACION DE LA CONEXION A LA BASE DE DATOS
export const DATA_BASE_CONFIG = {
  server: "172.28.101.2",
  port: 1435,
  database: "FDLM",
  user: "topaz",
  password: "FmmbTop7",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// CONFIGURACION DE LAS CREDENCIALES DE CORREO ELECTRONICO SALIENTE
export const EMAIL_CONFIG = {
  host: "smtp.gmail.com",
  port: 465, //587
  user: "hectoregarciap@gmail.com",
  password: "XXXXX",
  service: "gmail",
  secure: true // true for 465, false for other ports
};

// CONFIGURACION DEL CONSUMO DEL WEB SERVICE DE COMPLIANCE
// https://app.compliance.com.co/validador/api/ConsultaConsolidadaService/consultaConsolidada/soloRiesgo/false
export const COMPLIANCE_WS_CONFIG = {
  baseURL: "https://app.compliance.com.co/validador/api",
  url: "/ConsultaConsolidadaService/consultaConsolidada/soloRiesgo/false",
  auth: {
    username: "desarrollo@fundaciondelamujer.com",
    password: "Fundacion2019"
  },
  timeout: 120000,
  responseEncoding: "utf8"
};

//CONFIGURACION DEL LOG
export const LOG_PATH = "M:/FDLM/Listas de Control/log/";
export const LOG_FILE = "log.log";
export const SHOW_FULL_FILE_PATH = false;
