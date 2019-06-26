// CONFIGURACION DEL PUERTO DE LA APLICACION
export const PORT = 3000;
export const FORMATO_FECHA = "dddd, D [de] MMMM [del] YYYY";
export const FUENTE_CONSULTA_COMPLIANCE = "COMPLIANCE";
export const FUENTE_CONSULTA_VIGIA = "VIGIA";
export const BODY_PLANTILLA_NOTIFICACION = "email.body";
export const MAX_TEXTO_PARA_DESCRIPCION_LISTA = 5000;

// CONFIGURACION DE LA CONEXION A LA BASE DE DATOS
export const DATA_BASE_CONFIG_MOVILIZATE = {
  server: "172.28.101.162",
  port: 1433,
  database: "movilizate",
  user: "Movilizate",
  password: "SqlXyz12345",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000
};

export const DATA_BASE_CONFIG_TOPAZ = {
  server: "172.28.101.2",
  port: 1436,
  database: "FDLM",
  user: "topaz",
  password: "FmmbTop7",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000
};

export const DATA_BASE_CONFIG_VIGIA = {
  server: "172.28.101.244",
  port: 1433,
  database: "VIGIAV2",
  user: "VIGIAWSDL",
  password: "VigiAFdlM2014",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000
};

// CONFIGURACION DE LAS CREDENCIALES DE CORREO ELECTRONICO SALIENTE
// estos son los id de la tabla configuracion de la base de tados movilizate,
//que es realmente donde esta configurados las credenciales para poder conectarse al servidor de base de datos
export const EMAIL_CONFIG = {
  idParamDomainMail: 11,
  idParamDomainUser: 12,
  idParamDomainPassword: 13,
  idParamServerMail: 14,
  idParamPortMail: 15,
  idParamCorreosErrorMail: 20,
  idParamAsuntoErrorMail: 21,
  idParamSupportMail: 22
};
export const EMAIL_TEST_CONECTIVIDAD = false;
export const ID_PARAM_CORREOS_LISTAS_CONTROL_MAIL = "34";
export const ID_PARAM_ASUNTO_LISTAS_CONTROL_MAIL = "35";
export const ID_PARAM_RUTA_ESTILOS = "37";
export const ID_PARAM_CORREO_ADMIN = "nuevo registro, aun no sabemos el id";
export const EMAIL_CONFIG_HECTOR = {
  host: "smtp.gmail.com",
  port: 465, //587
  auth: {
    user: "hectoregarciap@gmail.com",
    pass: "XXXXX"
  },
  service: "gmail",
  secure: true, // true for 465, false for other ports
  from: "hectoregarciap@hotmail.com",
  sender: "Hectorrrrrrrrrrrrrr"
  // logger: true,
  // debug: true
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
export const LOG_FILE = "listas-control-ws";
export const SHOW_FULL_FILE_PATH = false;
