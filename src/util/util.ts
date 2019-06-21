import moment from "moment";
import { FORMATO_FECHA } from "../config/config";

export function toArray(obj: any) {
  let array: any = [];
  Object.keys(obj).forEach(key => {
    array.push(obj[key]);
  });
  return array;
}

export let getFechaActual = () => {
  return moment(new Date())
    .locale("es")
    .format(FORMATO_FECHA);
};
