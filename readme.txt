## funcionalidades
- Conexion a multiples base de datos (Movilizate y vigia)
- Envio de correos
- plantilla para los correos
- Manejo de Log
- Consumo del web service de Compliance (REST)
- Creacion de servicios Rest
- utilizar plantillas para el body de los correos
- funciones para hacer consultas a las bases de datos

PILAS con el cors 

- falta crear un registro nuevo en movilizate.configuracion para guardar el correo admin;
            correoAdmin: "desarrollo@fundaciondelamujer.com",//
- guardar todo los registros que arroge la consulta de compliance
- Falta averiguar si tipo2 bloquea por contagio
- nuevo parametro: al que se le debe enviar el correo.. cumplimiento@fundaciondelamujer.com   


## prerequisitos
- Tener instalado nodejs:         Servidor de la aplicacion
- Que el servidor tenga permisos para ver la base de datos

## Comando para compilar la aplicacion, despues de haber hecho alguna mejora o ajuste al desarrollo
## Este comando genera el codigo que se necesita ejecutar ubicado en la carpeta /dist
$ npm run build


## Para correr la aplicacion
$ node dist/index





## SERVICIOS WEB

## probar conectividad con la base de datos
localhost:3000/conectivity

## obtiene las configuraciones de envio de correo
localhost:3000/getConfiguraciones

## probar envio de email
localhost:3000/sendemail

## obtiene la lista de riesgos de una persona
localhost:3000/getListaControl?datoConsultar=6361958&tipoDocumento=cc&nombrePasaporte=JUAN MANUEL SANTOS CALDERON