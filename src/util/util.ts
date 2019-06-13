export function toArray(obj: any) {
  let array: any = [];
  Object.keys(obj).forEach(key => {
    array.push(obj[key]);
  });
  return array;
}
